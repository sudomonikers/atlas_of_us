//Topics Graph: Topic nodes that INCLUDE Idea nodes (concept | claim | norm | value), each Topic with 6 Bloom levels
//linked by HAS_LEVEL. How topics are searched for, asked for and filled is described in
//documentation/architecture/topics.md
mod gates;

use std::collections::HashMap;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;

use atlas_shared::topics::resolver;

use crate::{auth::AuthUser, bedrock, events, helpers::lucene, state::AppState};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(health_check).post(ask_for_topic))
        .route("/search", get(search))
        .route("/{id}", get(get_topic))
        .route("/{id}/fill", post(request_fill))
}

/// Healthcheck for the topics router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Topics Api Healthy!"
    });
    Json(json_response)
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "That topic doesn't exist.".to_string())
}

#[derive(Serialize, Deserialize)]
pub struct TopicRef {
    id: String,
    name: String,
    status: String,
}

//a topic as search and the gates show it, with the broader topics it's a subtopic of
#[derive(Serialize, Deserialize)]
pub struct TopicSummary {
    id: String,
    name: String,
    description: Option<String>,
    status: String, //stub, filling, ready or failed
    broader: Vec<TopicRef>,
}

//fetches topics by id, in the order given
async fn summaries(state: &AppState, ids: &[String]) -> Result<Vec<TopicSummary>, BoxError> {
    let mut rows = state.graph.execute(query("
        UNWIND range(0, size($ids) - 1) AS i
        MATCH (t:Topic {id: $ids[i]})
        RETURN t.id AS id, t.name AS name, t.description AS description, t.status AS status,
               COLLECT { MATCH (t)-[:SUBTOPIC_OF]->(b:Topic) RETURN {id: b.id, name: b.name, status: b.status} AS b ORDER BY b.name } AS broader
        ORDER BY i
    ").param("ids", ids.to_vec())).await?;
    let mut topics = Vec::new();
    while let Some(row) = rows.next().await? {
        topics.push(row.to::<TopicSummary>()?);
    }
    Ok(topics)
}

// ---------------------------------------------------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------------------------------------------------

//how many topics a search returns, and how many each half of it contributes before they're combined
const SEARCH_RESULTS: usize = 10;
const SEARCH_CANDIDATES: i64 = 20;
//reciprocal rank fusion's constant: higher values flatten the difference between ranks
const RRF_K: f64 = 60.0;

#[derive(Deserialize)]
pub struct SearchParams {
    q: String,
}

//the topics closest to what was typed, by name and alias and by meaning, each with its broader topics
pub async fn search(State(state): State<AppState>, Query(params): Query<SearchParams>) -> Result<Json<Vec<TopicSummary>>, (StatusCode, String)> {
    let q = params.q.trim();
    if q.is_empty() {
        return Ok(Json(Vec::new()));
    }
    if q.chars().count() > 200 {
        return Err((StatusCode::BAD_REQUEST, "That search is too long.".to_string()));
    }

    let mut ranked: Vec<Vec<String>> = Vec::new();
    if let Some(lucene) = lucene::query(q) {
        let mut rows = state.graph.execute(query("
            CALL db.index.fulltext.queryNodes('topic_names', $lucene, {limit: $limit}) YIELD node
            RETURN node.id AS id
        ").param("lucene", lucene).param("limit", SEARCH_CANDIDATES)).await.map_err(internal)?;
        ranked.push(ids(&mut rows).await.map_err(internal)?);
    }
    //by meaning. Search still works by name when the embedding can't be made
    match bedrock::embed(&state.bedrock, q).await {
        Ok(vector) => {
            let mut rows = state.graph.execute(query("
                CALL db.index.vector.queryNodes('topic_vector', $k, $vector) YIELD node
                RETURN node.id AS id
            ").param("k", SEARCH_CANDIDATES).param("vector", vector)).await.map_err(internal)?;
            ranked.push(ids(&mut rows).await.map_err(internal)?);
        }
        Err(e) => tracing::error!("couldn't embed the search, searching by name only: {e}"),
    }

    //reciprocal rank fusion: a topic near the top of either list ranks high, and one in both ranks higher
    let mut scores: HashMap<String, f64> = HashMap::new();
    for list in &ranked {
        for (rank, id) in list.iter().enumerate() {
            *scores.entry(id.clone()).or_default() += 1.0 / (RRF_K + rank as f64 + 1.0);
        }
    }
    let mut best: Vec<(String, f64)> = scores.into_iter().collect();
    best.sort_by(|a, b| b.1.total_cmp(&a.1));
    let best: Vec<String> = best.into_iter().take(SEARCH_RESULTS).map(|(id, _)| id).collect();
    Ok(Json(summaries(&state, &best).await.map_err(internal)?))
}

async fn ids(rows: &mut neo4rs::DetachedRowStream) -> Result<Vec<String>, BoxError> {
    let mut ids = Vec::new();
    while let Some(row) = rows.next().await? {
        ids.push(row.get("id")?);
    }
    Ok(ids)
}

// ---------------------------------------------------------------------------------------------------------------------
// Asking for a topic we don't have
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct AskRequest {
    query: String, //what the user typed
}

//what came of asking for a topic
#[derive(Serialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum AskOutcome {
    //it belongs to another module: kind is skill, personality, physical_attribute or other
    NotATopic { kind: String, name: String },
    //nonsense, or a slur
    Rejected { reason: String },
    //it's a topic we already have
    Existing { topic: TopicSummary },
    //a new stub, ready to be opened
    Created { topic: TopicSummary },
}

pub async fn ask_for_topic(State(state): State<AppState>, _user: AuthUser, Json(req): Json<AskRequest>) -> Result<Json<AskOutcome>, (StatusCode, String)> {
    let typed = req.query.trim();
    if typed.is_empty() || typed.chars().count() > 100 {
        return Err((StatusCode::BAD_REQUEST, "Describe the topic in 100 characters or fewer.".to_string()));
    }

    let screening = gates::screen(&state, typed).await.map_err(internal)?;
    tracing::info!(kind = screening.kind, acceptable = screening.acceptable, "screened a topic request");
    if !screening.acceptable {
        return Ok(Json(AskOutcome::Rejected { reason: screening.rejection_reason }));
    }
    if screening.kind != "topic" {
        return Ok(Json(AskOutcome::NotATopic { kind: screening.kind, name: screening.name }));
    }

    let (resolution, vector) = resolver::resolve(&state.graph, &state.bedrock, &screening.name, &screening.description).await.map_err(internal)?;
    let id = match resolution {
        resolver::Resolution::Same { topic_id } => {
            tracing::info!(topic_id, "topic request means an existing topic");
            let topic = summaries(&state, &[topic_id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
            return Ok(Json(AskOutcome::Existing { topic }));
        }
        resolver::Resolution::New { broader, narrower } => {
            resolver::create_stub(&state.graph, &state.bus, &screening.name, &screening.description, vector, &broader, &narrower).await.map_err(internal)?
        }
    };
    tracing::info!(topic_id = id, "created a topic stub");
    let topic = summaries(&state, &[id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
    Ok(Json(AskOutcome::Created { topic }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Opening a topic
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct Level {
    rank: i64,
    name: String,
    description: Option<String>,
    observable_signs: Option<Vec<String>>,
    example_evidence: Option<Vec<String>>,
    version: Option<i64>,
    trust: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct IdeaRef {
    id: String,
    name: String,
}

//an Idea the topic includes, with the Ideas it requires understanding first
#[derive(Serialize, Deserialize)]
pub struct Idea {
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String, //concept, claim, norm or value
    description: Option<String>,
    requires: Vec<IdeaRef>,
}

#[derive(Serialize, Deserialize)]
pub struct Topic {
    id: String,
    name: String,
    description: Option<String>,
    aliases: Vec<String>,
    status: String,
    levels: Vec<Level>, //Remember to Create. A stub's levels only have a rank and a name
    ideas: Vec<Idea>, //empty until it's filled
    broader: Vec<TopicRef>, //the topics it's a subtopic of
    narrower: Vec<TopicRef>, //its subtopics
}

//a topic with its levels and Ideas. A stub's are empty until it's filled, which the ui asks for with POST /{id}/fill
pub async fn get_topic(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Topic>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (t:Topic {id: $id})
        RETURN t.id AS id, t.name AS name, t.description AS description, t.aliases AS aliases, t.status AS status,
               COLLECT {
                   MATCH (t)-[:HAS_LEVEL]->(l:BloomLevel)
                   WITH l ORDER BY l.rank
                   RETURN {rank: l.rank, name: l.name, description: l.description, observable_signs: l.observableSigns,
                           example_evidence: l.exampleEvidence, version: l.version, trust: l.trust}
               } AS levels,
               COLLECT {
                   MATCH (t)-[:INCLUDES]->(i:Idea)
                   WITH i ORDER BY i.name
                   RETURN {id: i.id, name: i.name, type: i.type, description: i.description,
                           requires: COLLECT { MATCH (i)-[:REQUIRES_KNOWLEDGE]->(r:Idea) RETURN {id: r.id, name: r.name} ORDER BY r.name }}
               } AS ideas,
               COLLECT { MATCH (t)-[:SUBTOPIC_OF]->(b:Topic) RETURN {id: b.id, name: b.name, status: b.status} AS b ORDER BY b.name } AS broader,
               COLLECT { MATCH (n:Topic)-[:SUBTOPIC_OF]->(t) RETURN {id: n.id, name: n.name, status: n.status} AS n ORDER BY n.name } AS narrower
    ").param("id", id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Topic>().map_err(internal)?))
}

#[derive(Serialize)]
pub struct FillStatus {
    status: String,
}

//asks for a stub's levels and Ideas to be filled, or a failed fill to be tried again. Anything else is left as it is,
//so it's safe to call every time a topic is opened. The ui then polls GET /{id} until it's ready
pub async fn request_fill(State(state): State<AppState>, _user: AuthUser, Path(id): Path<String>) -> Result<Json<FillStatus>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (t:Topic {id: $id})
        WITH t, t.status AS before
        SET t.status = CASE WHEN before IN ['stub', 'failed'] THEN 'filling' ELSE before END
        RETURN before, t.status AS status
    ").param("id", id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let before: String = row.get("before").map_err(internal)?;
    let status: String = row.get("status").map_err(internal)?;

    if before != status {
        tracing::info!(topic_id = id, before, "requested a topic fill");
        if let Err(e) = events::publish(&state.bus, "atlas.topics", "TopicFillRequested", 1, json!({"topicId": id})).await {
            //nothing will fill it, so put it back for the next person who opens it to try again
            state.graph.run(query("MATCH (t:Topic {id: $id, status: 'filling'}) SET t.status = $before")
                .param("id", id.as_str()).param("before", before)).await.map_err(internal)?;
            return Err(internal(e));
        }
    }
    Ok(Json(FillStatus { status }))
}
