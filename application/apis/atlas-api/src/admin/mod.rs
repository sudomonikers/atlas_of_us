//Admin: tools for the people running the Atlas. Every route needs a Person with admin: true (see auth::AdminUser).
use std::fmt::Display;

use aws_sdk_s3::error::DisplayErrorContext;
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    routing::{get, post},
};
use chrono::{DateTime, Utc};
use futures::{StreamExt, stream};
use mail_builder::{MessageBuilder, headers::address::Address};
use mail_parser::{HeaderValue, Message, MessageParser, MimeHeaders};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AdminUser, state::AppState};

const MAIL_BUCKET: &str = "atlas-of-us-mail";
const INBOUND_PREFIX: &str = "inbound/";
const DOMAIN: &str = "atlas-of-us.com";
const DEFAULT_FROM: &str = "hello@atlas-of-us.com"; //when the email wasn't sent to one of our addresses (e.g. bcc)
const FROM_NAME: &str = "Atlas of Us";
const LIST_LIMIT: usize = 100; //newest first
const HEADER_BYTES: i64 = 64 * 1024; //enough of each message for the list's headers and preview, without attachments

pub fn router(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/emails", get(list_emails))
        .route("/emails/{id}", get(get_email))
        .route("/emails/{id}/reply", post(reply_to_email))
        //every route, including ones added later, is admin only
        .route_layer(middleware::from_extractor_with_state::<AdminUser, AppState>(state))
}

fn internal(e: impl Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "That email doesn't exist.".to_string())
}

#[derive(Serialize)]
pub struct Contact {
    name: Option<String>,
    address: String,
}

impl Contact {
    fn from_addr(addr: &mail_parser::Addr) -> Option<Self> {
        Some(Contact { name: addr.name().map(str::to_string), address: addr.address()?.to_string() })
    }

    fn all(address: Option<&mail_parser::Address>) -> Vec<Self> {
        address.map(|a| a.iter().filter_map(Contact::from_addr).collect()).unwrap_or_default()
    }

    fn first(address: Option<&mail_parser::Address>) -> Option<Self> {
        address.and_then(|a| a.first()).and_then(Contact::from_addr)
    }
}

#[derive(Serialize)]
pub struct EmailSummary {
    id: String,
    from: Option<Contact>,
    subject: String,
    received_at: DateTime<Utc>,
    preview: String,
    replied: bool,
}

#[derive(Serialize)]
pub struct Attachment {
    name: String,
    content_type: Option<String>,
    size: usize,
}

#[derive(Serialize, Deserialize)]
pub struct Reply {
    from: String,
    to: String,
    subject: String,
    body: String,
    sent_at: String,
    sent_by: String, //the admin's username
}

#[derive(Serialize)]
pub struct Email {
    id: String,
    from: Option<Contact>,
    to: Vec<Contact>,
    cc: Vec<Contact>,
    reply_to: Option<Contact>,
    subject: String,
    date: Option<String>, //what the sender's Date header claims
    received_at: DateTime<Utc>,
    text: Option<String>,
    html: Option<String>, //shown in a sandboxed iframe by the ui, never injected into the page
    attachments: Vec<Attachment>,
    spam_verdict: Option<String>,
    virus_verdict: Option<String>,
    replies: Vec<Reply>,
}

//SES names each stored message by its message id. Anything else isn't an email (e.g. SES's setup notification)
fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 128 && id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
}

fn s3_time(t: Option<&aws_sdk_s3::primitives::DateTime>) -> DateTime<Utc> {
    t.and_then(|t| DateTime::from_timestamp(t.secs(), t.subsec_nanos())).unwrap_or_default()
}

//the newest emails, with enough of each to pick one out
pub async fn list_emails(State(state): State<AppState>) -> Result<Json<Vec<EmailSummary>>, (StatusCode, String)> {
    let mut objects = Vec::new();
    let mut pages = state.s3.list_objects_v2().bucket(MAIL_BUCKET).prefix(INBOUND_PREFIX).into_paginator().send();
    while let Some(page) = pages.next().await {
        let page = page.map_err(|e| internal(DisplayErrorContext(e)))?;
        for object in page.contents() {
            let Some(id) = object.key().and_then(|k| k.strip_prefix(INBOUND_PREFIX)) else { continue };
            if valid_id(id) {
                objects.push((id.to_string(), s3_time(object.last_modified())));
            }
        }
    }
    objects.sort_by(|a, b| b.1.cmp(&a.1));
    objects.truncate(LIST_LIMIT);

    //only the start of each message, in parallel
    let summaries: Vec<EmailSummary> = stream::iter(objects)
        .map(|(id, received_at)| {
            let s3 = state.s3.clone();
            async move {
                let object = s3.get_object().bucket(MAIL_BUCKET).key(format!("{INBOUND_PREFIX}{id}"))
                    .range(format!("bytes=0-{}", HEADER_BYTES - 1))
                    .send().await.map_err(|e| internal(DisplayErrorContext(e)))?;
                let raw = object.body.collect().await.map_err(internal)?.into_bytes();
                let message = MessageParser::default().parse(&raw[..]);
                Ok::<_, (StatusCode, String)>(EmailSummary {
                    from: message.as_ref().and_then(|m| Contact::first(m.from())),
                    subject: message.as_ref().and_then(|m| m.subject()).unwrap_or("(no subject)").to_string(),
                    preview: message.as_ref().and_then(|m| m.body_preview(160)).map(|p| p.trim().to_string()).unwrap_or_default(),
                    id,
                    received_at,
                    replied: false,
                })
            }
        })
        .buffered(16)
        .collect::<Vec<_>>().await
        .into_iter().collect::<Result<_, _>>()?;

    let ids: Vec<String> = summaries.iter().map(|s| s.id.clone()).collect();
    let mut rows = state.graph.execute(query("
        MATCH (r:EmailReply) WHERE r.emailId IN $ids
        RETURN DISTINCT r.emailId AS id
    ")
        .param("ids", ids)
    ).await.map_err(internal)?;
    let mut replied = std::collections::HashSet::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        replied.insert(row.get::<String>("id").map_err(internal)?);
    }

    Ok(Json(summaries.into_iter().map(|s| EmailSummary { replied: replied.contains(&s.id), ..s }).collect()))
}

//the whole raw message and when SES stored it
async fn fetch(state: &AppState, id: &str) -> Result<(Vec<u8>, DateTime<Utc>), (StatusCode, String)> {
    if !valid_id(id) {
        return Err(not_found());
    }
    let object = state.s3.get_object().bucket(MAIL_BUCKET).key(format!("{INBOUND_PREFIX}{id}")).send().await
        .map_err(|e| match e.as_service_error() {
            Some(e) if e.is_no_such_key() => not_found(),
            _ => internal(DisplayErrorContext(e)),
        })?;
    let received_at = s3_time(object.last_modified());
    let raw = object.body.collect().await.map_err(internal)?.into_bytes().to_vec();
    Ok((raw, received_at))
}

fn parse(raw: &[u8]) -> Result<Message<'_>, (StatusCode, String)> {
    MessageParser::default().parse(raw).ok_or_else(|| internal("stored email couldn't be parsed"))
}

async fn replies(state: &AppState, id: &str) -> Result<Vec<Reply>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (r:EmailReply {emailId: $id})-[:SENT_BY]->(p:Person)
        RETURN r.from AS from, r.to AS to, r.subject AS subject, r.body AS body, toString(r.sentDate) AS sent_at,
               p.username AS sent_by
        ORDER BY r.sentDate
    ")
        .param("id", id)
    ).await.map_err(internal)?;
    let mut replies = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        replies.push(row.to::<Reply>().map_err(internal)?);
    }
    Ok(replies)
}

pub async fn get_email(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Email>, (StatusCode, String)> {
    let (raw, received_at) = fetch(&state, &id).await?;
    let message = parse(&raw)?;
    let header = |name: &str| message.header_raw(name).map(|v| v.trim().to_string());

    Ok(Json(Email {
        from: Contact::first(message.from()),
        to: Contact::all(message.to()),
        cc: Contact::all(message.cc()),
        reply_to: Contact::first(message.reply_to()),
        subject: message.subject().unwrap_or("(no subject)").to_string(),
        date: message.date().map(|d| d.to_rfc3339()),
        received_at,
        //html-only emails get a text version converted from the html
        text: message.body_text(0).map(|t| t.into_owned()),
        html: (message.html_body_count() > 0).then(|| message.body_html(0)).flatten().map(|h| h.into_owned()),
        attachments: message.attachments().map(|a| Attachment {
            name: a.attachment_name().unwrap_or("unnamed").to_string(),
            content_type: a.content_type().map(|c| match c.subtype() {
                Some(sub) => format!("{}/{sub}", c.ctype()),
                None => c.ctype().to_string(),
            }),
            size: a.contents().len(),
        }).collect(),
        spam_verdict: header("X-SES-Spam-Verdict"),
        virus_verdict: header("X-SES-Virus-Verdict"),
        replies: replies(&state, &id).await?,
        id,
    }))
}

#[derive(Deserialize)]
pub struct ReplyPayload {
    body: String,
}

//replies to the sender (or their Reply-To) from whichever of our addresses they wrote to, threaded under their
//email with the original quoted underneath
pub async fn reply_to_email(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(id): Path<String>,
    Json(payload): Json<ReplyPayload>,
) -> Result<(StatusCode, Json<Reply>), (StatusCode, String)> {
    let body = payload.body.trim().to_string();
    if body.is_empty() || body.chars().count() > 20000 {
        return Err((StatusCode::BAD_REQUEST, "A reply needs to be between 1 and 20000 characters.".to_string()));
    }
    let (raw, _) = fetch(&state, &id).await?;
    let message = parse(&raw)?;

    let to = Contact::first(message.reply_to()).or_else(|| Contact::first(message.from()))
        .ok_or_else(|| (StatusCode::BAD_REQUEST, "That email has no address to reply to.".to_string()))?;
    let from = message.to().into_iter().chain(message.cc())
        .flat_map(|a| a.iter())
        .filter_map(|a| a.address())
        .find(|a| a.to_lowercase().ends_with(&format!("@{DOMAIN}")))
        .unwrap_or(DEFAULT_FROM)
        .to_lowercase();
    let original_subject = message.subject().unwrap_or("").trim();
    let subject = if original_subject.to_lowercase().starts_with("re:") {
        original_subject.to_string()
    } else {
        format!("Re: {original_subject}")
    };

    //threading: In-Reply-To their message, References the whole chain so far
    let mut references: Vec<String> = match message.references() {
        HeaderValue::Text(t) => vec![t.to_string()],
        HeaderValue::TextList(list) => list.iter().map(|t| t.to_string()).collect(),
        _ => vec![],
    };
    let message_id = message.message_id().map(str::to_string);
    references.extend(message_id.clone());

    let sender = match &to.name {
        Some(name) => format!("{name} <{}>", to.address),
        None => to.address.clone(),
    };
    let when = message.date().map(|d| format!("On {}, ", d.to_rfc822())).unwrap_or_default();
    let quoted = message.body_text(0).unwrap_or_default().lines().map(|l| format!("> {l}")).collect::<Vec<_>>().join("\n");
    let text = format!("{body}\n\n{when}{sender} wrote:\n{quoted}\n");

    let mut builder = MessageBuilder::new()
        .from((FROM_NAME, from.as_str()))
        .to(Address::new_address(to.name.as_deref(), to.address.as_str()))
        .subject(subject.as_str())
        .text_body(text.as_str());
    if let Some(message_id) = &message_id {
        builder = builder.in_reply_to(message_id.as_str()).references(references);
    }
    let raw_reply = builder.write_to_vec().map_err(internal)?;

    let content = aws_sdk_sesv2::types::EmailContent::builder()
        .raw(aws_sdk_sesv2::types::RawMessage::builder().data(aws_sdk_sesv2::primitives::Blob::new(raw_reply)).build().map_err(internal)?)
        .build();
    let sent = state.ses.send_email().content(content).send().await
        .map_err(|e| internal(aws_sdk_sesv2::error::DisplayErrorContext(e)))?;

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        CREATE (r:EmailReply {
            emailId: $emailId, sesMessageId: $sesMessageId, from: $from, to: $to, subject: $subject, body: $body,
            sentDate: datetime()
        })-[:SENT_BY]->(p)
        RETURN r.from AS from, r.to AS to, r.subject AS subject, r.body AS body, toString(r.sentDate) AS sent_at,
               p.username AS sent_by
    ")
        .param("personId", admin.person_id)
        .param("emailId", id)
        .param("sesMessageId", sent.message_id().unwrap_or_default())
        .param("from", from)
        .param("to", to.address)
        .param("subject", subject)
        .param("body", body)
    ).await.map_err(internal)?;
    //the email is already sent, so a failure to record it is logged rather than retried
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| internal("reply was sent but not recorded"))?;
    Ok((StatusCode::CREATED, Json(row.to::<Reply>().map_err(internal)?)))
}
