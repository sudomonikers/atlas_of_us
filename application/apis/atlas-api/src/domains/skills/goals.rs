//the levels people want to reach in skills (WANTS_TO_REACH), and when by if they say. A goal is reached once they're at
//its level or above, and stays until they clear it
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use chrono::{NaiveDate, Utc};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{
    SkillRef,
    achievement::{AbilityStep, SkillStep, TopicStep, TraitStep, requirements},
    current, internal, not_found,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/goals", get(goals))
        .route("/{id}/goal", put(set_goal).delete(clear_goal))
}

//a level of a skill the logged in user wants to reach, where they are now, and what the level takes
#[derive(Serialize, Deserialize)]
pub struct Goal {
    skill: SkillRef,
    rank: i64, //the level they want to reach
    by: Option<String>, //YYYY-MM-DD
    set_at: String,
    current: Option<i64>, //the level they're at now, if they've placed themselves on the skill
    reached_on: Option<String>, //YYYY-MM-DD, when they first reached it or a level above, once they have
    description: Option<String>, //what the level is
    skills: Vec<SkillStep>,
    topics: Vec<TopicStep>,
    traits: Vec<TraitStep>,
    abilities: Vec<AbilityStep>,
}

//the logged in user's goals: the ones still to reach first, soonest date first, then the ones they've reached
async fn goals(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Goal>>, (StatusCode, String)> {
    let [skills, topics, traits, abilities] = requirements("goal");
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[g:WANTS_TO_REACH]->(goal:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        OPTIONAL MATCH (p)-[:ACHIEVED]->(at:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WHERE {current}
        WITH p, g, goal, s, at, head(COLLECT {{
            MATCH (p)-[a:ACHIEVED]->(al:DreyfusLevel)<-[:HAS_LEVEL]-(s)
            WHERE al.rank >= goal.rank
            WITH coalesce(a.achievedOn, date(a.recordedAt)) AS on ORDER BY on
            RETURN toString(on)
        }}) AS reached_on
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, goal.rank AS rank, toString(g.by) AS by,
               toString(g.setAt) AS set_at, at.rank AS current, reached_on, goal.description AS description,
               {skills} AS skills, {topics} AS topics, {traits} AS traits, {abilities} AS abilities
        ORDER BY reached_on IS NOT NULL, g.by IS NULL, g.by, s.name
    ", current = current("p", "at", "s"))).param("personId", user.person_id)).await.map_err(internal)?;
    let mut goals = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        goals.push(row.to::<Goal>().map_err(internal)?);
    }
    Ok(Json(goals))
}

#[derive(Deserialize)]
struct GoalRequest {
    rank: i64,
    by: Option<String>, //YYYY-MM-DD
}

//sets the level of a ready skill the logged in user wants to reach, above the one they're at, in place of any goal they
//had for it. Keeps when they first set it if the level is the same
async fn set_goal(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<GoalRequest>) -> Result<StatusCode, (StatusCode, String)> {
    let bad_request = |message: &str| (StatusCode::BAD_REQUEST, message.to_string());
    if !(1..=5).contains(&req.rank) {
        return Err(bad_request("Pick one of the five levels."));
    }
    let by = match req.by.as_deref() {
        Some(date) => {
            let date = NaiveDate::parse_from_str(date, "%Y-%m-%d").map_err(|_| bad_request("That date doesn't look right."))?;
            if date < Utc::now().date_naive() {
                return Err(bad_request("That date has already passed."));
            }
            Some(date.to_string())
        }
        None => None,
    };

    let mut rows = state.graph.execute(query(&format!("
        MATCH (s:Skill {{id: $id}}), (p:Person {{id: $personId}})
        OPTIONAL MATCH (p)-[:ACHIEVED]->(at:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WHERE {}
        RETURN s.status AS status, at.rank AS current
    ", current("p", "at", "s"))).param("id", id.as_str()).param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let status: String = row.get("status").map_err(internal)?;
    let current: Option<i64> = row.get("current").map_err(internal)?;
    drop(rows);
    if status != "ready" {
        return Err(bad_request("That skill's levels aren't written yet."));
    }
    if current.is_some_and(|rank| rank >= req.rank) {
        return Err(bad_request("You're already at that level."));
    }

    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})-[:HAS_LEVEL]->(goal:DreyfusLevel {rank: $rank})
        OPTIONAL MATCH (p)-[old:WANTS_TO_REACH]->(ol:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WHERE ol.rank <> goal.rank
        DELETE old
        WITH DISTINCT p, goal
        MERGE (p)-[g:WANTS_TO_REACH]->(goal)
        ON CREATE SET g.setAt = datetime()
        SET g.by = CASE WHEN $by IS NULL THEN null ELSE date($by) END
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("rank", req.rank)
        .param("by", by)
    ).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

//clears the logged in user's goal for a skill
async fn clear_goal(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (:Person {id: $personId})-[g:WANTS_TO_REACH]->(:DreyfusLevel)<-[:HAS_LEVEL]-(:Skill {id: $id})
        DELETE g
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
