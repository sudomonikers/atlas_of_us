//how many hours a week people practice the skills they're on (PRACTICES), where their time goes, and the skills that look
//rusty or stuck because of it. A skill they haven't said anything about isn't flagged, since there's nothing to go on
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use chrono::{Months, NaiveDate, Utc};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{SkillRef, current, internal, not_found};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/practice", get(practice))
        .route("/{id}/practice", put(set_practice))
}

//the most hours a week anyone can say they practice a skill
const MAX_HOURS: f64 = 100.0;
//the lowest level a skill is flagged rusty at, when it gets no practice
const RUSTY_RANK: i64 = 4;
//a skill is flagged as a plateau when it gets at least this many hours a week and they've been at the same level, below
//Expert, for at least this many months
const PLATEAU_HOURS: f64 = 3.0;
const PLATEAU_MONTHS: u32 = 12;

//a skill the logged in user is on, how much they practice it, and whether that makes it look rusty or stuck
#[derive(Serialize)]
pub struct Practice {
    skill: SkillRef,
    rank: i64, //the level they're at
    hours_per_week: Option<f64>, //None until they say
    at_level_since: String, //YYYY-MM-DD, when they reached the level they're at
    flag: Option<&'static str>, //rusty: Proficient or above with no practice. plateau: lots of practice and no new level for a long time
}

#[derive(Deserialize)]
struct Row {
    skill: SkillRef,
    rank: i64,
    hours_per_week: Option<f64>,
    at_level_since: String,
}

fn flag(row: &Row, plateau_before: NaiveDate) -> Option<&'static str> {
    let hours = row.hours_per_week?;
    if hours == 0.0 && row.rank >= RUSTY_RANK {
        return Some("rusty");
    }
    let since = NaiveDate::parse_from_str(&row.at_level_since, "%Y-%m-%d").ok()?;
    (hours >= PLATEAU_HOURS && row.rank < 5 && since <= plateau_before).then_some("plateau")
}

//every skill the logged in user is on with how much they practice it, the most practiced first, then the ones they
//haven't said about
async fn practice(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Practice>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[a:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        WHERE {}
        OPTIONAL MATCH (p)-[pr:PRACTICES]->(s)
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, l.rank AS rank, pr.hoursPerWeek AS hours_per_week,
               toString(coalesce(a.achievedOn, date(a.recordedAt))) AS at_level_since
        ORDER BY hours_per_week IS NULL, hours_per_week DESC, rank DESC, s.name
    ", current("p", "l", "s"))).param("personId", user.person_id)).await.map_err(internal)?;
    let today = Utc::now().date_naive();
    let plateau_before = today.checked_sub_months(Months::new(PLATEAU_MONTHS)).unwrap_or(today);
    let mut skills = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        let row = row.to::<Row>().map_err(internal)?;
        let flag = flag(&row, plateau_before);
        let Row { skill, rank, hours_per_week, at_level_since } = row;
        skills.push(Practice { skill, rank, hours_per_week, at_level_since, flag });
    }
    Ok(Json(skills))
}

#[derive(Deserialize)]
struct PracticeRequest {
    hours_per_week: f64,
}

//sets how many hours a week the logged in user practices a skill they're on. 0 says they don't practice it now
async fn set_practice(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<PracticeRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if !(0.0..=MAX_HOURS).contains(&req.hours_per_week) {
        return Err((StatusCode::BAD_REQUEST, format!("Pick between 0 and {MAX_HOURS} hours a week.")));
    }
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})
        RETURN EXISTS { (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s) } AS achieved
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    let achieved: bool = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("achieved").map_err(internal)?;
    drop(rows);
    if !achieved {
        return Err((StatusCode::BAD_REQUEST, "Place yourself on the skill before saying how much you practice it.".to_string()));
    }

    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})
        MERGE (p)-[pr:PRACTICES]->(s)
        SET pr.hoursPerWeek = $hours, pr.updatedAt = datetime()
    ").param("personId", user.person_id.as_str()).param("id", id.as_str()).param("hours", req.hours_per_week)).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
