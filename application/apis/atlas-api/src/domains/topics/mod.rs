//Topics Graph: Topic nodes that INCLUDE Idea nodes (concept | claim | norm | value), each Topic with 6 Bloom levels
//linked by HAS_LEVEL. How topics are searched for, asked for and filled is described in
//documentation/architecture/topics.md
mod engagement;
mod gates;

use std::collections::HashMap;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;

use atlas_shared::topics::resolver;

use crate::{auth::AuthUser, bedrock, events, helpers::lucene, state::AppState};

pub use engagement::{PersonTopic, person_topics};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(health_check).post(ask_for_topic))
        .route("/search", get(search))
        .route("/{id}", get(get_topic))
        .route("/{id}/neighbors", get(get_neighbors))
        .route("/{id}/neighbors/{group}", get(get_neighbor_page))
        .route("/{id}/fill", post(request_fill))
        .route("/ideas/{id}", get(get_idea))
        .route("/ideas/{id}/neighbors/{group}", get(get_idea_page))
        .route("/engagements", get(engagement::list_engagements))
        .route("/{id}/engagement", get(engagement::get_engagement).put(engagement::set_level).delete(engagement::remove_engagement))
        .route("/{id}/evidence", post(engagement::add_note))
        .route("/{id}/evidence/uploads", post(engagement::start_upload))
        .route("/{id}/evidence/files", post(engagement::add_file))
        .route("/evidence/{id}", delete(engagement::remove_evidence))
        .route("/evidence/{id}/file", get(engagement::get_file))
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
//how close a topic has to be to be found by meaning, as the vector index scores it ((1 + cosine) / 2). Titan scored a
//search against the topic it's after at 0.65 and up, and against unrelated topics at 0.57 and below
const SEARCH_MIN_SCORE: f64 = 0.6;
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
    //by meaning, leaving out what isn't close. Search still works by name when the embedding can't be made
    match bedrock::embed(&state.bedrock, q).await {
        Ok(vector) => {
            let mut rows = state.graph.execute(query("
                CALL db.index.vector.queryNodes('topic_vector', $k, $vector) YIELD node, score
                WHERE score >= $min_score
                RETURN node.id AS id
            ").param("k", SEARCH_CANDIDATES).param("vector", vector).param("min_score", SEARCH_MIN_SCORE)).await.map_err(internal)?;
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

// ---------------------------------------------------------------------------------------------------------------------
// Exploring from a topic or an Idea
// ---------------------------------------------------------------------------------------------------------------------

//something linked to a topic or an Idea: a topic, an Idea or a skill. A topic or a skill has a status, an Idea a type,
//and a skill that needs the topic the strength of its strongest link and the deepest Bloom level it needs
#[derive(Serialize, Deserialize)]
pub struct Linked {
    id: String,
    name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    status: Option<String>,
    #[serde(default, rename = "type", skip_serializing_if = "Option::is_none")]
    kind: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    strength: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rank: Option<i64>,
}

//a page of what's linked one way, and how many are linked that way in all
#[derive(Serialize, Deserialize)]
pub struct Group {
    items: Vec<Linked>,
    total: i64,
}

#[derive(Serialize, Deserialize)]
pub struct Centre {
    id: String,
    name: String,
    description: Option<String>,
    status: String,
}

#[derive(Serialize)]
pub struct Neighbors {
    topic: Centre,
    broader: Group, //the topics it's a subtopic of
    narrower: Group, //its subtopics
    ideas: Group, //the Ideas it includes
    needed_by: Group, //skills whose levels need knowledge of it
    similar: Group, //the closest topics by meaning, other than its broader and narrower ones
}

//how many of each kind of link come at a time, and how many similar topics a topic has
const NEIGHBOR_PAGE: i64 = 12;
const SIMILAR: i64 = 8;

//a kind of link that's paged through: its name, the pattern from the centre `c` to a linked node `o`, the order they
//come in, and what each is returned as
type GroupQuery = (&'static str, &'static str, &'static str, &'static str);

const TOPIC: &str = "{id: o.id, name: o.name, status: o.status}";
const IDEA: &str = "{id: o.id, name: o.name, type: o.type}";

const GROUPS: [GroupQuery; 4] = [
    ("broader", "MATCH (c)-[:SUBTOPIC_OF]->(o:Topic)", "WITH o ORDER BY o.name", TOPIC),
    ("narrower", "MATCH (o:Topic)-[:SUBTOPIC_OF]->(c)", "WITH o ORDER BY o.name", TOPIC),
    ("ideas", "MATCH (c)-[:INCLUDES]->(o:Idea)", "WITH o ORDER BY o.name", IDEA),
    (
        "needed_by",
        "MATCH (o:Skill)-[:HAS_LEVEL]->(:DreyfusLevel)-[r:REQUIRES_KNOWLEDGE]->(b:BloomLevel)<-[:HAS_LEVEL]-(c)",
        "WITH c, o, max(r.strength) AS strength, max(b.rank) AS rank ORDER BY strength DESC, o.name",
        "{id: o.id, name: o.name, status: o.status, strength: strength, rank: rank}",
    ),
];

const IDEA_GROUPS: [GroupQuery; 4] = [
    ("topics", "MATCH (o:Topic)-[:INCLUDES]->(c)", "WITH o ORDER BY o.name", TOPIC),
    ("requires", "MATCH (c)-[:REQUIRES_KNOWLEDGE]->(o:Idea)", "WITH o ORDER BY o.name", IDEA),
    ("required_by", "MATCH (o:Idea)-[:REQUIRES_KNOWLEDGE]->(c)", "WITH o ORDER BY o.name", IDEA),
    ("analogous", "MATCH (c)-[:ANALOGOUS_TO]-(o:Idea)", "WITH DISTINCT o ORDER BY o.name", IDEA),
];

//a page of one kind of link from $skip, as the columns <name>_items and <name>_total. They're two columns rather than
//one map, since Neo4j 5.26 rejects an aggregating COLLECT inside a map literal
fn group_columns((name, pattern, order, item): &GroupQuery) -> String {
    format!(
        "COLLECT {{ {pattern} {order} SKIP $skip LIMIT $limit RETURN {item} }} AS {name}_items,
         COUNT {{ {pattern} WITH DISTINCT o RETURN o }} AS {name}_total"
    )
}

//every kind of link in `groups`, as columns
fn all_group_columns(groups: &[GroupQuery]) -> String {
    groups.iter().map(group_columns).collect::<Vec<_>>().join(", ")
}

//one kind of link read back from its two columns
fn read_group(row: &neo4rs::Row, name: &str) -> Result<Group, (StatusCode, String)> {
    Ok(Group {
        items: row.get(&format!("{name}_items")).map_err(internal)?,
        total: row.get(&format!("{name}_total")).map_err(internal)?,
    })
}

//what's around a topic, for exploring from it: a page of each kind of link with how many there are in all, and the
//topic itself without its levels
pub async fn get_neighbors(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Neighbors>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (c:Topic {{id: $id}})
        RETURN {{id: c.id, name: c.name, description: c.description, status: c.status}} AS topic, {}, c.vector AS vector
    ", all_group_columns(&GROUPS))).param("id", id.as_str()).param("skip", 0).param("limit", NEIGHBOR_PAGE)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let topic: Centre = row.get("topic").map_err(internal)?;
    let group = |name: &str| read_group(&row, name);
    let (broader, narrower, ideas, needed_by) = (group("broader")?, group("narrower")?, group("ideas")?, group("needed_by")?);
    let vector: Option<Vec<f64>> = row.get("vector").map_err(internal)?;
    drop(rows);

    let mut similar = Vec::new();
    if let Some(vector) = vector {
        //one more than shown, since the topic itself is the closest
        let mut rows = state.graph.execute(query("
            MATCH (c:Topic {id: $id})
            CALL db.index.vector.queryNodes('topic_vector', $k, $vector) YIELD node, score
            WHERE node <> c AND score >= $min_score AND NOT (node)-[:SUBTOPIC_OF]-(c)
            RETURN node.id AS id, node.name AS name, node.status AS status
            ORDER BY score DESC
        ").param("id", id.as_str()).param("k", SIMILAR + 1).param("vector", vector).param("min_score", resolver::MIN_SCORE))
            .await.map_err(internal)?;
        while let Some(row) = rows.next().await.map_err(internal)? {
            similar.push(row.to::<Linked>().map_err(internal)?);
        }
    }
    let similar = Group { total: similar.len() as i64, items: similar };
    Ok(Json(Neighbors { topic, broader, narrower, ideas, needed_by, similar }))
}

#[derive(Deserialize)]
pub struct PageParams {
    skip: i64,
}

//the next page of one kind of link from the node `label` with `id`, from `skip`
async fn page(state: &AppState, label: &str, groups: &[GroupQuery], id: &str, group: &str, skip: i64) -> Result<Json<Group>, (StatusCode, String)> {
    let found = groups.iter().find(|g| g.0 == group).ok_or_else(|| (StatusCode::NOT_FOUND, "They aren't linked that way.".to_string()))?;
    let mut rows = state.graph.execute(query(&format!("
        MATCH (c:{label} {{id: $id}})
        RETURN {}
    ", group_columns(found))).param("id", id).param("skip", skip.max(0)).param("limit", NEIGHBOR_PAGE))
        .await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(read_group(&row, found.0)?))
}

//the next page of one kind of link from a topic
pub async fn get_neighbor_page(State(state): State<AppState>, Path((id, group)): Path<(String, String)>, Query(params): Query<PageParams>) -> Result<Json<Group>, (StatusCode, String)> {
    page(&state, "Topic", &GROUPS, &id, &group, params.skip).await
}

#[derive(Serialize)]
pub struct IdeaNeighbors {
    idea: IdeaCentre,
    topics: Group, //the topics that include it
    requires: Group, //the Ideas to understand first
    required_by: Group, //the Ideas that build on it
    analogous: Group, //Ideas with the same structure in another field
}

#[derive(Serialize, Deserialize)]
pub struct IdeaCentre {
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    description: Option<String>,
}

//an Idea, with a page of each kind of link from it and how many there are in all
pub async fn get_idea(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<IdeaNeighbors>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (c:Idea {{id: $id}})
        RETURN {{id: c.id, name: c.name, type: c.type, description: c.description}} AS idea, {}
    ", all_group_columns(&IDEA_GROUPS))).param("id", id.as_str()).param("skip", 0).param("limit", NEIGHBOR_PAGE)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| (StatusCode::NOT_FOUND, "That Idea doesn't exist.".to_string()))?;
    let group = |name: &str| read_group(&row, name);
    Ok(Json(IdeaNeighbors {
        idea: row.get("idea").map_err(internal)?,
        topics: group("topics")?,
        requires: group("requires")?,
        required_by: group("required_by")?,
        analogous: group("analogous")?,
    }))
}

//the next page of one kind of link from an Idea
pub async fn get_idea_page(State(state): State<AppState>, Path((id, group)): Path<(String, String)>, Query(params): Query<PageParams>) -> Result<Json<Group>, (StatusCode, String)> {
    page(&state, "Idea", &IDEA_GROUPS, &id, &group, params.skip).await
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
