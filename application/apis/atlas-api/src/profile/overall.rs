//the overall summary: Atlas's write-up of the whole person, at the top of the Overall view of their profile. Asking for
//it gathers everything they've been mapped on here (their personality traits, abilities, conditions and impairments,
//topics and skills, and how their skills link to the rest) and hands that to atlas-jobs' overall_summary job, which
//writes it and keeps it with what it was written from. Each write costs a credit (see credits/), given back if it
//fails. Whatever has changed since then makes it stale, so the person can ask for it again
use std::collections::HashMap;

use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, credits::{refund, spend}, domains::{abilities, personality}, helpers::jobs::queue, state::AppState};

use super::{graph::person_graph, internal};

pub fn router() -> Router<AppState> {
    Router::new().route("/summary", get(get_summary).post(ask))
}

//how many of the four parts (personality, abilities, topics and skills) need something in them before there's enough
//to write about
const ENOUGH: usize = 2;
//how long a summary asked for is taken to be on its way. A job that hasn't written it by then has failed
const WRITING_MINUTES: i64 = 5;
//the summary's properties on the Person, which credits are spent and given back by
const FEATURE: &str = "overallSummary";

const BLOOM: [&str; 6] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const DREYFUS: [&str; 5] = ["Novice", "Advanced Beginner", "Competent", "Proficient", "Expert"];

//what the summary is written from, in the order it's gathered, so the same things always come out the same
#[derive(Serialize)]
struct Input {
    age: Option<i64>,
    personality: Vec<Trait>,
    abilities: Vec<Placed>,
    conditions_and_impairments: Vec<abilities::ConditionOrImpairment>,
    topics: Vec<Leveled>,
    skills: Vec<Leveled>,
    skills_take: Vec<Takes>,
}

//where they stand on a personality trait, 0 to 100
#[derive(Serialize)]
struct Trait {
    name: String,
    domain: String,
    standing: i64,
    early: bool, //shown by fewer than 3 answers
}

//where they stand on an ability, 0 to 100 with 50 typical
#[derive(Serialize)]
struct Placed {
    name: String,
    area: String,
    standing: i64,
    early: bool, //confidence under 0.5
}

//a topic or skill they've placed themselves on, at the level they're at
#[derive(Serialize)]
struct Leveled {
    name: String,
    level: String,
}

//one of their skills, and the traits, abilities, topics and other skills of theirs it takes
#[derive(Serialize)]
struct Takes {
    skill: String,
    traits: Vec<String>,
    abilities: Vec<String>,
    topics: Vec<String>,
    skills: Vec<String>,
}

#[derive(Deserialize)]
struct Ranked {
    name: String,
    rank: i64,
}

//the names of what a query returns, with their rank, as levels
async fn leveled(graph: &Graph, person_id: &str, cypher: &str, names: &[&str]) -> Result<Vec<Leveled>, (StatusCode, String)> {
    let mut rows = graph.execute(query(cypher).param("personId", person_id)).await.map_err(internal)?;
    let mut items = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        let r = row.to::<Ranked>().map_err(internal)?;
        let level = names.get((r.rank - 1).max(0) as usize).unwrap_or(&"").to_string();
        items.push(Leveled { name: r.name, level });
    }
    Ok(items)
}

//gathers what the summary is written from, and how many of the four parts have something in them
async fn gather(graph: &Graph, person_id: &str) -> Result<(Input, usize), (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN CASE WHEN p.birthday IS NULL THEN null ELSE duration.between(date(p.birthday), date()).years END AS age
    ").param("personId", person_id)).await.map_err(internal)?;
    let age: Option<i64> = rows.next().await.map_err(internal)?.map(|r| r.get("age")).transpose().map_err(internal)?.flatten();
    drop(rows);

    let personality: Vec<Trait> = personality::person_personality(graph, person_id).await?.measured()
        .map(|(name, domain, value, answers)| Trait { name: name.into(), domain: domain.into(), standing: (value * 100.0).round() as i64, early: answers < 3 })
        .collect();
    let abilities: Vec<Placed> = abilities::person_abilities(graph, person_id).await?.into_iter()
        .map(|a| Placed { standing: (a.value * 100.0).round() as i64, early: a.confidence < 0.5, name: a.name, area: a.category })
        .collect();
    let conditions_and_impairments = abilities::person_conditions_and_impairments(graph, person_id).await?;
    let topics = leveled(graph, person_id, "
        MATCH (:Person {id: $personId})-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        RETURN t.name AS name, max(l.rank) AS rank ORDER BY rank DESC, name
    ", &BLOOM).await?;
    let skills = leveled(graph, person_id, "
        MATCH (:Person {id: $personId})-[:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        RETURN s.name AS name, max(l.rank) AS rank ORDER BY rank DESC, name
    ", &DREYFUS).await?;

    //how their skills link to the rest of them, from the graph of everything they're linked to
    let linked = person_graph(graph, person_id).await?;
    let names: HashMap<&str, &str> = linked.nodes.iter().map(|n| (n.id.as_str(), n.label.as_str())).collect();
    let mut skills_take: Vec<Takes> = linked.nodes.iter().filter(|n| n.kind == "skill").map(|s| {
        let of = |kind: &str| {
            let mut found: Vec<String> = linked.links.iter().filter(|l| l.from == s.id && l.kind == kind)
                .filter_map(|l| names.get(l.to.as_str()).map(|n| n.to_string())).collect();
            found.sort();
            found
        };
        Takes { skill: s.label.clone(), traits: of("takes_trait"), abilities: of("takes_ability"), topics: of("takes_topic"), skills: of("takes_skill") }
    }).filter(|t| !(t.traits.is_empty() && t.abilities.is_empty() && t.topics.is_empty() && t.skills.is_empty())).collect();
    skills_take.sort_by(|a, b| a.skill.cmp(&b.skill));

    let parts = [!personality.is_empty(), !abilities.is_empty(), !topics.is_empty(), !skills.is_empty()].iter().filter(|&&p| p).count();
    Ok((Input { age, personality, abilities, conditions_and_impairments, topics, skills, skills_take }, parts))
}

//the summary as it's kept on the person
#[derive(Deserialize)]
struct Kept {
    summary: Option<String>,
    written_at: Option<String>,
    input: Option<String>,
    writing: bool,
    asked: bool, //whether it was asked for since it was last written
    charged: bool, //whether a credit was spent on the last ask, and not given back yet
}

//the summary as it's kept on the person. A credit spent on one that couldn't be written goes back here, which covers a
//job that never ran as well as one that failed
async fn kept(graph: &Graph, person_id: &str) -> Result<Kept, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        WITH p, p.overallSummaryAskedAt AS asked,
             coalesce(p.overallSummaryAt, datetime({year: 1})) AS written,
             coalesce(p.overallSummaryFailedAt, datetime({year: 1})) AS failed
        RETURN p.overallSummary AS summary, toString(p.overallSummaryAt) AS written_at, p.overallSummaryInput AS input,
               coalesce(asked > written AND asked > failed AND asked > datetime() - duration({minutes: $minutes}), false) AS writing,
               coalesce(asked > written, false) AS asked,
               coalesce(p.overallSummaryCharged, false) AS charged
    ").param("personId", person_id).param("minutes", WRITING_MINUTES)).await.map_err(internal)?;
    let mut kept = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?
        .to::<Kept>().map_err(internal)?;
    if kept.charged && kept.asked && !kept.writing {
        refund(graph, person_id, FEATURE).await.map_err(internal)?;
        kept.charged = false;
    }
    Ok(kept)
}

//the summary, and where it's at
#[derive(Serialize)]
pub struct Summary {
    summary: Option<serde_json::Value>, //headline, overview, parts, strengths, work_on and try_next
    written_at: Option<String>,
    stale: bool, //whether anything it was written from has changed since
    writing: bool, //whether it's being written now
    failed: bool, //whether the last one asked for couldn't be written
    enough: bool, //whether there's enough to write about
}

fn summary(kept: Kept, input: &str, parts: usize) -> Result<Summary, (StatusCode, String)> {
    Ok(Summary {
        summary: kept.summary.as_deref().map(serde_json::from_str).transpose().map_err(internal)?,
        stale: kept.input.as_deref().is_some_and(|i| i != input),
        failed: kept.asked && !kept.writing,
        writing: kept.writing,
        written_at: kept.written_at,
        enough: parts >= ENOUGH,
    })
}

//the logged in user's overall summary, and where it's at
async fn get_summary(State(state): State<AppState>, user: AuthUser) -> Result<Json<Summary>, (StatusCode, String)> {
    let (input, parts) = gather(&state.graph, &user.person_id).await?;
    let input = serde_json::to_string(&input).map_err(internal)?;
    Ok(Json(summary(kept(&state.graph, &user.person_id).await?, &input, parts)?))
}

//what atlas-jobs' overall_summary job is sent
#[derive(Serialize)]
struct SummaryJob<'a> {
    person_id: &'a str,
    input: &'a str, //kept with the summary as it's sent, so it can tell when the summary is stale
}

//asks for the logged in user's overall summary to be written, for a credit, unless it's being written already or
//nothing has changed since it was
async fn ask(State(state): State<AppState>, user: AuthUser) -> Result<Json<Summary>, (StatusCode, String)> {
    let (input, parts) = gather(&state.graph, &user.person_id).await?;
    if parts < ENOUGH {
        return Err((StatusCode::BAD_REQUEST, "Map yourself on a little more first, and I'll write up the whole picture.".to_string()));
    }
    let input = serde_json::to_string(&input).map_err(internal)?;
    let current = kept(&state.graph, &user.person_id).await?;
    if current.writing || current.input.as_deref() == Some(input.as_str()) {
        return Ok(Json(summary(current, &input, parts)?));
    }

    spend(&state, &user.person_id, FEATURE).await?;
    if let Err(e) = queue(&state, "overall_summary", SummaryJob { person_id: &user.person_id, input: &input }).await {
        tracing::error!("couldn't queue the overall summary: {e}");
        state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.overallSummaryFailedAt = datetime()").param("personId", user.person_id.as_str()))
            .await.map_err(internal)?;
        refund(&state.graph, &user.person_id, FEATURE).await.map_err(internal)?;
    }
    Ok(Json(summary(kept(&state.graph, &user.person_id).await?, &input, parts)?))
}

//a person's overall summary, for their profile. Says nothing about who may see it: the caller checks that
pub async fn person_summary(graph: &Graph, person_id: &str) -> Result<Option<serde_json::Value>, (StatusCode, String)> {
    let mut rows = graph.execute(query("MATCH (p:Person {id: $personId}) RETURN p.overallSummary AS summary").param("personId", person_id))
        .await.map_err(internal)?;
    let summary: Option<String> = rows.next().await.map_err(internal)?.map(|r| r.get("summary")).transpose().map_err(internal)?.flatten();
    summary.as_deref().map(serde_json::from_str).transpose().map_err(internal)
}
