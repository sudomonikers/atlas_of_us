//placing yourself on a topic: the one Bloom level you've reached in it (ENGAGES_TOPIC), and the evidence you give for
//it once you're on it. See "Placing yourself on a topic" in documentation/architecture/topics.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    evidence::{self, About, Evidence},
    state::AppState,
};

use super::{TopicRef, internal, not_found};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/engagements", get(list_engagements))
        .route("/{id}/engagement", get(get_engagement).put(set_level).delete(remove_engagement))
        .route("/{id}/evidence", post(add_note))
        .route("/{id}/evidence/uploads", post(start_upload))
        .route("/{id}/evidence/files", post(add_file))
}

fn about(id: &str) -> About<'_> {
    About { label: "Topic", id }
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

//where the logged in user is with a topic
async fn get_engagement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Engagement>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (t:Topic {{id: $id}}), (p:Person {{id: $personId}})
        OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN l.rank AS rank, {} AS evidence
    ", evidence::collect("p", "t"))).param("id", id).param("personId", user.person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Engagement>().map_err(internal)?))
}

#[derive(Deserialize)]
struct LevelRequest {
    rank: i64,
}

//places the logged in user at one of a ready topic's levels, in place of any level they were at before
async fn set_level(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<LevelRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if !(1..=6).contains(&req.rank) {
        return Err((StatusCode::BAD_REQUEST, "Pick one of the six levels.".to_string()));
    }
    let mut rows = state.graph.execute(query("MATCH (t:Topic {id: $id}) RETURN t.status AS status").param("id", id.as_str()))
        .await.map_err(internal)?;
    let status: String = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("status").map_err(internal)?;
    drop(rows);
    if status != "ready" {
        return Err((StatusCode::BAD_REQUEST, "That topic's levels aren't written yet.".to_string()));
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
async fn remove_engagement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (:Person {id: $personId})-[r:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(:Topic {id: $id})
        DELETE r
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    evidence::remove_all(&state, &user.person_id, about(&id)).await?;
    Ok(StatusCode::NO_CONTENT)
}

//evidence is for the level they're at, so they place themselves on the topic first
async fn check_engaged(graph: &Graph, person_id: &str, id: &str) -> Result<(), (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId}), (t:Topic {id: $id})
        RETURN EXISTS { (p)-[:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(t) } AS engaged
    ").param("personId", person_id).param("id", id)).await.map_err(internal)?;
    let engaged: bool = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("engaged").map_err(internal)?;
    if !engaged {
        return Err((StatusCode::BAD_REQUEST, "Place yourself on the topic before adding evidence.".to_string()));
    }
    Ok(())
}

async fn add_note(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::NoteRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    check_engaged(&state.graph, &user.person_id, &id).await?;
    Ok(Json(evidence::add_note(&state, &user.person_id, about(&id), req).await?))
}

async fn start_upload(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::UploadRequest>) -> Result<Json<evidence::Upload>, (StatusCode, String)> {
    check_engaged(&state.graph, &user.person_id, &id).await?;
    Ok(Json(evidence::start_upload(&state, &user.person_id, about(&id), req).await?))
}

async fn add_file(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::FileRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    if let Err(e) = check_engaged(&state.graph, &user.person_id, &id).await {
        evidence::discard_upload(&state, &user.person_id, &req.upload_id).await;
        return Err(e);
    }
    Ok(Json(evidence::add_file(&state, &user.person_id, about(&id), req).await?))
}

//the topics someone has placed themselves on, deepest first, each with their evidence
pub async fn person_topics(graph: &Graph, person_id: &str) -> Result<Vec<PersonTopic>, (StatusCode, String)> {
    let mut rows = graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[r:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        RETURN {{id: t.id, name: t.name, status: t.status}} AS topic, l.rank AS rank, toString(r.updatedAt) AS updated_at,
               {} AS evidence
        ORDER BY rank DESC, t.name
    ", evidence::collect("p", "t"))).param("personId", person_id)).await.map_err(internal)?;
    let mut topics = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        topics.push(row.to::<PersonTopic>().map_err(internal)?);
    }
    Ok(topics)
}

//the topics the logged in user has placed themselves on, for My Knowledge
async fn list_engagements(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<PersonTopic>>, (StatusCode, String)> {
    Ok(Json(person_topics(&state.graph, &user.person_id).await?))
}
