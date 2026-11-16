//the written summary of everything a person has added to Physical Traits, at the top of Your results and on their
//profile. Asking for it gathers what it's written from here (their characteristics, latest readings with where each
//sits, abilities, conditions and impairments) and hands that to atlas-jobs' physical_summary job, which has Sonnet write
//it and keeps it with what it was written from. Whatever has changed since then makes it stale, so the person can ask
//for it again. See "Summary" in documentation/architecture/physical.md
use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use chrono::Utc;
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, helpers::jobs::queue, state::AppState};

use super::{abilities, age_on, bad, date, internal, reading, rows};

pub fn router() -> Router<AppState> {
    Router::new().route("/summary", get(get_summary).post(ask))
}

//how many abilities need a place before there's enough to write about
const ENOUGH: usize = 6;
//how long a summary asked for is taken to be on its way. A job that hasn't written it by then has failed
const WRITING_MINUTES: i64 = 5;

//what the summary is written from, in the order it's gathered, so the same things always come out the same
#[derive(Serialize)]
struct Input {
    age: Option<i64>,
    characteristics: Vec<Said>,
    measurements: Vec<Measured>,
    abilities: Vec<Placed>,
    waiting: Vec<String>, //abilities they've taken a test of that can't place them yet, with too few people to compare with
    conditions: Vec<LivesWith>,
    impairments: Vec<LivesWith>,
}

//a characteristic they've answered
#[derive(Serialize, Deserialize)]
struct Said {
    name: String,
    value: String,
}

//the latest reading of a measurement, with where it sits among people of their sex and age
#[derive(Serialize)]
struct Measured {
    name: String,
    group: String,
    value: f64,
    unit: String,
    better: String, //higher, lower or neither
    percentile: Option<i64>, //the share of people, 0 to 100, with a lower value
    beats: Option<i64>, //the share of people it's better than, when one way is better
    compared_with: Option<String>,
}

//where they stand on an ability, 0 to 100 with 50 typical
#[derive(Serialize)]
struct Placed {
    name: String,
    area: String, //Physical, Psychomotor, Sensory or Cognitive
    standing: i64,
    confidence: f64,
    from: &'static str, //tested, or self-rated
    practice: Option<String>, //how much practice changes it
}

//a condition or impairment, and the abilities it can affect
#[derive(Serialize, Deserialize)]
struct LivesWith {
    name: String,
    how: Option<String>, //a condition's severity, or an impairment's extent
    diagnosed: Option<bool>,
    managed: Option<bool>,
    change: Option<String>, //how a body part has changed
    affects: Vec<String>,
}

//gathers what the summary is written from, and how many abilities have a place
async fn gather(state: &AppState, person_id: &str) -> Result<(Input, usize), (StatusCode, String)> {
    let all = abilities::refresh(state, person_id).await?;
    let unplaced: Vec<(String, Vec<String>)> = all.iter().filter(|a| a.value.is_none())
        .map(|a| (a.name.clone(), a.measurements.iter().map(|m| m.id.clone()).collect())).collect();
    let abilities: Vec<Placed> = all.into_iter().filter_map(|a| Some(Placed {
        standing: (a.value? * 100.0).round() as i64,
        confidence: (a.confidence? * 10.0).round() / 10.0,
        from: if a.basis.iter().any(|b| b.kind == "measurement") { "tested" } else { "self-rated" },
        name: a.name,
        area: a.category,
        practice: a.practice,
    })).collect();
    let placed = abilities.len();

    let mut age = None;
    let mut read = Vec::new(); //the measurements they have a reading of
    let measurements = rows(state, person_id, None).await?.into_iter().filter_map(|row| {
        let birthday = row.birthday.as_deref().and_then(date);
        age = birthday.map(|b| age_on(b, Utc::now().date_naive()));
        let raw = row.readings.into_iter().next()?;
        read.push(row.id.clone());
        let latest = reading(raw, &row.norms, row.sex.as_deref(), birthday);
        let percentile = latest.percentile.map(|p| p.round() as i64);
        Some(Measured {
            beats: percentile.and_then(|p| match row.better.as_str() { "higher" => Some(p), "lower" => Some(100 - p), _ => None }),
            percentile,
            compared_with: latest.compared_with.map(|c| {
                let who = match c.sex.as_str() { "male" => "men", "female" => "women", _ => "people" };
                match c.age_to {
                    Some(to) => format!("{who} aged {} to {to}", c.age_from),
                    None => format!("{who} aged {} and over", c.age_from),
                }
            }),
            value: latest.value,
            name: row.name,
            group: row.group,
            unit: row.unit,
            better: row.better,
        })
    }).collect();
    let waiting = unplaced.into_iter().filter(|(_, shown_by)| shown_by.iter().any(|m| read.contains(m))).map(|(name, _)| name).collect();

    let graph = &state.graph;
    let characteristics = list(graph, person_id, "
        MATCH (p:Person {id: $personId})-[h:HAS_CHARACTERISTIC]->(c:Characteristic)
        RETURN {name: c.name, value: h.value} AS item ORDER BY c.order
    ").await?;
    let conditions = list(graph, person_id, &format!("
        MATCH (p:Person {{id: $personId}})-[h:HAS_CONDITION]->(c:Condition)
        WITH h, c, coalesce(c.plainName, c.name) AS name
        RETURN {{
            name: name, how: h.severity, diagnosed: h.diagnosed, managed: h.managed, change: null,
            affects: COLLECT {{ MATCH (c)-[:AFFECTS]->(t) MATCH (a:Ability) WHERE {rests_on} RETURN DISTINCT a.name AS n ORDER BY n }}
        }} AS item ORDER BY toLower(name)
    ", rests_on = abilities::RESTS_ON)).await?;
    let impairments = list(graph, person_id, &format!("
        MATCH (p:Person {{id: $personId}})-[i:HAS_IMPAIRMENT]->(t)
        RETURN {{
            name: t.name, how: i.extent, diagnosed: null, managed: null, change: i.change,
            affects: COLLECT {{ MATCH (a:Ability) WHERE {rests_on} RETURN a.name AS n ORDER BY n }}
        }} AS item ORDER BY t.name
    ", rests_on = abilities::RESTS_ON)).await?;

    Ok((Input { age, characteristics, measurements, abilities, waiting, conditions, impairments }, placed))
}

//the items a query returns, one a row
async fn list<T: for<'de> Deserialize<'de>>(graph: &Graph, person_id: &str, cypher: &str) -> Result<Vec<T>, (StatusCode, String)> {
    let mut rows = graph.execute(query(cypher).param("personId", person_id)).await.map_err(internal)?;
    let mut items = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        items.push(row.get::<T>("item").map_err(internal)?);
    }
    Ok(items)
}

//the summary as it's kept on the person
#[derive(Deserialize)]
struct Kept {
    summary: Option<String>,
    written_at: Option<String>,
    input: Option<String>,
    writing: bool,
    asked: bool, //whether it was asked for since it was last written
}

async fn kept(graph: &Graph, person_id: &str) -> Result<Kept, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        WITH p, p.physicalSummaryAskedAt AS asked,
             coalesce(p.physicalSummaryAt, datetime({year: 1})) AS written,
             coalesce(p.physicalSummaryFailedAt, datetime({year: 1})) AS failed
        RETURN p.physicalSummary AS summary, toString(p.physicalSummaryAt) AS written_at, p.physicalSummaryInput AS input,
               coalesce(asked > written AND asked > failed AND asked > datetime() - duration({minutes: $minutes}), false) AS writing,
               coalesce(asked > written, false) AS asked
    ").param("personId", person_id).param("minutes", WRITING_MINUTES)).await.map_err(internal)?;
    rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?
        .to::<Kept>().map_err(internal)
}

//the summary, and where it's at
#[derive(Serialize)]
pub struct Summary {
    summary: Option<serde_json::Value>, //headline, overview, areas, strengths, work_on and working_around
    written_at: Option<String>,
    stale: bool, //whether anything it was written from has changed since
    writing: bool, //whether it's being written now
    failed: bool, //whether the last one asked for couldn't be written
    enough: bool, //whether there's enough to write about
}

fn summary(kept: Kept, input: &str, placed: usize) -> Result<Summary, (StatusCode, String)> {
    Ok(Summary {
        summary: kept.summary.as_deref().map(serde_json::from_str).transpose().map_err(internal)?,
        stale: kept.input.as_deref().is_some_and(|i| i != input),
        failed: kept.asked && !kept.writing,
        writing: kept.writing,
        written_at: kept.written_at,
        enough: placed >= ENOUGH,
    })
}

//the logged in user's summary, and where it's at
async fn get_summary(State(state): State<AppState>, user: AuthUser) -> Result<Json<Summary>, (StatusCode, String)> {
    let (input, placed) = gather(&state, &user.person_id).await?;
    let input = serde_json::to_string(&input).map_err(internal)?;
    Ok(Json(summary(kept(&state.graph, &user.person_id).await?, &input, placed)?))
}

//what atlas-jobs' physical_summary job is sent
#[derive(Serialize)]
struct SummaryJob<'a> {
    person_id: &'a str,
    input: &'a str, //kept with the summary as it's sent, so it can tell when the summary is stale
}

//asks for the logged in user's summary to be written, unless it's being written already or nothing has changed since it
//was
async fn ask(State(state): State<AppState>, user: AuthUser) -> Result<Json<Summary>, (StatusCode, String)> {
    let (input, placed) = gather(&state, &user.person_id).await?;
    if placed < ENOUGH {
        return Err(bad("Add a few more results first, and I'll write it up."));
    }
    let input = serde_json::to_string(&input).map_err(internal)?;
    let current = kept(&state.graph, &user.person_id).await?;
    if current.writing || current.input.as_deref() == Some(input.as_str()) {
        return Ok(Json(summary(current, &input, placed)?));
    }

    state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.physicalSummaryAskedAt = datetime()").param("personId", user.person_id.as_str()))
        .await.map_err(internal)?;
    if let Err(e) = queue(&state, "physical_summary", SummaryJob { person_id: &user.person_id, input: &input }).await {
        tracing::error!("couldn't queue the physical summary: {e}");
        state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.physicalSummaryFailedAt = datetime()").param("personId", user.person_id.as_str()))
            .await.map_err(internal)?;
    }
    Ok(Json(summary(kept(&state.graph, &user.person_id).await?, &input, placed)?))
}

//a person's summary, for their profile. Says nothing about who may see it: the caller checks that
pub async fn person_summary(graph: &Graph, person_id: &str) -> Result<Option<serde_json::Value>, (StatusCode, String)> {
    let mut rows = graph.execute(query("MATCH (p:Person {id: $personId}) RETURN p.physicalSummary AS summary").param("personId", person_id))
        .await.map_err(internal)?;
    let summary: Option<String> = rows.next().await.map_err(internal)?.map(|r| r.get("summary")).transpose().map_err(internal)?.flatten();
    summary.as_deref().map(serde_json::from_str).transpose().map_err(internal)
}
