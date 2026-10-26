//Skills Graph: Skill nodes with 5 Dreyfus levels linked by HAS_LEVEL / NEXT_LEVEL. How skills are searched for, asked
//for and filled is described in documentation/architecture/skills.md
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

use atlas_shared::skills::resolver;

use crate::{auth::AuthUser, bedrock, events, helpers::lucene, state::AppState};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(health_check).post(ask_for_skill))
        .route("/search", get(search))
        .route("/{id}", get(get_skill))
        .route("/{id}/neighbors", get(get_neighbors))
        .route("/{id}/neighbors/{group}", get(get_neighbor_page))
        .route("/{id}/fill", post(request_fill))
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
    status: String,
}

//a skill as search and the gates show it, with the broader skills it's a kind of
#[derive(Serialize, Deserialize)]
pub struct SkillSummary {
    id: String,
    name: String,
    description: Option<String>,
    status: String, //stub, filling, ready or failed
    broader: Vec<SkillRef>,
}

//fetches skills by id, in the order given
async fn summaries(state: &AppState, ids: &[String]) -> Result<Vec<SkillSummary>, BoxError> {
    let mut rows = state.graph.execute(query("
        UNWIND range(0, size($ids) - 1) AS i
        MATCH (s:Skill {id: $ids[i]})
        RETURN s.id AS id, s.name AS name, s.description AS description, s.status AS status,
               COLLECT { MATCH (s)-[:SPECIALIZATION_OF]->(b:Skill) RETURN {id: b.id, name: b.name, status: b.status} AS b ORDER BY b.name } AS broader
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

//the skills closest to what was typed, by name and alias and by meaning, each with its broader skills
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
    //it's a skill we already have
    Existing { skill: SkillSummary },
    //a new stub, ready to be opened
    Created { skill: SkillSummary },
}

pub async fn ask_for_skill(State(state): State<AppState>, _user: AuthUser, Json(req): Json<AskRequest>) -> Result<Json<AskOutcome>, (StatusCode, String)> {
    let typed = req.query.trim();
    if typed.is_empty() || typed.chars().count() > 100 {
        return Err((StatusCode::BAD_REQUEST, "Describe the skill in 100 characters or fewer.".to_string()));
    }

    let screening = gates::screen(&state, typed).await.map_err(internal)?;
    tracing::info!(kind = screening.kind, acceptable = screening.acceptable, "screened a skill request");
    if !screening.acceptable {
        return Ok(Json(AskOutcome::Rejected { reason: screening.rejection_reason }));
    }
    if screening.kind != "skill" {
        return Ok(Json(AskOutcome::NotASkill { kind: screening.kind, name: screening.name }));
    }

    let (resolution, vector) = resolver::resolve(&state.graph, &state.bedrock, &screening.name, &screening.description).await.map_err(internal)?;
    let id = match resolution {
        resolver::Resolution::Same { skill_id } => {
            tracing::info!(skill_id, "skill request means an existing skill");
            let skill = summaries(&state, &[skill_id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
            return Ok(Json(AskOutcome::Existing { skill }));
        }
        resolver::Resolution::New { broader, narrower } => {
            resolver::create_stub(&state.graph, &state.bus, &screening.name, &screening.description, vector, &broader, &narrower).await.map_err(internal)?
        }
    };
    tracing::info!(skill_id = id, "created a skill stub");
    let skill = summaries(&state, &[id]).await.map_err(internal)?.pop().ok_or_else(not_found)?;
    Ok(Json(AskOutcome::Created { skill }))
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
    traits: Vec<TraitRequirement>, //the personality it takes, written on this level itself. Lower levels' carry up to it
    skills: Vec<SkillRequirement>, //the other skills it needs, written on this level itself. Lower levels' carry up to it
}

//a personality trait a level takes. `level` is where on the trait it pulls, above 0.5 for more of it and below for less
#[derive(Serialize, Deserialize)]
pub struct TraitRequirement {
    name: String,
    level: f64,
    strength: f64, //how much it matters, 0 to 1
    reason: String,
}

//a level of another skill a level needs
#[derive(Serialize, Deserialize)]
pub struct SkillRequirement {
    id: String,
    name: String,
    status: String,
    rank: i64, //the level of it that's needed
    strength: f64, //how essential it is, 0 to 1
    reason: String,
}

#[derive(Serialize, Deserialize)]
pub struct Skill {
    id: String,
    name: String,
    description: Option<String>,
    aliases: Vec<String>,
    status: String,
    levels: Vec<Level>, //Novice to Expert. A stub's levels only have a rank and a name
}

//a skill and its levels. A stub's levels are empty until it's filled, which the ui asks for with POST /{id}/fill
pub async fn get_skill(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Skill>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (s:Skill {id: $id})
        CALL (s) {
            MATCH (s)-[:HAS_LEVEL]->(l:DreyfusLevel)
            OPTIONAL MATCH (l)-[n:NEXT_LEVEL]->()
            WITH l, n ORDER BY l.rank
            RETURN collect({
                rank: l.rank, name: l.name, description: l.description, observable_signs: l.observableSigns,
                example_evidence: l.exampleEvidence, version: l.version, trust: l.trust, next_level: n.description,
                traits: COLLECT {
                    MATCH (l)-[r:REQUIRES_TRAIT]->(t:PersonalityTrait)
                    RETURN {name: t.name, level: r.level, strength: r.strength, reason: r.reason} ORDER BY r.strength DESC
                },
                skills: COLLECT {
                    MATCH (l)-[r:REQUIRES_SKILL]->(ol:DreyfusLevel)<-[:HAS_LEVEL]-(o:Skill)
                    RETURN {id: o.id, name: o.name, status: o.status, rank: ol.rank, strength: r.strength, reason: r.reason}
                    ORDER BY r.strength DESC
                }
            }) AS levels
        }
        RETURN s.id AS id, s.name AS name, s.description AS description, s.aliases AS aliases, s.status AS status, levels
    ").param("id", id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Skill>().map_err(internal)?))
}

//a skill linked to another. A prerequisite carries how essential the strongest link between their levels is, 0 to 1
#[derive(Serialize, Deserialize)]
pub struct Neighbor {
    id: String,
    name: String,
    status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    strength: Option<f64>,
}

//a page of the skills linked to a skill one way, and how many are linked that way in all
#[derive(Serialize, Deserialize)]
pub struct Group {
    skills: Vec<Neighbor>,
    total: i64,
}

#[derive(Serialize, Deserialize)]
pub struct Centre {
    id: String,
    name: String,
    description: Option<String>,
    status: String,
}

//a personality trait a skill's levels take, with how much the strongest of them matters, 0 to 1
#[derive(Serialize, Deserialize)]
pub struct TraitLink {
    id: String,
    name: String,
    strength: f64,
}

#[derive(Serialize)]
pub struct Neighbors {
    skill: Centre,
    broader: Group, //the skills it's a kind of
    narrower: Group, //the skills that are kinds of it
    needs: Group, //skills its levels require
    leads_to: Group, //skills whose levels require its levels
    similar: Group, //the closest skills by meaning, other than its broader and narrower ones
    traits: Vec<TraitLink>, //every personality trait its levels take, strongest first. There are only 30, so they aren't paged
}

//how many of each kind of link come at a time, and how many similar skills a skill has
const NEIGHBOR_PAGE: i64 = 12;
const SIMILAR: i64 = 8;

//the kinds of link that are paged through: the pattern from the skill `s` to a linked skill `o`, and the order they
//come in. Prerequisites come strongest first, with the strength of their strongest link
const GROUPS: [(&str, &str, &str); 4] = [
    ("broader", "MATCH (s)-[:SPECIALIZATION_OF]->(o:Skill)", "WITH o, null AS strength ORDER BY o.name"),
    ("narrower", "MATCH (o:Skill)-[:SPECIALIZATION_OF]->(s)", "WITH o, null AS strength ORDER BY o.name"),
    (
        "needs",
        "MATCH (s)-[:HAS_LEVEL]->(:DreyfusLevel)-[r:REQUIRES_SKILL]->(:DreyfusLevel)<-[:HAS_LEVEL]-(o:Skill)",
        "WITH o, coalesce(max(r.strength), 0.0) AS strength ORDER BY strength DESC, o.name",
    ),
    (
        "leads_to",
        "MATCH (o:Skill)-[:HAS_LEVEL]->(:DreyfusLevel)-[r:REQUIRES_SKILL]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s)",
        "WITH o, coalesce(max(r.strength), 0.0) AS strength ORDER BY strength DESC, o.name",
    ),
];

//a page of one kind of link as a map expression, from $skip, with the total
fn group_expression(pattern: &str, order: &str) -> String {
    format!(
        "{{skills: COLLECT {{ {pattern} {order} SKIP $skip LIMIT $limit RETURN {{id: o.id, name: o.name, status: o.status, strength: strength}} }},
          total: COUNT {{ {pattern} WITH DISTINCT o RETURN o }}}}"
    )
}

//the skills around a skill, for exploring from it: a page of each kind of link with how many there are in all, and
//the skill itself without its levels
pub async fn get_neighbors(State(state): State<AppState>, Path(id): Path<String>) -> Result<Json<Neighbors>, (StatusCode, String)> {
    let groups: Vec<String> = GROUPS.iter().map(|(name, pattern, order)| format!("{} AS {name}", group_expression(pattern, order))).collect();
    let mut rows = state.graph.execute(query(&format!("
        MATCH (s:Skill {{id: $id}})
        RETURN {{id: s.id, name: s.name, description: s.description, status: s.status}} AS skill, {},
               COLLECT {{
                   MATCH (s)-[:HAS_LEVEL]->(:DreyfusLevel)-[r:REQUIRES_TRAIT]->(t:PersonalityTrait)
                   WITH t, max(r.strength) AS strength ORDER BY strength DESC, t.name
                   RETURN {{id: t.id, name: t.name, strength: strength}}
               }} AS traits,
               s.vector AS vector
    ", groups.join(", "))).param("id", id.as_str()).param("skip", 0).param("limit", NEIGHBOR_PAGE)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let skill: Centre = row.get("skill").map_err(internal)?;
    let group = |name: &str| row.get::<Group>(name).map_err(internal);
    let (broader, narrower, needs, leads_to) = (group("broader")?, group("narrower")?, group("needs")?, group("leads_to")?);
    let traits: Vec<TraitLink> = row.get("traits").map_err(internal)?;
    let vector: Option<Vec<f64>> = row.get("vector").map_err(internal)?;
    drop(rows);

    let mut similar = Vec::new();
    if let Some(vector) = vector {
        //one more than shown, since the skill itself is the closest
        let mut rows = state.graph.execute(query("
            MATCH (s:Skill {id: $id})
            CALL db.index.vector.queryNodes('skill_vector', $k, $vector) YIELD node, score
            WHERE node <> s AND score >= $min_score AND NOT (node)-[:SPECIALIZATION_OF]-(s)
            RETURN node.id AS id, node.name AS name, node.status AS status
            ORDER BY score DESC
        ").param("id", id.as_str()).param("k", SIMILAR + 1).param("vector", vector).param("min_score", resolver::MIN_SCORE))
            .await.map_err(internal)?;
        while let Some(row) = rows.next().await.map_err(internal)? {
            similar.push(row.to::<Neighbor>().map_err(internal)?);
        }
    }
    let similar = Group { total: similar.len() as i64, skills: similar };
    Ok(Json(Neighbors { skill, broader, narrower, needs, leads_to, similar, traits }))
}

#[derive(Deserialize)]
pub struct PageParams {
    skip: i64,
}

//the next page of one kind of link, from `skip`
pub async fn get_neighbor_page(State(state): State<AppState>, Path((id, group)): Path<(String, String)>, Query(params): Query<PageParams>) -> Result<Json<Group>, (StatusCode, String)> {
    let (_, pattern, order) = GROUPS.iter().find(|(name, _, _)| *name == group)
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Skills aren't linked that way.".to_string()))?;
    let mut rows = state.graph.execute(query(&format!("
        MATCH (s:Skill {{id: $id}})
        RETURN {} AS page
    ", group_expression(pattern, order))).param("id", id.as_str()).param("skip", params.skip.max(0)).param("limit", NEIGHBOR_PAGE))
        .await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.get::<Group>("page").map_err(internal)?))
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
