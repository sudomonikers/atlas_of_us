//placing yourself on a topic: the one Bloom level you've reached in it (ENGAGES_TOPIC), and the evidence you give for
//it, each a note or a file. Files go straight from the browser to the evidence bucket through presigned urls. See
//"Placing yourself on a topic" in documentation/architecture/topics.md
use std::time::Duration;

use aws_sdk_s3::{error::DisplayErrorContext, presigning::PresigningConfig};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{TopicRef, internal, not_found};

//how much evidence a person can give for one topic, and how big each piece can be
const MAX_EVIDENCE: i64 = 5;
const MAX_NOTE_CHARS: usize = 2000;
const MAX_FILE_BYTES: i64 = 20 * 1024 * 1024;
const MAX_FILE_NAME_CHARS: usize = 200;
//the kinds of file evidence can be
const FILE_TYPES: [&str; 8] = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
//how long a presigned url works for
const UPLOAD_URL_TTL: Duration = Duration::from_secs(10 * 60);
const DOWNLOAD_URL_TTL: Duration = Duration::from_secs(5 * 60);

//one piece of evidence `e`, as it's returned
const EVIDENCE: &str = "{id: e.id, kind: e.kind, text: e.text, file_name: e.fileName, content_type: e.contentType,
                         size: e.size, created_at: toString(e.createdAt)}";

//a note, or a file the person uploaded
#[derive(Serialize, Deserialize)]
pub struct Evidence {
    id: String,
    kind: String, //note or file
    text: Option<String>, //a note's
    file_name: Option<String>, //a file's, with its content_type and size in bytes
    content_type: Option<String>,
    size: Option<i64>,
    created_at: String,
}

//where the logged in user is with a topic: the rank of the level they've reached, if they've placed themselves on it
#[derive(Serialize, Deserialize)]
pub struct Engagement {
    rank: Option<i64>,
    evidence: Vec<Evidence>, //oldest first
}

//a topic someone has placed themselves on, with the level they've reached and their evidence
#[derive(Serialize, Deserialize)]
pub struct PersonTopic {
    topic: TopicRef,
    rank: i64,
    updated_at: String,
    evidence: Vec<Evidence>,
}

fn bad_request(message: &str) -> (StatusCode, String) {
    (StatusCode::BAD_REQUEST, message.to_string())
}

fn bucket(state: &AppState) -> Result<&str, (StatusCode, String)> {
    state.evidence_bucket.as_deref().ok_or_else(|| (StatusCode::SERVICE_UNAVAILABLE, "File uploads aren't set up yet.".to_string()))
}

//where a person's file lives in the evidence bucket
fn file_key(person_id: &str, evidence_id: &str) -> String {
    format!("evidence/{person_id}/{evidence_id}")
}

//deletes files from the evidence bucket. Their Evidence is already gone, so a file that can't be deleted is only logged
async fn delete_files(state: &AppState, keys: &[String]) {
    let Some(bucket) = state.evidence_bucket.as_deref() else { return };
    for key in keys {
        if let Err(e) = state.s3.delete_object().bucket(bucket).key(key).send().await {
            tracing::error!(key, "couldn't delete an evidence file: {}", DisplayErrorContext(e));
        }
    }
}

//where the logged in user is with a topic
pub async fn get_engagement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Engagement>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (t:Topic {{id: $id}})
        OPTIONAL MATCH (:Person {{id: $personId}})-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN l.rank AS rank,
               COLLECT {{
                   MATCH (:Person {{id: $personId}})-[:GAVE_EVIDENCE]->(e:Evidence)-[:ABOUT]->(t)
                   WITH e ORDER BY e.createdAt
                   RETURN {EVIDENCE}
               }} AS evidence
    ")).param("id", id).param("personId", user.person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Engagement>().map_err(internal)?))
}

#[derive(Deserialize)]
pub struct LevelRequest {
    rank: i64,
}

//places the logged in user at one of a ready topic's levels, in place of any level they were at before
pub async fn set_level(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<LevelRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if !(1..=6).contains(&req.rank) {
        return Err(bad_request("Pick one of the six levels."));
    }
    let mut rows = state.graph.execute(query("MATCH (t:Topic {id: $id}) RETURN t.status AS status").param("id", id.as_str()))
        .await.map_err(internal)?;
    let status: String = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("status").map_err(internal)?;
    drop(rows);
    if status != "ready" {
        return Err(bad_request("That topic's levels aren't written yet."));
    }

    //keeps when they first placed themselves on the topic
    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (t:Topic {id: $id})-[:HAS_LEVEL]->(l:BloomLevel {rank: $rank})
        OPTIONAL MATCH (p)-[old:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(t)
        WITH p, l, collect(old) AS olds, min(old.since) AS since
        FOREACH (o IN olds | DELETE o)
        CREATE (p)-[:ENGAGES_TOPIC {since: coalesce(since, datetime()), updatedAt: datetime()}]->(l)
    ").param("personId", user.person_id.as_str()).param("id", id.as_str()).param("rank", req.rank)).await.map_err(internal)?;
    tracing::info!(topic_id = id, rank = req.rank, "placed a person on a topic");
    Ok(StatusCode::NO_CONTENT)
}

//takes the logged in user off a topic, with all their evidence for it
pub async fn remove_engagement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[r:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(:Topic {id: $id})
        DELETE r
        WITH DISTINCT p
        OPTIONAL MATCH (p)-[:GAVE_EVIDENCE]->(e:Evidence)-[:ABOUT]->(:Topic {id: $id})
        WITH collect(e) AS evidence
        WITH evidence, [e IN evidence WHERE e.key IS NOT NULL | e.key] AS keys
        FOREACH (e IN evidence | DETACH DELETE e)
        RETURN keys
    ").param("personId", user.person_id).param("id", id)).await.map_err(internal)?;
    let keys: Vec<String> = match rows.next().await.map_err(internal)? {
        Some(row) => row.get("keys").map_err(internal)?,
        None => Vec::new(),
    };
    drop(rows);
    delete_files(&state, &keys).await;
    Ok(StatusCode::NO_CONTENT)
}

//whether the logged in user can give more evidence for a topic: they've placed themselves on it, and haven't given
//the most they can
async fn check_room(graph: &Graph, person_id: &str, topic_id: &str) -> Result<(), (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId}), (t:Topic {id: $id})
        RETURN EXISTS { (p)-[:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(t) } AS engaged,
               COUNT { (p)-[:GAVE_EVIDENCE]->(:Evidence)-[:ABOUT]->(t) } AS given
    ").param("personId", person_id).param("id", topic_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let engaged: bool = row.get("engaged").map_err(internal)?;
    let given: i64 = row.get("given").map_err(internal)?;
    if !engaged {
        return Err(bad_request("Place yourself on the topic before adding evidence."));
    }
    if given >= MAX_EVIDENCE {
        return Err(bad_request(&format!("You can give up to {MAX_EVIDENCE} pieces of evidence for a topic. Remove one to add another.")));
    }
    Ok(())
}

#[derive(Deserialize)]
pub struct NoteRequest {
    text: String,
}

//adds a note as evidence for the logged in user's level in a topic
pub async fn add_note(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<NoteRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    let text = req.text.trim();
    if text.is_empty() || text.chars().count() > MAX_NOTE_CHARS {
        return Err(bad_request(&format!("Write your note in {MAX_NOTE_CHARS} characters or fewer.")));
    }
    check_room(&state.graph, &user.person_id, &id).await?;
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (t:Topic {{id: $id}})
        CREATE (p)-[:GAVE_EVIDENCE]->(e:Evidence {{id: randomUUID(), kind: 'note', text: $text, createdAt: datetime()}})-[:ABOUT]->(t)
        RETURN {EVIDENCE} AS evidence
    ")).param("personId", user.person_id).param("id", id).param("text", text)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.get("evidence").map_err(internal)?))
}

#[derive(Deserialize)]
pub struct UploadRequest {
    file_name: String,
    content_type: String,
    size: i64,
}

#[derive(Serialize)]
pub struct Upload {
    upload_id: String, //confirm the upload with it once the file is in
    url: String, //PUT the file here, with its Content-Type
}

fn check_file(file_name: &str, content_type: &str) -> Result<(), (StatusCode, String)> {
    if file_name.trim().is_empty() || file_name.chars().count() > MAX_FILE_NAME_CHARS {
        return Err(bad_request(&format!("Give the file a name of {MAX_FILE_NAME_CHARS} characters or fewer.")));
    }
    if !FILE_TYPES.contains(&content_type) {
        return Err(bad_request("That kind of file can't be evidence. Try a PDF, an image, a text file or a Word document."));
    }
    Ok(())
}

fn too_big() -> (StatusCode, String) {
    bad_request(&format!("Files can be up to {} MB.", MAX_FILE_BYTES / 1024 / 1024))
}

//a url to upload a file of evidence to. The upload is confirmed with POST /{id}/evidence/files once it's in
pub async fn start_upload(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<UploadRequest>) -> Result<Json<Upload>, (StatusCode, String)> {
    check_file(&req.file_name, &req.content_type)?;
    if req.size <= 0 || req.size > MAX_FILE_BYTES {
        return Err(too_big());
    }
    let bucket = bucket(&state)?;
    check_room(&state.graph, &user.person_id, &id).await?;

    let upload_id = uuid::Uuid::new_v4().to_string();
    let presigned = state.s3.put_object()
        .bucket(bucket)
        .key(file_key(&user.person_id, &upload_id))
        .content_type(&req.content_type)
        .presigned(PresigningConfig::expires_in(UPLOAD_URL_TTL).map_err(internal)?)
        .await
        .map_err(|e| internal(DisplayErrorContext(e)))?;
    Ok(Json(Upload { upload_id, url: presigned.uri().to_string() }))
}

#[derive(Deserialize)]
pub struct FileRequest {
    upload_id: String,
    file_name: String,
}

//adds an uploaded file as evidence for the logged in user's level in a topic, once it's in the bucket
pub async fn add_file(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<FileRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    let upload_id = uuid::Uuid::parse_str(&req.upload_id).map_err(|_| bad_request("That upload doesn't exist."))?.to_string();
    let bucket = bucket(&state)?;
    let key = file_key(&user.person_id, &upload_id);

    let head = state.s3.head_object().bucket(bucket).key(&key).send().await.map_err(|e| {
        if e.as_service_error().is_some_and(|e| e.is_not_found()) {
            bad_request("That upload didn't arrive. Try again.")
        } else {
            internal(DisplayErrorContext(e))
        }
    })?;
    let size = head.content_length().unwrap_or_default();
    let content_type = head.content_type().unwrap_or_default().to_string();
    let rejected = if size > MAX_FILE_BYTES { Some(too_big()) } else { check_file(&req.file_name, &content_type).err() };
    let rejected = match rejected {
        Some(rejected) => Some(rejected),
        None => check_room(&state.graph, &user.person_id, &id).await.err(),
    };
    if let Some(rejected) = rejected {
        delete_files(&state, &[key]).await;
        return Err(rejected);
    }

    //MERGEd on the upload's id, so confirming twice adds it once
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (t:Topic {{id: $id}})
        MERGE (p)-[:GAVE_EVIDENCE]->(e:Evidence {{id: $evidenceId}})
        ON CREATE SET e.kind = 'file', e.fileName = $fileName, e.contentType = $contentType, e.size = $size, e.key = $key,
                      e.createdAt = datetime()
        MERGE (e)-[:ABOUT]->(t)
        RETURN {EVIDENCE} AS evidence
    "))
        .param("personId", user.person_id)
        .param("id", id)
        .param("evidenceId", upload_id)
        .param("fileName", req.file_name.trim())
        .param("contentType", content_type)
        .param("size", size)
        .param("key", key)
    ).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.get("evidence").map_err(internal)?))
}

//removes a piece of the logged in user's evidence, and its file
pub async fn remove_evidence(State(state): State<AppState>, user: AuthUser, Path(evidence_id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (:Person {id: $personId})-[:GAVE_EVIDENCE]->(e:Evidence {id: $evidenceId})
        WITH e, e.key AS key
        DETACH DELETE e
        RETURN key
    ").param("personId", user.person_id).param("evidenceId", evidence_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| (StatusCode::NOT_FOUND, "That evidence isn't there anymore.".to_string()))?;
    let key: Option<String> = row.get("key").map_err(internal)?;
    drop(rows);
    delete_files(&state, key.as_slice()).await;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize)]
pub struct FileUrl {
    url: String,
}

//a short-lived url to download a file of evidence. Its owner can always get one, and anyone can when their profile is
//public, the way their profile is seen
pub async fn get_file(State(state): State<AppState>, user: Option<AuthUser>, Path(evidence_id): Path<String>) -> Result<Json<FileUrl>, (StatusCode, String)> {
    let viewer_id = user.map(|u| u.person_id).unwrap_or_default();
    let mut rows = state.graph.execute(query("
        MATCH (p:Person)-[:GAVE_EVIDENCE]->(e:Evidence {id: $evidenceId})
        WHERE e.key IS NOT NULL AND (coalesce(p.public, false) OR p.id = $viewerId)
        RETURN e.key AS key, e.fileName AS file_name
    ").param("evidenceId", evidence_id).param("viewerId", viewer_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| (StatusCode::NOT_FOUND, "That file isn't there anymore.".to_string()))?;
    let key: String = row.get("key").map_err(internal)?;
    let file_name: String = row.get("file_name").map_err(internal)?;
    drop(rows);

    //only plain characters go in the header, so the name can't break out of it
    let safe_name: String = file_name.chars().map(|c| if (c.is_ascii_graphic() && c != '"' && c != '\\') || c == ' ' { c } else { '_' }).collect();
    let presigned = state.s3.get_object()
        .bucket(bucket(&state)?)
        .key(key)
        .response_content_disposition(format!("attachment; filename=\"{safe_name}\""))
        .presigned(PresigningConfig::expires_in(DOWNLOAD_URL_TTL).map_err(internal)?)
        .await
        .map_err(|e| internal(DisplayErrorContext(e)))?;
    Ok(Json(FileUrl { url: presigned.uri().to_string() }))
}

//the topics someone has placed themselves on, deepest first, each with their evidence
pub async fn person_topics(graph: &Graph, person_id: &str) -> Result<Vec<PersonTopic>, (StatusCode, String)> {
    let mut rows = graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[r:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        RETURN {{id: t.id, name: t.name, status: t.status}} AS topic, l.rank AS rank, toString(r.updatedAt) AS updated_at,
               COLLECT {{
                   MATCH (p)-[:GAVE_EVIDENCE]->(e:Evidence)-[:ABOUT]->(t)
                   WITH e ORDER BY e.createdAt
                   RETURN {EVIDENCE}
               }} AS evidence
        ORDER BY rank DESC, t.name
    ")).param("personId", person_id)).await.map_err(internal)?;
    let mut topics = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        topics.push(row.to::<PersonTopic>().map_err(internal)?);
    }
    Ok(topics)
}

//the topics the logged in user has placed themselves on, for My Knowledge
pub async fn list_engagements(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<PersonTopic>>, (StatusCode, String)> {
    Ok(Json(person_topics(&state.graph, &user.person_id).await?))
}
