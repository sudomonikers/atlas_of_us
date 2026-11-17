//where a person stands on each ability (HAS_ABILITY), worked out from what they've recorded: the latest reading of each
//measurement that shows it. Their
//impairments in the body functions it rests on are noted beside it. It's worked out again whenever any of those change
//and whenever the person opens their abilities, so better norms reach everyone. See "Abilities" in
//documentation/architecture/physical.md
use std::collections::HashMap;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    routing::get,
};
use neo4rs::{BoltType, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{age_on, date, internal, norms::{self, Norm}, SEX};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/abilities", get(abilities))
        .route("/abilities/affected-by", get(affected_by))
}

//the most confidence readings add up to
const MAX_CONFIDENCE: f64 = 0.9;

#[derive(Deserialize)]
struct Latest {
    value: f64,
    measured_on: String,
}

//a measurement that shows an ability, with the person's latest reading of it
#[derive(Deserialize)]
struct MeasurementRow {
    id: String,
    name: String,
    test: Option<String>,
    better: String,
    confidence: f64,
    latest: Option<Latest>,
    norms: Vec<Norm>,
}

#[derive(Deserialize)]
struct Impaired {
    name: String,
    extent: String,
}

#[derive(Deserialize)]
struct Row {
    sex: Option<String>, //the sex they're compared with, male or female, or None for everyone
    birthday: Option<String>,
    id: String,
    name: String,
    category: String,
    group: String,
    description: String,
    practice: Option<String>,
    tips: Vec<Tip>,
    measurements: Vec<MeasurementRow>,
    impairments: Vec<Impaired>,
    parts: Vec<String>,
}

//what a person's place on an ability comes from: a measurement, with where their reading sits, 0 to 100 with higher
//better; or an impairment in what it rests on, with its extent, noted beside it
#[derive(Serialize)]
pub struct Basis {
    pub(super) kind: String, //measurement or impairment
    name: String,
    standing: Option<f64>,
    extent: Option<String>,
}

//a measurement that shows an ability, and whether the person has a reading of it that counts
#[derive(Serialize)]
pub struct Shows {
    pub(super) id: String,
    name: String,
    test: Option<String>, //home, or the test the app runs
    counted: bool,
}

//a tip on working on an ability: "practice" for what to do, or "impairment" for working around an impairment in what
//it rests on
#[derive(Deserialize, Serialize)]
pub struct Tip {
    kind: String,
    text: String,
}

//an ability, with where the logged in user stands on it, if anything says
#[derive(Serialize)]
pub struct Ability {
    id: String,
    pub(super) name: String,
    pub(super) category: String,
    group: String,
    description: String,
    pub(super) practice: Option<String>, //how much practice changes it: a lot, some or little
    tips: Vec<Tip>,
    pub(super) value: Option<f64>, //0 to 1, with 0.5 typical
    pub(super) confidence: Option<f64>,
    pub(super) basis: Vec<Basis>,
    pub(super) measurements: Vec<Shows>,
    parts: Vec<String>, //the ids of the body parts it rests on
}

const ABILITIES: &str = "
    MATCH (p:Person {id: $personId}), (a:Ability)
    RETURN {SEX} AS sex, toString(p.birthday) AS birthday,
           a.id AS id, a.name AS name, a.category AS category, a.group AS group, a.description AS description,
           a.practice AS practice,
           COLLECT { MATCH (a)-[:HAS_TIP]->(t:AbilityTip) RETURN {kind: t.kind, text: t.text} ORDER BY t.kind DESC } AS tips,
           COLLECT {
               MATCH (m:PhysicalMeasurement)-[:MEASURES]->(a)
               RETURN {
                   id: m.id, name: m.name, test: m.test, better: m.better, confidence: coalesce(m.confidence, 0.0),
                   latest: COLLECT {
                       MATCH (p)-[r:HAS_MEASUREMENT]->(m)
                       WITH r ORDER BY r.measuredOn DESC, r.recordedAt DESC
                       RETURN {value: r.value, measured_on: toString(r.measuredOn)}
                   }[0],
                   norms: COLLECT {
                       MATCH (m)-[:HAS_NORM]->(n:MeasurementNorm)
                       RETURN {sex: n.sex, age_from: n.ageFrom, age_to: n.ageTo, percentiles: n.percentiles, values: n.values}
                   }
               } ORDER BY m.name
           } AS measurements,
           COLLECT {
               MATCH (p)-[i:HAS_IMPAIRMENT]->(t)
               WHERE {RESTS_ON}
               RETURN {name: t.name, extent: i.extent}
           } AS impairments,
           COLLECT {
               MATCH (b:BodyPart)-[:SERVES]->(:BodyFunction)<-[:SUBFUNCTION_OF*0..4]-(:BodyFunction)-[:UNDERLIES]->(a)
               RETURN DISTINCT b.id
           } AS parts
    ORDER BY a.category, a.name
";

//whether the ability `a` rests on the body function or part `t`: the function or one it's part of underlies it, or the
//part, or a kind of part it is, serves one that does
pub(super) const RESTS_ON: &str = "(EXISTS { MATCH (t)<-[:SUBFUNCTION_OF*0..4]-(:BodyFunction)-[:UNDERLIES]->(a) }
                  OR EXISTS { MATCH (t)-[:PART_SUBTYPE_OF*0..2]->(:BodyPart)-[:SERVES]->(:BodyFunction)<-[:SUBFUNCTION_OF*0..4]-(:BodyFunction)-[:UNDERLIES]->(a) })";

//where a person stands on one ability: the readings that count, each weighted by how much it says, with their
//impairments in what it rests on noted
fn work_out(row: Row) -> Ability {
    let birthday = row.birthday.as_deref().and_then(date);
    let sex = row.sex.as_deref();
    let mut basis = Vec::new();
    let mut readings = Vec::new(); //(standing 0 to 1, confidence)
    let measurements = row.measurements.into_iter().map(|m| {
        let standing = m.latest.as_ref().and_then(|l| {
            let norm = norms::pick(&m.norms, sex, age_on(birthday?, date(&l.measured_on)?))?;
            let p = norms::percentile(norm, l.value);
            Some(if m.better == "lower" { 100.0 - p } else { p })
        });
        if let Some(s) = standing {
            readings.push((s / 100.0, m.confidence));
            basis.push(Basis { kind: "measurement".into(), name: m.name.clone(), standing: Some(s), extent: None });
        }
        Shows { id: m.id, name: m.name, test: m.test, counted: standing.is_some() }
    }).collect();

    let place = (!readings.is_empty()).then(|| {
        let weight: f64 = readings.iter().map(|(_, c)| c).sum();
        let value = readings.iter().map(|(v, c)| v * c).sum::<f64>() / weight.max(f64::EPSILON);
        let doubt: f64 = readings.iter().map(|(_, c)| 1.0 - c).product();
        (value, (1.0 - doubt).min(MAX_CONFIDENCE))
    });

    for impaired in &row.impairments {
        basis.push(Basis { kind: "impairment".into(), name: impaired.name.clone(), standing: None, extent: Some(impaired.extent.clone()) });
    }

    let round = |x: f64| (x * 100.0).round() / 100.0;
    Ability {
        value: place.map(|(v, _)| round(v.clamp(0.01, 0.99))),
        confidence: place.map(|(_, c)| round(c)),
        basis,
        measurements,
        parts: row.parts,
        id: row.id,
        name: row.name,
        category: row.category,
        group: row.group,
        description: row.description,
        practice: row.practice,
        tips: row.tips,
    }
}

//works out where a person stands on every ability, keeps it as HAS_ABILITY (dropping the ones nothing says anything
//about any more), and returns them all
pub async fn refresh(state: &AppState, person_id: &str) -> Result<Vec<Ability>, (StatusCode, String)> {
    let mut result = state.graph.execute(query(&ABILITIES.replace("{RESTS_ON}", RESTS_ON).replace("{SEX}", SEX)).param("personId", person_id)).await.map_err(internal)?;
    let mut abilities = Vec::new();
    while let Some(row) = result.next().await.map_err(internal)? {
        abilities.push(work_out(row.to::<Row>().map_err(internal)?));
    }
    drop(result); //the stream holds its pooled connection until it's dropped, and the next query needs one

    let placed: Vec<HashMap<&str, BoltType>> = abilities.iter().filter_map(|a| Some(HashMap::from([
        ("id", a.id.as_str().into()),
        ("value", a.value?.into()),
        ("confidence", a.confidence?.into()),
        ("basis", a.basis.iter().map(|b| b.name.as_str()).collect::<Vec<_>>().into()),
    ]))).collect();
    let ids: Vec<&str> = abilities.iter().filter(|a| a.value.is_some()).map(|a| a.id.as_str()).collect();
    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        CALL (p) {
            MATCH (p)-[old:HAS_ABILITY]->(a:Ability)
            WHERE NOT a.id IN $ids
            DELETE old
        }
        WITH p
        UNWIND $placed AS x
        MATCH (a:Ability {id: x.id})
        MERGE (p)-[h:HAS_ABILITY]->(a)
        SET h.value = x.value, h.confidence = x.confidence, h.basis = x.basis, h.updatedAt = datetime()
    ")
        .param("personId", person_id)
        .param("ids", ids)
        .param("placed", placed)
    ).await.map_err(internal)?;
    Ok(abilities)
}

//every ability, with where the logged in user stands on it and what that comes from
async fn abilities(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Ability>>, (StatusCode, String)> {
    Ok(Json(refresh(&state, &user.person_id).await?))
}

//one of the logged in user's conditions, as it can affect an ability
#[derive(Serialize, Deserialize)]
pub struct ConditionOn {
    id: String,
    name: String,
    severity: Option<String>,
}

//one of the logged in user's impairments, as it can affect an ability
#[derive(Serialize, Deserialize)]
pub struct ImpairmentOn {
    id: String, //the function or part it's in
    name: String,
    extent: String,
}

//an ability, with the logged in user's conditions and impairments in the body functions and parts it rests on
#[derive(Serialize, Deserialize)]
pub struct AffectedBy {
    id: String,
    name: String,
    conditions: Vec<ConditionOn>,
    impairments: Vec<ImpairmentOn>,
}

//the abilities the logged in user's conditions and impairments can affect, each with them, so a skill can show what can
//affect the abilities it takes. A condition can affect what rests on the functions and parts it affects
async fn affected_by(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<AffectedBy>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}}), (a:Ability)
        WITH a,
             COLLECT {{
                 MATCH (p)-[h:HAS_CONDITION]->(c:Condition)-[:AFFECTS]->(t)
                 WHERE {RESTS_ON}
                 RETURN DISTINCT {{id: c.id, name: c.name, severity: h.severity}} AS c ORDER BY toLower(c.name)
             }} AS conditions,
             COLLECT {{
                 MATCH (p)-[i:HAS_IMPAIRMENT]->(t)
                 WHERE {RESTS_ON}
                 RETURN {{id: t.id, name: t.name, extent: i.extent}} ORDER BY t.name
             }} AS impairments
        WHERE size(conditions) > 0 OR size(impairments) > 0
        RETURN a.id AS id, a.name AS name, conditions, impairments
        ORDER BY a.name
    ")).param("personId", user.person_id)).await.map_err(internal)?;
    let mut affected = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        affected.push(row.to::<AffectedBy>().map_err(internal)?);
    }
    Ok(Json(affected))
}
