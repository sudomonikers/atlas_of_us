//evidence: notes and files a person gives about a node, as (:Person)-[:GAVE_EVIDENCE]->(:Evidence)-[:ABOUT]->(node).
//Modules decide when their nodes can have evidence and call these with the node it's about. Files go straight from the
//browser to the evidence bucket through presigned urls. router() serves a piece of evidence itself, at /api/evidence
use std::time::Duration;

use aws_sdk_s3::{error::DisplayErrorContext, presigning::PresigningConfig};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get},
};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

//how much evidence a person can give about one node, and how big each piece can be
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

//the node evidence is about. Its label goes into Cypher as it is, so it's only ever a constant
#[derive(Clone, Copy)]
pub struct About<'a> {
    pub label: &'static str,
    pub id: &'a str,
}

//removing a piece of evidence, and downloading its file. Mounted at /api/evidence
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/{id}", delete(remove_evidence))
        .route("/{id}/file", get(get_file))
}

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

//a COLLECT subquery of the evidence the person bound to `person` gave about the node bound to `about`, oldest first,
//for a module's query to return alongside its own columns
pub fn collect(person: &str, about: &str) -> String {
    format!("COLLECT {{
        MATCH ({person})-[:GAVE_EVIDENCE]->(e:Evidence)-[:ABOUT]->({about})
        WITH e ORDER BY e.createdAt
        RETURN {EVIDENCE}
    }}")
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "What that evidence is about doesn't exist.".to_string())
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

//whether the person can give more evidence about the node
async fn check_room(graph: &Graph, person_id: &str, about: About<'_>) -> Result<(), (StatusCode, String)> {
    let label = about.label;
    let mut rows = graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (a:{label} {{id: $about}})
        RETURN COUNT {{ (p)-[:GAVE_EVIDENCE]->(:Evidence)-[:ABOUT]->(a) }} AS given
    ")).param("personId", person_id).param("about", about.id)).await.map_err(internal)?;
    let given: i64 = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("given").map_err(internal)?;
    if given >= MAX_EVIDENCE {
        return Err(bad_request(&format!("You can give up to {MAX_EVIDENCE} pieces of evidence for one thing. Remove one to add another.")));
    }
    Ok(())
}

#[derive(Deserialize)]
pub struct NoteRequest {
    text: String,
}

//adds a note the person wrote as evidence about the node
pub async fn add_note(state: &AppState, person_id: &str, about: About<'_>, req: NoteRequest) -> Result<Evidence, (StatusCode, String)> {
    let text = req.text.trim();
    if text.is_empty() || text.chars().count() > MAX_NOTE_CHARS {
        return Err(bad_request(&format!("Write your note in {MAX_NOTE_CHARS} characters or fewer.")));
    }
    check_room(&state.graph, person_id, about).await?;
    let label = about.label;
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (a:{label} {{id: $about}})
        CREATE (p)-[:GAVE_EVIDENCE]->(e:Evidence {{id: randomUUID(), kind: 'note', text: $text, createdAt: datetime()}})-[:ABOUT]->(a)
        RETURN {EVIDENCE} AS evidence
    ")).param("personId", person_id).param("about", about.id).param("text", text)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    row.get("evidence").map_err(internal)
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

//a url to upload a file of evidence about the node to. The upload is confirmed with add_file once it's in
pub async fn start_upload(state: &AppState, person_id: &str, about: About<'_>, req: UploadRequest) -> Result<Upload, (StatusCode, String)> {
    check_file(&req.file_name, &req.content_type)?;
    if req.size <= 0 || req.size > MAX_FILE_BYTES {
        return Err(too_big());
    }
    let bucket = bucket(state)?;
    check_room(&state.graph, person_id, about).await?;

    let upload_id = uuid::Uuid::new_v4().to_string();
    let presigned = state.s3.put_object()
        .bucket(bucket)
        .key(file_key(person_id, &upload_id))
        .content_type(&req.content_type)
        .presigned(PresigningConfig::expires_in(UPLOAD_URL_TTL).map_err(internal)?)
        .await
        .map_err(|e| internal(DisplayErrorContext(e)))?;
    Ok(Upload { upload_id, url: presigned.uri().to_string() })
}

#[derive(Deserialize)]
pub struct FileRequest {
    pub upload_id: String,
    file_name: String,
}

//the key of an upload the person started, or a bad request for an id that can't be one
fn upload_key(person_id: &str, upload_id: &str) -> Result<(String, String), (StatusCode, String)> {
    let upload_id = uuid::Uuid::parse_str(upload_id).map_err(|_| bad_request("That upload doesn't exist."))?.to_string();
    Ok((file_key(person_id, &upload_id), upload_id))
}

//throws away a file the person uploaded, for a module turning the upload away before add_file
pub async fn discard_upload(state: &AppState, person_id: &str, upload_id: &str) {
    if let Ok((key, _)) = upload_key(person_id, upload_id) {
        delete_files(state, &[key]).await;
    }
}

//adds a file the person uploaded as evidence about the node, once it's in the bucket
pub async fn add_file(state: &AppState, person_id: &str, about: About<'_>, req: FileRequest) -> Result<Evidence, (StatusCode, String)> {
    let (key, upload_id) = upload_key(person_id, &req.upload_id)?;
    let bucket = bucket(state)?;

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
        None => check_room(&state.graph, person_id, about).await.err(),
    };
    if let Some(rejected) = rejected {
        delete_files(state, &[key]).await;
        return Err(rejected);
    }

    //MERGEd on the upload's id, so confirming twice adds it once
    let label = about.label;
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (a:{label} {{id: $about}})
        MERGE (p)-[:GAVE_EVIDENCE]->(e:Evidence {{id: $evidenceId}})
        ON CREATE SET e.kind = 'file', e.fileName = $fileName, e.contentType = $contentType, e.size = $size, e.key = $key,
                      e.createdAt = datetime()
        MERGE (e)-[:ABOUT]->(a)
        RETURN {EVIDENCE} AS evidence
    "))
        .param("personId", person_id)
        .param("about", about.id)
        .param("evidenceId", upload_id)
        .param("fileName", req.file_name.trim())
        .param("contentType", content_type)
        .param("size", size)
        .param("key", key)
    ).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    row.get("evidence").map_err(internal)
}

//removes all the evidence the person gave about the node, and its files
pub async fn remove_all(state: &AppState, person_id: &str, about: About<'_>) -> Result<(), (StatusCode, String)> {
    let label = about.label;
    let mut rows = state.graph.execute(query(&format!("
        OPTIONAL MATCH (:Person {{id: $personId}})-[:GAVE_EVIDENCE]->(e:Evidence)-[:ABOUT]->(:{label} {{id: $about}})
        WITH collect(e) AS evidence
        WITH evidence, [e IN evidence WHERE e.key IS NOT NULL | e.key] AS keys
        FOREACH (e IN evidence | DETACH DELETE e)
        RETURN keys
    ")).param("personId", person_id).param("about", about.id)).await.map_err(internal)?;
    let keys: Vec<String> = match rows.next().await.map_err(internal)? {
        Some(row) => row.get("keys").map_err(internal)?,
        None => Vec::new(),
    };
    drop(rows);
    delete_files(state, &keys).await;
    Ok(())
}

//removes a piece of the logged in user's evidence, and its file
async fn remove_evidence(State(state): State<AppState>, user: AuthUser, Path(evidence_id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
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
async fn get_file(State(state): State<AppState>, user: Option<AuthUser>, Path(evidence_id): Path<String>) -> Result<Json<FileUrl>, (StatusCode, String)> {
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
