//how people feel about skills: LIKES, DISLIKES, BORED_BY and INTIMIDATED_BY, each with how strongly and why. They stack,
//so someone can like and dislike a skill for different reasons, and they don't need to be on a skill to feel something
//about it
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{internal, not_found};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/feelings", get(all_feelings))
        .route("/{id}/feelings", put(set_feelings))
}

//each feeling as the api names it, and its relationship
const KINDS: [(&str, &str); 4] = [("likes", "LIKES"), ("dislikes", "DISLIKES"), ("bored_by", "BORED_BY"), ("intimidated_by", "INTIMIDATED_BY")];
//the longest a reason can be
const MAX_REASON: usize = 200;

//a way someone feels about a skill
#[derive(Serialize, Deserialize, Clone)]
pub struct Feeling {
    kind: String, //likes, dislikes, bored_by or intimidated_by
    intensity: f64, //how strongly, above 0 up to 1
    reason: Option<String>,
}

//the feelings of the person `p` about the skill `s`, as a COLLECT expression, in the order of KINDS
pub(super) fn collect(person: &str, skill: &str) -> String {
    let order: Vec<String> = KINDS.iter().enumerate().map(|(i, (kind, _))| format!("WHEN '{kind}' THEN {i}")).collect();
    format!("COLLECT {{
        MATCH ({person})-[f:LIKES|DISLIKES|BORED_BY|INTIMIDATED_BY]->({skill})
        WITH f, toLower(type(f)) AS kind
        RETURN {{kind: kind, intensity: f.intensity, reason: f.reason}} ORDER BY CASE kind {} END
    }}", order.join(" "))
}

//a skill and how the logged in user feels about it
#[derive(Serialize, Deserialize)]
pub struct SkillFeelings {
    skill_id: String,
    feelings: Vec<Feeling>,
}

//every skill the logged in user has feelings about, for My Skills
async fn all_feelings(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<SkillFeelings>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[:LIKES|DISLIKES|BORED_BY|INTIMIDATED_BY]->(s:Skill)
        WITH DISTINCT p, s
        RETURN s.id AS skill_id, {} AS feelings
    ", collect("p", "s"))).param("personId", user.person_id)).await.map_err(internal)?;
    let mut skills = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        skills.push(row.to::<SkillFeelings>().map_err(internal)?);
    }
    Ok(Json(skills))
}

//sets every way the logged in user feels about a skill, in place of what they felt before. A feeling that stays keeps
//when they first said it. An empty list clears them all
async fn set_feelings(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(feelings): Json<Vec<Feeling>>) -> Result<StatusCode, (StatusCode, String)> {
    let bad_request = |message: String| (StatusCode::BAD_REQUEST, message);
    let mut given: [Option<Feeling>; 4] = Default::default();
    for feeling in feelings {
        let i = KINDS.iter().position(|(kind, _)| *kind == feeling.kind).ok_or_else(|| bad_request("That isn't a feeling we know.".to_string()))?;
        if given[i].is_some() {
            return Err(bad_request("Give each feeling once.".to_string()));
        }
        if !(feeling.intensity > 0.0 && feeling.intensity <= 1.0) {
            return Err(bad_request("Say how strongly you feel it.".to_string()));
        }
        let reason = feeling.reason.as_deref().map(str::trim).filter(|r| !r.is_empty()).map(str::to_string);
        if reason.as_ref().is_some_and(|r| r.chars().count() > MAX_REASON) {
            return Err(bad_request(format!("Keep each reason to {MAX_REASON} characters or fewer.")));
        }
        given[i] = Some(Feeling { reason, ..feeling });
    }

    //each feeling is merged when it's given and deleted when it isn't
    let statements: Vec<String> = KINDS.iter().map(|(kind, rel)| format!("
        FOREACH (_ IN CASE WHEN ${kind}_intensity IS NULL THEN [] ELSE [1] END |
            MERGE (p)-[f:{rel}]->(s)
            ON CREATE SET f.timestamp = datetime()
            SET f.intensity = ${kind}_intensity, f.reason = ${kind}_reason)
        WITH p, s
        OPTIONAL MATCH (p)-[old:{rel}]->(s) WHERE ${kind}_intensity IS NULL
        DELETE old
        WITH DISTINCT p, s
    ")).collect();
    let mut q = query(&format!("
        MATCH (p:Person {{id: $personId}}), (s:Skill {{id: $id}})
        {}
        RETURN s.id AS id
    ", statements.join(""))).param("personId", user.person_id.as_str()).param("id", id.as_str());
    for ((kind, _), feeling) in KINDS.iter().zip(given) {
        q = q.param(&format!("{kind}_intensity"), feeling.as_ref().map(|f| f.intensity)).param(&format!("{kind}_reason"), feeling.and_then(|f| f.reason));
    }
    let mut rows = state.graph.execute(q).await.map_err(internal)?;
    rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(StatusCode::NO_CONTENT)
}
