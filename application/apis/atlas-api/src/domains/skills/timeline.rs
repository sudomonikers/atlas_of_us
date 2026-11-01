//a person's progress through their skills over time: each level they've reached (ACHIEVED) in the skills they're on,
//and when. A level's date is the one they gave for reaching it, or else when they said they had it
use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{SkillRef, internal};

pub fn router() -> Router<AppState> {
    Router::new().route("/timeline", get(timeline))
}

//a level someone reached in a skill, and when
#[derive(Serialize, Deserialize)]
pub struct Step {
    rank: i64,
    on: String, //YYYY-MM-DD
}

//a skill someone is on, and the levels they've reached in it, earliest first
#[derive(Serialize, Deserialize)]
pub struct TimelineSkill {
    skill: SkillRef,
    steps: Vec<Step>,
}

//the logged in user's timeline, the skill they started earliest first
async fn timeline(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<TimelineSkill>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})-[a:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        WITH s, l.rank AS rank, coalesce(a.achievedOn, date(a.recordedAt)) AS on
        ORDER BY on, rank
        WITH s, collect({rank: rank, on: toString(on)}) AS steps, min(on) AS first
        RETURN {id: s.id, name: s.name, status: s.status} AS skill, steps
        ORDER BY first, s.name
    ").param("personId", user.person_id)).await.map_err(internal)?;
    let mut skills = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        skills.push(row.to::<TimelineSkill>().map_err(internal)?);
    }
    Ok(Json(skills))
}
