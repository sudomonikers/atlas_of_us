//placing yourself on a skill: the Dreyfus levels you've reached in it (an ACHIEVED to each, the highest being your level
//now), when you got there, and the evidence you give for it once you're on it. See "Placing yourself on a skill" in documentation/architecture/skills.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
};
use chrono::{NaiveDate, Utc};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    evidence::{self, About, Evidence},
    state::AppState,
};

use super::{SkillRef, current, internal, not_found};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/achievements", get(list_achievements))
        .route("/next-steps", get(next_steps))
        .route("/suggestions", get(suggestions))
        .route("/{id}/does-not-have", put(does_not_have))
        .route("/{id}/achievement", get(get_achievement).put(set_level).delete(remove_achievement))
        .route("/{id}/evidence", post(add_note))
        .route("/{id}/evidence/uploads", post(start_upload))
        .route("/{id}/evidence/files", post(add_file))
}

fn about(id: &str) -> About<'_> {
    About { label: "Skill", id }
}

//where the logged in user is with a skill: the rank of the level they've reached, if they've placed themselves on it,
//when they reached it if they said, the level they want to reach, if they've set a goal, and how many hours a week they
//practice it, if they've said
#[derive(Serialize, Deserialize)]
pub struct Achievement {
    rank: Option<i64>,
    achieved_on: Option<String>, //YYYY-MM-DD
    evidence: Vec<Evidence>, //oldest first
    goal: Option<GoalLevel>,
    hours_per_week: Option<f64>,
}

//the level of a skill someone wants to reach, and when by if they said
#[derive(Serialize, Deserialize)]
pub struct GoalLevel {
    rank: i64,
    by: Option<String>, //YYYY-MM-DD
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
        WHERE {}
        OPTIONAL MATCH (p)-[g:WANTS_TO_REACH]->(gl:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        OPTIONAL MATCH (p)-[pr:PRACTICES]->(s)
        RETURN l.rank AS rank, toString(r.achievedOn) AS achieved_on, {} AS evidence,
               CASE WHEN g IS NULL THEN null ELSE {{rank: gl.rank, by: toString(g.by)}} END AS goal,
               pr.hoursPerWeek AS hours_per_week
    ", current("p", "l", "s"), evidence::collect("p", "s"))).param("id", id).param("personId", user.person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Achievement>().map_err(internal)?))
}

#[derive(Deserialize)]
struct LevelRequest {
    rank: i64,
    achieved_on: Option<String>, //YYYY-MM-DD
}

//places the logged in user at one of a ready skill's levels, with when they reached it if they say
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

    //the level joins the ones they've reached, with the version of it they read. A move down corrects their level, so the
    //levels above it come off. Saying they have the skill takes back any time they said they didn't
    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})-[:HAS_LEVEL]->(l:DreyfusLevel {rank: $rank})
        OPTIONAL MATCH (p)-[lacks:DOES_NOT_HAVE]->(s)
        DELETE lacks
        WITH p, s, l
        OPTIONAL MATCH (p)-[above:ACHIEVED]->(al:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WHERE al.rank > l.rank
        DELETE above
        WITH DISTINCT p, l
        MERGE (p)-[a:ACHIEVED]->(l)
        ON CREATE SET a.recordedAt = datetime()
        SET a.levelVersion = l.version, a.achievedOn = CASE WHEN $achievedOn IS NULL THEN null ELSE date($achievedOn) END
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("rank", req.rank)
        .param("achievedOn", achieved_on)
    ).await.map_err(internal)?;
    tracing::info!(skill_id = id, rank = req.rank, "placed a person on a skill");
    Ok(StatusCode::NO_CONTENT)
}

//takes the logged in user off a skill, with every level they reached in it, how much they practice it, and all their
//evidence for it
async fn remove_achievement(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})
        OPTIONAL MATCH (p)-[r:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        DELETE r
        WITH DISTINCT p, s
        OPTIONAL MATCH (p)-[pr:PRACTICES]->(s)
        DELETE pr
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
        WHERE {}
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, l.rank AS rank, toString(r.achievedOn) AS achieved_on,
               toString(r.recordedAt) AS updated_at, {} AS evidence
        ORDER BY rank DESC, s.name
    ", current("p", "l", "s"), evidence::collect("p", "s"))).param("personId", person_id)).await.map_err(internal)?;
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

//a level of another skill the next level needs, and the rank the logged in user has reached in it, if any
#[derive(Serialize, Deserialize)]
pub(super) struct SkillStep {
    id: String,
    name: String,
    status: String,
    rank: i64, //the level of it that's needed
    strength: f64, //how essential it is, 0 to 1
    reason: String,
    yours: Option<i64>,
}

//a level of a topic the next level needs knowledge of, and the Bloom rank the logged in user has reached in it, if any
#[derive(Serialize, Deserialize)]
pub(super) struct TopicStep {
    id: String,
    name: String,
    status: String,
    rank: i64, //the Bloom level of it that's needed, 1 (Remember) to 6 (Create)
    strength: f64, //how essential it is, 0 to 1
    reason: String,
    yours: Option<i64>,
}

//a personality trait the next level takes, and the logged in user's score on it, if they've been measured
#[derive(Serialize, Deserialize)]
pub(super) struct TraitStep {
    name: String,
    level: f64, //where on the trait it pulls, above 0.5 for more of it
    strength: f64, //how much it matters, 0 to 1
    reason: String,
    yours: Option<f64>,
}

//what it takes to reach the next level of a skill the logged in user is on, and where they are with each requirement
#[derive(Serialize, Deserialize)]
pub struct NextStep {
    skill_id: String,
    rank: i64, //the next level
    next_level: Option<String>, //what it takes to get there, from the level they're at
    skills: Vec<SkillStep>,
    topics: Vec<TopicStep>,
    traits: Vec<TraitStep>,
}

//the requirements of the level `level` of the skill `s` of one kind, as a COLLECT expression. Each comes from the
//highest level at or below it that names its target `t`, since a requirement carries up until a higher level changes
//it, strongest first. `rank` is the rank of the target's level that's needed, and `step` returns one, from `top` and the
//person `p`
fn carried_up(level: &str, requirement: &str, target: &str, rank: &str, step: &str) -> String {
    format!("COLLECT {{
        MATCH (s)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:{requirement}]->{target}
        WHERE l.rank <= {level}.rank
        WITH p, t, r, {rank} AS rank ORDER BY l.rank DESC
        WITH p, t, head(collect({{r: r, rank: rank}})) AS top
        {step}
        ORDER BY top.r.strength DESC
    }}")
}

//what the level `level` of the skill `s` takes, as COLLECT expressions for its skills, topics and traits, each with
//where the person `p` is with it
pub(super) fn requirements(level: &str) -> [String; 3] {
    [
        carried_up(
            level,
            "REQUIRES_SKILL",
            "(tl:DreyfusLevel)<-[:HAS_LEVEL]-(t:Skill)",
            "tl.rank",
            "OPTIONAL MATCH (p)-[:ACHIEVED]->(yl:DreyfusLevel)<-[:HAS_LEVEL]-(t)
            WITH t, top, max(yl.rank) AS yours
            RETURN {id: t.id, name: t.name, status: t.status, rank: top.rank, strength: top.r.strength, reason: top.r.reason, yours: yours}",
        ),
        carried_up(
            level,
            "REQUIRES_KNOWLEDGE",
            "(tl:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)",
            "tl.rank",
            "OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(yl:BloomLevel)<-[:HAS_LEVEL]-(t)
            RETURN {id: t.id, name: t.name, status: t.status, rank: top.rank, strength: top.r.strength, reason: top.r.reason, yours: yl.rank}",
        ),
        carried_up(
            level,
            "REQUIRES_TRAIT",
            "(t:PersonalityTrait)",
            "null",
            "OPTIONAL MATCH (p)-[y:HAS_PERSONALITY_TRAIT]->(t)
            RETURN {name: t.name, level: top.r.level, strength: top.r.strength, reason: top.r.reason, yours: y.value}",
        ),
    ]
}

//the next level of every ready skill the logged in user is on below Expert, for My Skills
async fn next_steps(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<NextStep>>, (StatusCode, String)> {
    let [skills, topics, traits] = requirements("next");
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})-[:ACHIEVED]->(at:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill {{status: 'ready'}})
        WHERE at.rank < 5 AND {current}
        MATCH (s)-[:HAS_LEVEL]->(next:DreyfusLevel {{rank: at.rank + 1}})
        OPTIONAL MATCH (at)-[n:NEXT_LEVEL]->(next)
        RETURN s.id AS skill_id, next.rank AS rank, n.description AS next_level,
               {skills} AS skills, {topics} AS topics, {traits} AS traits
    ", current = current("p", "at", "s"))).param("personId", user.person_id)).await.map_err(internal)?;
    let mut steps = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        steps.push(row.to::<NextStep>().map_err(internal)?);
    }
    Ok(Json(steps))
}

//a skill the logged in user has said they don't have, so it isn't suggested to them again. Placing themselves on it
//takes this back
async fn does_not_have(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId}), (s:Skill {id: $id})
        MERGE (p)-[d:DOES_NOT_HAVE]->(s)
        SET d.date = datetime()
        RETURN s.id AS id
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(StatusCode::NO_CONTENT)
}

//a skill of the logged in user's that a suggestion comes from
#[derive(Serialize, Deserialize)]
pub struct SuggestedBy {
    id: String,
    name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rank: Option<i64>, //the level they're at in it, when one of its levels needs the suggested skill
}

//a skill the logged in user probably has but hasn't placed themselves on: one their skills' levels need, or one their
//skills are a kind of
#[derive(Serialize, Deserialize)]
pub struct Suggestion {
    skill: SkillRef,
    rank: Option<i64>, //the highest level of it their skills need. None when it's only a broader skill
    needed_by: Vec<SuggestedBy>, //their skills whose levels need it, with the level they're at
    kind_of: Vec<SuggestedBy>, //their skills that are a kind of it
}

//how many suggestions come at once
const SUGGESTIONS: i64 = 20;

//the skills the logged in user probably has, most essential first. A level they're at needs every requirement written
//on it and the levels below it, each at the level of it written on the highest of those. Skills they've placed
//themselves on, or said they don't have, aren't suggested
async fn suggestions(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Suggestion>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})
        CALL (p) {{
            MATCH (p)-[:ACHIEVED]->(at:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:HAS_LEVEL]->(l:DreyfusLevel)
                  -[r:REQUIRES_SKILL]->(tl:DreyfusLevel)<-[:HAS_LEVEL]-(t:Skill)
            WHERE l.rank <= at.rank AND {current}
            WITH s, at, t, tl, r ORDER BY l.rank DESC
            WITH s, at, t, head(collect({{rank: tl.rank, strength: r.strength}})) AS top
            RETURN t, top.rank AS rank, top.strength AS strength, {{id: s.id, name: s.name, rank: at.rank}} AS need, null AS kind
            UNION
            MATCH (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:SPECIALIZATION_OF]->(t:Skill)
            RETURN t, null AS rank, null AS strength, null AS need, {{id: s.id, name: s.name}} AS kind
        }}
        WITH p, t, rank, strength, need, kind
        WHERE NOT EXISTS {{ (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(t) }} AND NOT EXISTS {{ (p)-[:DOES_NOT_HAVE]->(t) }}
        WITH t, max(rank) AS rank, max(strength) AS strength, collect(need) AS needed_by, collect(kind) AS kind_of
        RETURN {{id: t.id, name: t.name, status: t.status}} AS skill, rank, needed_by, kind_of
        ORDER BY coalesce(strength, -1.0) DESC, size(needed_by) + size(kind_of) DESC, t.name
        LIMIT $limit
    ", current = current("p", "at", "s"))).param("personId", user.person_id).param("limit", SUGGESTIONS)).await.map_err(internal)?;
    let mut suggestions = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        suggestions.push(row.to::<Suggestion>().map_err(internal)?);
    }
    Ok(Json(suggestions))
}
