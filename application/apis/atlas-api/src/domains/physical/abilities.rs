//where a person stands on each ability (HAS_ABILITY), worked out from what they've recorded: the latest reading of each
//measurement that shows it, their own rating of themselves on its examples when nothing measures it, and their
//impairments in the body functions it rests on, which hold it back. It's worked out again whenever any of those change
//and whenever the person opens their abilities, so better norms reach everyone. See "Abilities" in
//documentation/architecture/physical.md
use std::collections::HashMap;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use neo4rs::{BoltType, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{age_on, bad, date, internal, norms::{self, Norm}};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/abilities", get(abilities))
        .route("/abilities/{id}/rating", put(rate).delete(unrate))
}

//where a rating on an ability's examples puts someone, by the hardest example they can do: none of them, the first, the
//second or the third. O*NET's examples run from what nearly anyone can do to what few can, so these are rough
const RATED: [f64; 4] = [0.05, 0.25, 0.55, 0.85];
//how much a rating of yourself says
const RATED_CONFIDENCE: f64 = 0.25;
//the most an impairment of each extent leaves of an ability it rests on, and how much that says on its own
const CAPS: [(&str, f64); 4] = [("mild", 0.45), ("moderate", 0.25), ("severe", 0.1), ("complete", 0.02)];
const IMPAIRED_CONFIDENCE: f64 = 0.3;
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
    norm_sex: Option<String>,
    birthday: Option<String>,
    id: String,
    name: String,
    category: String,
    group: String,
    description: String,
    examples: Vec<String>,
    rating: Option<i64>,
    measurements: Vec<MeasurementRow>,
    impairments: Vec<Impaired>,
}

//what a person's place on an ability comes from: a measurement, with where their reading sits, 0 to 100 with higher
//better; their rating of themselves; or an impairment holding it back, with its extent
#[derive(Serialize)]
pub struct Basis {
    kind: String, //measurement, rating or impairment
    name: String,
    standing: Option<f64>,
    extent: Option<String>,
}

//a measurement that shows an ability, and whether the person has a reading of it that counts
#[derive(Serialize)]
pub struct Shows {
    id: String,
    name: String,
    test: Option<String>, //home, or the test the app runs
    counted: bool,
}

//an ability, with where the logged in user stands on it, if anything says
#[derive(Serialize)]
pub struct Ability {
    id: String,
    name: String,
    category: String,
    group: String,
    description: String,
    examples: Vec<String>, //from what takes a little of it to what takes a lot
    value: Option<f64>, //0 to 1, with 0.5 typical
    confidence: Option<f64>,
    basis: Vec<Basis>,
    rating: Option<i64>, //the hardest example they say they can do, 1 to 3, or 0 for none of them
    measurements: Vec<Shows>,
}

const ABILITIES: &str = "
    MATCH (p:Person {id: $personId}), (a:Ability)
    RETURN p.normSex AS norm_sex, toString(p.birthday) AS birthday,
           a.id AS id, a.name AS name, a.category AS category, a.group AS group, a.description AS description,
           coalesce(a.examples, []) AS examples,
           COLLECT { MATCH (p)-[r:RATED_ABILITY]->(a) RETURN r.anchor }[0] AS rating,
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
               WHERE EXISTS { MATCH (t)<-[:SUBFUNCTION_OF*0..4]-(:BodyFunction)-[:UNDERLIES]->(a) }
                  OR EXISTS { MATCH (t)-[:PART_SUBTYPE_OF*0..2]->(:BodyPart)-[:SERVES]->(:BodyFunction)<-[:SUBFUNCTION_OF*0..4]-(:BodyFunction)-[:UNDERLIES]->(a) }
               RETURN {name: t.name, extent: i.extent}
           } AS impairments
    ORDER BY a.category, a.name
";

//where a person stands on one ability: the readings that count, each weighted by how much it says, or else their
//rating of themselves, held back by their worst impairment in what it rests on
fn work_out(row: Row) -> Ability {
    let birthday = row.birthday.as_deref().and_then(date);
    let sex = row.norm_sex.as_deref();
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

    let mut place = if readings.is_empty() {
        row.rating.and_then(|r| RATED.get(r as usize)).map(|v| {
            basis.push(Basis { kind: "rating".into(), name: row.name.clone(), standing: None, extent: None });
            (*v, RATED_CONFIDENCE)
        })
    } else {
        let weight: f64 = readings.iter().map(|(_, c)| c).sum();
        let value = readings.iter().map(|(v, c)| v * c).sum::<f64>() / weight.max(f64::EPSILON);
        let doubt: f64 = readings.iter().map(|(_, c)| 1.0 - c).product();
        Some((value, (1.0 - doubt).min(MAX_CONFIDENCE)))
    };

    let worst = row.impairments.iter()
        .filter_map(|i| CAPS.iter().find(|(e, _)| *e == i.extent).map(|(_, cap)| (i, *cap)))
        .min_by(|a, b| a.1.total_cmp(&b.1));
    if let Some((impaired, cap)) = worst {
        basis.push(Basis { kind: "impairment".into(), name: impaired.name.clone(), standing: None, extent: Some(impaired.extent.clone()) });
        place = Some(match place {
            Some((value, confidence)) => (value.min(cap), confidence.max(IMPAIRED_CONFIDENCE)),
            None => (cap, IMPAIRED_CONFIDENCE),
        });
    }

    let round = |x: f64| (x * 100.0).round() / 100.0;
    Ability {
        value: place.map(|(v, _)| round(v.clamp(0.01, 0.99))),
        confidence: place.map(|(_, c)| round(c)),
        basis,
        rating: row.rating,
        measurements,
        id: row.id,
        name: row.name,
        category: row.category,
        group: row.group,
        description: row.description,
        examples: row.examples,
    }
}

//works out where a person stands on every ability, keeps it as HAS_ABILITY (dropping the ones nothing says anything
//about any more), and returns them all
pub async fn refresh(state: &AppState, person_id: &str) -> Result<Vec<Ability>, (StatusCode, String)> {
    let mut result = state.graph.execute(query(ABILITIES).param("personId", person_id)).await.map_err(internal)?;
    let mut abilities = Vec::new();
    while let Some(row) = result.next().await.map_err(internal)? {
        abilities.push(work_out(row.to::<Row>().map_err(internal)?));
    }

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

#[derive(Deserialize)]
struct RatingRequest {
    anchor: i64, //the hardest of the ability's three examples they can do, 1 to 3, or 0 for none of them
}

//rates the logged in user on an ability by its examples, in place of any rating they had
async fn rate(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<RatingRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if !(0..RATED.len() as i64).contains(&req.anchor) {
        return Err(bad("Pick one of the examples, or none of them."));
    }
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId}), (a:Ability {id: $id})
        MERGE (p)-[r:RATED_ABILITY]->(a)
        SET r.anchor = $anchor, r.ratedAt = datetime()
        RETURN count(r) AS set
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("anchor", req.anchor)
    ).await.map_err(internal)?;
    let set: i64 = rows.next().await.map_err(internal)?.map(|r| r.get("set")).transpose().map_err(internal)?.unwrap_or(0);
    if set == 0 {
        return Err((StatusCode::NOT_FOUND, "That ability doesn't exist.".to_string()));
    }
    refresh(&state, &user.person_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

//takes back the logged in user's rating of themselves on an ability
async fn unrate(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (:Person {id: $personId})-[r:RATED_ABILITY]->(:Ability {id: $id})
        DELETE r
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    refresh(&state, &user.person_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
