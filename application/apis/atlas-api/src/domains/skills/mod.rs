//Skills Graph: Skill nodes with 5 Dreyfus levels linked by HAS_LEVEL / NEXT_LEVEL. How skills are searched for, asked
//for and filled is described in documentation/architecture/skills.md
mod resolver;

use std::{collections::HashMap, env};

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{auth::AuthUser, bedrock, events, helpers::lucene, state::AppState};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(health_check).post(ask_for_skill))
        .route("/search", get(search))
        .route("/{id}", get(get_skill))
        .route("/{id}/fill", post(request_fill))
        .route("/{id}/aliases", post(add_alias))
}

/// Healthcheck for the skills router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Skills Api Healthy!"
    });
    Json(json_response)
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "That skill doesn't exist.".to_string())
}

#[derive(Serialize, Deserialize)]
pub struct SkillRef {
    id: String,
    name: String,
}

//a skill as search and the gates show it, with the broader skill it's a specialization of
#[derive(Serialize, Deserialize)]
pub struct SkillSummary {
    id: String,
    name: String,
    description: Option<String>,
    status: String, //stub, filling, ready or failed
    parent: Option<SkillRef>,
}

//fetches skills by id, in the order given
async fn summaries(state: &AppState, ids: &[String]) -> Result<Vec<SkillSummary>, BoxError> {
    let mut rows = state.graph.execute(query("
        UNWIND range(0, size($ids) - 1) AS i
        MATCH (s:Skill {id: $ids[i]})
        OPTIONAL MATCH (s)-[:SPECIALIZATION_OF]->(p:Skill)
        RETURN s.id AS id, s.name AS name, s.description AS description, s.status AS status,
               CASE WHEN p IS NULL THEN null ELSE {id: p.id, name: p.name} END AS parent
        ORDER BY i
    ").param("ids", ids.to_vec())).await?;
    let mut skills = Vec::new();
    while let Some(row) = rows.next().await? {
        skills.push(row.to::<SkillSummary>()?);
    }
    Ok(skills)
}

// ---------------------------------------------------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------------------------------------------------

//how many skills a search returns, and how many each half of it contributes before they're combined
const SEARCH_RESULTS: usize = 10;
const SEARCH_CANDIDATES: i64 = 20;
//reciprocal rank fusion's constant: higher values flatten the difference between ranks
const RRF_K: f64 = 60.0;

#[derive(Deserialize)]
pub struct SearchParams {
    q: String,
}

//the skills closest to what was typed, by name and alias and by meaning, each with its broader skill
pub async fn search(State(state): State<AppState>, Query(params): Query<SearchParams>) -> Result<Json<Vec<SkillSummary>>, (StatusCode, String)> {
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
            CALL db.index.fulltext.queryNodes('skill_names', $lucene, {limit: $limit}) YIELD node
            RETURN node.id AS id
        ").param("lucene", lucene).param("limit", SEARCH_CANDIDATES)).await.map_err(internal)?;
        ranked.push(ids(&mut rows).await.map_err(internal)?);
    }
    //by meaning. Search still works by name when the embedding can't be made
    match bedrock::embed(&state.bedrock, q).await {
        Ok(vector) => {
            let mut rows = state.graph.execute(query("
                CALL db.index.vector.queryNodes('skill_vector', $k, $vector) YIELD node
                RETURN node.id AS id
            ").param("k", SEARCH_CANDIDATES).param("vector", vector)).await.map_err(internal)?;
            ranked.push(ids(&mut rows).await.map_err(internal)?);
        }
        Err(e) => tracing::error!("couldn't embed the search, searching by name only: {e}"),
    }

    //reciprocal rank fusion: a skill near the top of either list ranks high, and one in both ranks higher
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
// Asking for a skill we don't have
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct AskRequest {
    query: String, //what the user typed
}

//what came of asking for a skill
#[derive(Serialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum AskOutcome {
    //it belongs to another module: kind is personality, topic, physical_attribute or other
    NotASkill { kind: String, name: String },
    //nonsense, or a slur
    Rejected { reason: String },
    //it's a skill we already have. alias_token adds the user's wording to it if they confirm, and is missing when we
    //already know it by that name
    Existing { skill: SkillSummary, name: String, alias_token: Option<String> },
    //a new stub, ready to be opened
    Created { skill: SkillSummary },
}

pub async fn ask_for_skill(State(state): State<AppState>, _user: AuthUser, Json(req): Json<AskRequest>) -> Result<Json<AskOutcome>, (StatusCode, String)> {
    let typed = req.query.trim();
    if typed.is_empty() || typed.chars().count() > 100 {
        return Err((StatusCode::BAD_REQUEST, "Describe the skill in 100 characters or fewer.".to_string()));
    }

    let screening = resolver::screen(&state, typed).await.map_err(internal)?;
    tracing::info!(kind = screening.kind, acceptable = screening.acceptable, "screened a skill request");
    if !screening.acceptable {
        return Ok(Json(AskOutcome::Rejected { reason: screening.rejection_reason }));
    }
    if screening.kind != "skill" {
        return Ok(Json(AskOutcome::NotASkill { kind: screening.kind, name: screening.name }));
    }

    let (resolution, vector) = resolver::resolve(&state, &screening.name, &screening.description).await.map_err(internal)?;
    let id = match resolution {
        resolver::Resolution::Same { skill_id } => {
            let skill = summaries(&state, std::slice::from_ref(&skill_id)).await.map_err(internal)?.pop().ok_or_else(not_found)?;
            let known = known_names(&state, &skill_id).await.map_err(internal)?;
            let alias_token = (!known.contains(&screening.name.to_lowercase()))
                .then(|| alias_token(&skill_id, &screening.name)).transpose().map_err(internal)?;
            tracing::info!(skill_id, "skill request means an existing skill");
            return Ok(Json(AskOutcome::Existing { skill, name: screening.name, alias_token }));
        }
        resolver::Resolution::SpecializationOf { parent_id } => {
            resolver::create_stub(&state, &screening.name, &screening.description, vector, Some(&parent_id)).await.map_err(internal)?
        }
        resolver::Resolution::New => resolver::create_stub(&state, &screening.name, &screening.description, vector, None).await.map_err(internal)?,
    };
    tracing::info!(skill_id = id, "created a skill stub");
    let skill = summaries(&state, &[id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
    Ok(Json(AskOutcome::Created { skill }))
}

//the skill's name and aliases, lowercased
async fn known_names(state: &AppState, skill_id: &str) -> Result<Vec<String>, BoxError> {
    let mut rows = state.graph.execute(query("
        MATCH (s:Skill {id: $id}) RETURN [name IN [s.name] + s.aliases | toLower(name)] AS names
    ").param("id", skill_id)).await?;
    Ok(match rows.next().await? {
        Some(row) => row.get("names")?,
        None => Vec::new(),
    })
}

// ---------------------------------------------------------------------------------------------------------------------
// Aliases
// ---------------------------------------------------------------------------------------------------------------------

//an alias the gates offered for a skill, signed so only names that went through the gates can be added
#[derive(Serialize, Deserialize)]
struct AliasClaims {
    skill_id: String,
    alias: String,
    exp: i64,
}

//how long a user has to confirm "did you mean...?"
const ALIAS_TOKEN_MINUTES: i64 = 60;

fn jwt_secret() -> Result<String, BoxError> {
    Ok(env::var("JWT_SECRET").map_err(|_| "JWT_SECRET is not set")?)
}

fn alias_token(skill_id: &str, alias: &str) -> Result<String, BoxError> {
    let claims = AliasClaims {
        skill_id: skill_id.to_string(),
        alias: alias.to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::minutes(ALIAS_TOKEN_MINUTES)).timestamp(),
    };
    Ok(encode(&Header::new(Algorithm::HS256), &claims, &EncodingKey::from_secret(jwt_secret()?.as_bytes()))?)
}

#[derive(Deserialize)]
pub struct AliasRequest {
    alias_token: String,
}

//the user confirmed that what they asked for is this skill, so their wording becomes one of its aliases
pub async fn add_alias(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<String>,
    Json(req): Json<AliasRequest>,
) -> Result<Json<SkillSummary>, (StatusCode, String)> {
    let expired = || (StatusCode::BAD_REQUEST, "That suggestion has expired. Please search again.".to_string());
    let secret = jwt_secret().map_err(internal)?;
    let claims = decode::<AliasClaims>(&req.alias_token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::new(Algorithm::HS256))
        .map_err(|_| expired())?.claims;
    if claims.skill_id != id {
        return Err(expired());
    }

    let mut rows = state.graph.execute(query("
        MATCH (s:Skill {id: $id})
        WITH s, NOT toLower($alias) IN [name IN [s.name] + s.aliases | toLower(name)] AS added
        SET s.aliases = CASE WHEN added THEN s.aliases + $alias ELSE s.aliases END
        RETURN s.name AS name, s.description AS description, s.aliases AS aliases, added
    ").param("id", id.as_str()).param("alias", claims.alias.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;

    if row.get::<bool>("added").map_err(internal)? {
        tracing::info!(skill_id = id, "added an alias");
        let name: String = row.get("name").map_err(internal)?;
        let description: Option<String> = row.get("description").map_err(internal)?;
        let aliases: Vec<String> = row.get("aliases").map_err(internal)?;
        //the vector covers the aliases too. The alias is saved either way, and a stale vector only makes search a little worse
        match bedrock::embed(&state.bedrock, &resolver::embedding_text(&name, description.as_deref().unwrap_or_default(), &aliases)).await {
            Ok(vector) => {
                state.graph.run(query("MATCH (s:Skill {id: $id}) SET s.vector = $vector").param("id", id.as_str()).param("vector", vector))
                    .await.map_err(internal)?;
            }
            Err(e) => tracing::error!(skill_id = id, "couldn't re-embed the skill: {e}"),
        }
        if let Err(e) = events::publish(&state.bus, "atlas.skills", "SkillAliasAdded", 1, json!({"skillId": id})).await {
            tracing::error!(skill_id = id, "{e}");
        }
    }
    let skill = summaries(&state, &[id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
    Ok(Json(skill))
}

// ---------------------------------------------------------------------------------------------------------------------
// Opening a skill
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
    next_level: Option<String>, //what it takes to reach the next level. Missing on Expert and on a stub's levels
}

#[derive(Serialize, Deserialize)]
pub struct Skill {
    id: String,
    name: String,
    description: Option<String>,
    aliases: Vec<String>,
    status: String,
    parent: Option<SkillRef>,
    specializations: Vec<SkillRef>,
    levels: Vec<Level>, //Novice to Expert. A stub's levels only have a rank and a name
}

//a skill and its levels. A stub's levels are empty until it's filled, which the ui asks for with POST /{id}/fill
pub async fn get_skill(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Skill>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (s:Skill {id: $id})
        OPTIONAL MATCH (s)-[:SPECIALIZATION_OF]->(p:Skill)
        CALL (s) {
            MATCH (s)-[:HAS_LEVEL]->(l:DreyfusLevel)
            OPTIONAL MATCH (l)-[n:NEXT_LEVEL]->()
            WITH l, n ORDER BY l.rank
            RETURN collect({
                rank: l.rank, name: l.name, description: l.description, observable_signs: l.observableSigns,
                example_evidence: l.exampleEvidence, version: l.version, trust: l.trust, next_level: n.description
            }) AS levels
        }
        CALL (s) {
            OPTIONAL MATCH (c:Skill)-[:SPECIALIZATION_OF]->(s)
            WITH c ORDER BY c.name
            RETURN collect({id: c.id, name: c.name}) AS specializations
        }
        RETURN s.id AS id, s.name AS name, s.description AS description, s.aliases AS aliases, s.status AS status,
               CASE WHEN p IS NULL THEN null ELSE {id: p.id, name: p.name} END AS parent, specializations, levels
    ").param("id", id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Skill>().map_err(internal)?))
}

#[derive(Serialize)]
pub struct FillStatus {
    status: String,
}

//asks for a stub's levels to be filled, or a failed fill to be tried again. Anything else is left as it is, so it's safe
//to call every time a skill is opened. The ui then polls GET /{id} until it's ready
pub async fn request_fill(State(state): State<AppState>, _user: AuthUser, Path(id): Path<String>) -> Result<Json<FillStatus>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (s:Skill {id: $id})
        WITH s, s.status AS before
        SET s.status = CASE WHEN before IN ['stub', 'failed'] THEN 'filling' ELSE before END
        RETURN before, s.status AS status
    ").param("id", id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let before: String = row.get("before").map_err(internal)?;
    let status: String = row.get("status").map_err(internal)?;

    if before != status {
        tracing::info!(skill_id = id, before, "requested a skill fill");
        if let Err(e) = events::publish(&state.bus, "atlas.skills", "SkillFillRequested", 1, json!({"skillId": id})).await {
            //nothing will fill it, so put it back for the next person who opens it to try again
            state.graph.run(query("MATCH (s:Skill {id: $id, status: 'filling'}) SET s.status = $before")
                .param("id", id.as_str()).param("before", before)).await.map_err(internal)?;
            return Err(internal(e));
        }
    }
    Ok(Json(FillStatus { status }))
}
