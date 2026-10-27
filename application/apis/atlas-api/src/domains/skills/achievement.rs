//placing yourself on a skill: the one Dreyfus level you've reached in it (ACHIEVED), when you got there, and the evidence
//you give for it once you're on it. See "Placing yourself on a skill" in documentation/architecture/skills.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
};
use chrono::{NaiveDate, Utc};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    evidence::{self, About, Evidence},
    state::AppState,
};

use super::{SkillRef, internal, not_found};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/achievements", get(list_achievements))
        .route("/{id}/achievement", get(get_achievement).put(set_level).delete(remove_achievement))
        .route("/{id}/evidence", post(add_note))
        .route("/{id}/evidence/uploads", post(start_upload))
        .route("/{id}/evidence/files", post(add_file))
}

fn about(id: &str) -> About<'_> {
    About { label: "Skill", id }
}

//where the logged in user is with a skill: the rank of the level they've reached, if they've placed themselves on it,
//and when they reached it if they said
#[derive(Serialize, Deserialize)]
pub struct Achievement {
    rank: Option<i64>,
    achieved_on: Option<String>, //YYYY-MM-DD
    evidence: Vec<Evidence>, //oldest first
}

//a skill someone has placed themselves on, with the level they've reached, when, and their evidence
#[derive(Serialize, Deserialize)]
pub struct PersonSkill {
    skill: SkillRef,
    rank: i64,
    achieved_on: Option<String>, //YYYY-MM-DD
    updated_at: String,
    evidence: Vec<Evidence>,
}

//where the logged in user is with a skill
async fn get_achievement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Achievement>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (s:Skill {{id: $id}}), (p:Person {{id: $personId}})
        OPTIONAL MATCH (p)-[r:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        RETURN l.rank AS rank, toString(r.achievedOn) AS achieved_on, {} AS evidence
    ", evidence::collect("p", "s"))).param("id", id).param("personId", user.person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Achievement>().map_err(internal)?))
}

#[derive(Deserialize)]
struct LevelRequest {
    rank: i64,
    achieved_on: Option<String>, //YYYY-MM-DD
}

//places the logged in user at one of a ready skill's levels, in place of any level they were at before, with when they
//reached it if they say
async fn set_level(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<LevelRequest>) -> Result<StatusCode, (StatusCode, String)> {
    let bad_request = |message: &str| (StatusCode::BAD_REQUEST, message.to_string());
    if !(1..=5).contains(&req.rank) {
        return Err(bad_request("Pick one of the five levels."));
    }
    let achieved_on = match req.achieved_on.as_deref() {
        Some(date) => {
            let date = NaiveDate::parse_from_str(date, "%Y-%m-%d").map_err(|_| bad_request("That date doesn't look right."))?;
            if date > Utc::now().date_naive() {
                return Err(bad_request("That date is in the future."));
            }
            Some(date.to_string())
        }
        None => None,
    };

    let mut rows = state.graph.execute(query("MATCH (s:Skill {id: $id}) RETURN s.status AS status").param("id", id.as_str()))
        .await.map_err(internal)?;
    let status: String = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("status").map_err(internal)?;
    drop(rows);
    if status != "ready" {
        return Err(bad_request("That skill's levels aren't written yet."));
    }

    //keeps when they first placed themselves on the skill, and the version of the level they read
    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})-[:HAS_LEVEL]->(l:DreyfusLevel {rank: $rank})
        OPTIONAL MATCH (p)-[old:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WITH p, l, collect(old) AS olds, min(old.since) AS since
        FOREACH (o IN olds | DELETE o)
        CREATE (p)-[:ACHIEVED {
            since: coalesce(since, datetime()), updatedAt: datetime(), levelVersion: l.version,
            achievedOn: CASE WHEN $achievedOn IS NULL THEN null ELSE date($achievedOn) END
        }]->(l)
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("rank", req.rank)
        .param("achievedOn", achieved_on)
    ).await.map_err(internal)?;
    tracing::info!(skill_id = id, rank = req.rank, "placed a person on a skill");
    Ok(StatusCode::NO_CONTENT)
}

//takes the logged in user off a skill, with all their evidence for it
async fn remove_achievement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (:Person {id: $personId})-[r:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(:Skill {id: $id})
        DELETE r
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    evidence::remove_all(&state, &user.person_id, about(&id)).await?;
    Ok(StatusCode::NO_CONTENT)
}

//evidence is for the level they're at, so they place themselves on the skill first
async fn check_achieved(graph: &Graph, person_id: &str, id: &str) -> Result<(), (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})
        RETURN EXISTS { (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s) } AS achieved
    ").param("personId", person_id).param("id", id)).await.map_err(internal)?;
    let achieved: bool = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.get("achieved").map_err(internal)?;
    if !achieved {
        return Err((StatusCode::BAD_REQUEST, "Place yourself on the skill before adding evidence.".to_string()));
    }
    Ok(())
}

async fn add_note(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::NoteRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    check_achieved(&state.graph, &user.person_id, &id).await?;
    Ok(Json(evidence::add_note(&state, &user.person_id, about(&id), req).await?))
}

async fn start_upload(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::UploadRequest>) -> Result<Json<evidence::Upload>, (StatusCode, String)> {
    check_achieved(&state.graph, &user.person_id, &id).await?;
    Ok(Json(evidence::start_upload(&state, &user.person_id, about(&id), req).await?))
}

async fn add_file(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<evidence::FileRequest>) -> Result<Json<Evidence>, (StatusCode, String)> {
    if let Err(e) = check_achieved(&state.graph, &user.person_id, &id).await {
        evidence::discard_upload(&state, &user.person_id, &req.upload_id).await;
        return Err(e);
    }
    Ok(Json(evidence::add_file(&state, &user.person_id, about(&id), req).await?))
}

//the skills someone has placed themselves on, highest level first, each with when they got there and their evidence
pub async fn person_skills(graph: &Graph, person_id: &str) -> Result<Vec<PersonSkill>, (StatusCode, String)> {
    let mut rows = graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[r:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, l.rank AS rank, toString(r.achievedOn) AS achieved_on,
               toString(r.updatedAt) AS updated_at, {} AS evidence
        ORDER BY rank DESC, s.name
    ", evidence::collect("p", "s"))).param("personId", person_id)).await.map_err(internal)?;
    let mut skills = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        skills.push(row.to::<PersonSkill>().map_err(internal)?);
    }
    Ok(skills)
}

//the skills the logged in user has placed themselves on, for My Skills
async fn list_achievements(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<PersonSkill>>, (StatusCode, String)> {
    Ok(Json(person_skills(&state.graph, &user.person_id).await?))
}
