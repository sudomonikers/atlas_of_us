//Physical Attributes Graph: abilities, measurements with their norms, body functions and structures, and conditions.
//People record readings of measurements, and each reading's percentile is worked out from the norms when it's read. See
//documentation/architecture/physical.md
mod conditions;
mod impairments;
mod norms;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
};
use chrono::{Datelike, NaiveDate, Utc};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{auth::AuthUser, state::AppState};

use norms::Norm;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(health_check))
        .route("/measurements", get(measurements))
        .route("/measurements/{id}/readings", post(add_reading))
        .route("/readings/{id}", delete(delete_reading))
        .route("/me", put(set_me))
        .merge(impairments::router())
        .merge(conditions::router())
}

/// Healthcheck for the physical router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Physical Api Healthy!"
    });
    Json(json_response)
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn bad(message: &str) -> (StatusCode, String) {
    (StatusCode::BAD_REQUEST, message.to_string())
}

//the group of people a reading is compared with
#[derive(Serialize)]
pub struct ComparedWith {
    sex: String, //male, female or all
    age_from: i64,
    age_to: Option<i64>,
}

//one reading of a measurement, with where it sits among people of the same sex and age when they took it
#[derive(Serialize)]
pub struct Reading {
    id: String,
    value: f64,
    measured_on: String, //YYYY-MM-DD
    percentile: Option<f64>, //the share of people, 0 to 100, with a lower value. None when there's no norm for their age
    compared_with: Option<ComparedWith>,
}

//a measurement, with the logged in user's readings of it, newest first
#[derive(Serialize)]
pub struct Measurement {
    id: String,
    name: String,
    unit: String,
    better: String, //higher, lower or neither
    group: String,  //Body, Vitals, Fitness or Senses
    description: String,
    min: f64, //the lowest and highest readings that can be recorded
    max: f64,
    abilities: Vec<String>, //the abilities it shows
    ages: Option<Ages>, //the ages it has norms for. None when it has none
    readings: Vec<Reading>,
}

#[derive(Serialize)]
pub struct Ages {
    from: i64,
    to: Option<i64>, //None when the oldest band has no top
}

#[derive(Serialize)]
pub struct Measurements {
    norm_sex: Option<String>, //the sex whose norms they're compared with. None compares them with everyone
    measurements: Vec<Measurement>,
}

#[derive(Deserialize)]
struct RawReading {
    id: String,
    value: f64,
    measured_on: String,
}

#[derive(Deserialize)]
struct Row {
    norm_sex: Option<String>,
    birthday: Option<String>,
    id: String,
    name: String,
    unit: String,
    better: String,
    group: String,
    description: String,
    min: f64,
    max: f64,
    abilities: Vec<String>,
    readings: Vec<RawReading>,
    norms: Vec<Norm>,
}

//whole years from a birthday to a date
fn age_on(birthday: NaiveDate, on: NaiveDate) -> i64 {
    let years = (on.year() - birthday.year()) as i64;
    if (on.month(), on.day()) < (birthday.month(), birthday.day()) { years - 1 } else { years }
}

fn date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}

//a reading with its percentile against the norm for the person's sex and age on the day
fn reading(raw: RawReading, norms: &[Norm], sex: Option<&str>, birthday: Option<NaiveDate>) -> Reading {
    let norm = birthday.zip(date(&raw.measured_on)).and_then(|(b, on)| norms::pick(norms, sex, age_on(b, on)));
    Reading {
        percentile: norm.map(|n| norms::percentile(n, raw.value)),
        compared_with: norm.map(|n| ComparedWith { sex: n.sex.clone(), age_from: n.age_from, age_to: n.age_to }),
        id: raw.id,
        value: raw.value,
        measured_on: raw.measured_on,
    }
}

const MEASUREMENTS: &str = "
    MATCH (p:Person {id: $personId}), (m:PhysicalMeasurement)
    WHERE $id IS NULL OR m.id = $id
    RETURN p.normSex AS norm_sex, toString(p.birthday) AS birthday,
           m.id AS id, m.name AS name, m.unit AS unit, m.better AS better, m.group AS group, m.description AS description,
           m.min AS min, m.max AS max,
           COLLECT { MATCH (m)-[:MEASURES]->(a:Ability) RETURN a.name ORDER BY a.name } AS abilities,
           COLLECT {
               MATCH (p)-[r:HAS_MEASUREMENT]->(m)
               WITH r ORDER BY r.measuredOn DESC, r.recordedAt DESC
               RETURN {id: r.id, value: r.value, measured_on: toString(r.measuredOn)}
           } AS readings,
           COLLECT {
               MATCH (m)-[:HAS_NORM]->(n:MeasurementNorm)
               RETURN {sex: n.sex, age_from: n.ageFrom, age_to: n.ageTo, percentiles: n.percentiles, values: n.values}
           } AS norms
    ORDER BY m.name
";

async fn rows(state: &AppState, person_id: &str, id: Option<&str>) -> Result<Vec<Row>, (StatusCode, String)> {
    let mut result = state.graph.execute(query(MEASUREMENTS).param("personId", person_id).param("id", id)).await.map_err(internal)?;
    let mut rows = Vec::new();
    while let Some(row) = result.next().await.map_err(internal)? {
        rows.push(row.to::<Row>().map_err(internal)?);
    }
    Ok(rows)
}

//every measurement, with the logged in user's readings and where each sits
async fn measurements(State(state): State<AppState>, user: AuthUser) -> Result<Json<Measurements>, (StatusCode, String)> {
    let rows = rows(&state, &user.person_id, None).await?;
    let norm_sex = rows.first().and_then(|r| r.norm_sex.clone());
    let measurements = rows.into_iter().map(|row| {
        let birthday = row.birthday.as_deref().and_then(date);
        let sex = row.norm_sex.as_deref();
        let ages = row.norms.iter().map(|n| n.age_from).min().map(|from| Ages {
            from,
            to: row.norms.iter().map(|n| n.age_to).max_by_key(|to| to.unwrap_or(i64::MAX)).flatten(),
        });
        Measurement {
            readings: row.readings.into_iter().map(|r| reading(r, &row.norms, sex, birthday)).collect(),
            id: row.id,
            name: row.name,
            unit: row.unit,
            better: row.better,
            group: row.group,
            description: row.description,
            min: row.min,
            max: row.max,
            abilities: row.abilities,
            ages,
        }
    }).collect();
    Ok(Json(Measurements { norm_sex, measurements }))
}

#[derive(Deserialize)]
struct ReadingRequest {
    value: f64,
    measured_on: String, //YYYY-MM-DD
}

//records a reading of a measurement for the logged in user, and returns it with its percentile
async fn add_reading(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<ReadingRequest>) -> Result<(StatusCode, Json<Reading>), (StatusCode, String)> {
    let row = rows(&state, &user.person_id, Some(&id)).await?.into_iter().next()
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That measurement doesn't exist.".to_string()))?;
    if !req.value.is_finite() || req.value < row.min || req.value > row.max {
        return Err((StatusCode::BAD_REQUEST, format!("Enter a {} between {} and {} {}.", row.name.to_lowercase(), row.min, row.max, row.unit)));
    }
    let measured_on = date(req.measured_on.trim()).ok_or_else(|| bad("That doesn't look like a valid date."))?;
    if measured_on > Utc::now().date_naive() {
        return Err(bad("The date can't be in the future."));
    }
    let birthday = row.birthday.as_deref().and_then(date);
    if birthday.is_some_and(|b| measured_on < b) {
        return Err(bad("The date can't be before you were born."));
    }

    let mut created = state.graph.execute(query("
        MATCH (p:Person {id: $personId}), (m:PhysicalMeasurement {id: $id})
        CREATE (p)-[r:HAS_MEASUREMENT {id: randomUUID(), value: $value, measuredOn: date($measuredOn), recordedAt: datetime()}]->(m)
        RETURN r.id AS id
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("value", req.value)
        .param("measuredOn", measured_on.to_string())
    ).await.map_err(internal)?;
    let reading_id: String = created.next().await.map_err(internal)?.ok_or_else(|| internal("the reading wasn't created"))?.get("id").map_err(internal)?;
    let raw = RawReading { id: reading_id, value: req.value, measured_on: measured_on.to_string() };
    Ok((StatusCode::CREATED, Json(reading(raw, &row.norms, row.norm_sex.as_deref(), birthday))))
}

//removes one of the logged in user's readings
async fn delete_reading(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (:Person {id: $personId})-[r:HAS_MEASUREMENT {id: $id}]->(:PhysicalMeasurement)
        DELETE r
        RETURN count(*) AS deleted
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    let deleted: i64 = rows.next().await.map_err(internal)?.map(|r| r.get("deleted")).transpose().map_err(internal)?.unwrap_or(0);
    if deleted == 0 {
        return Err((StatusCode::NOT_FOUND, "That reading doesn't exist.".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

//the logged in user's own physical attributes, the ones that are set rather than recorded as readings. Every field is
//sent, and replaces what they had
#[derive(Deserialize)]
struct MeRequest {
    norm_sex: Option<String>, //the sex whose norms they're compared with, male or female. None compares them with everyone
}

//sets the logged in user's own physical attributes
async fn set_me(State(state): State<AppState>, user: AuthUser, Json(req): Json<MeRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if req.norm_sex.as_deref().is_some_and(|s| s != "male" && s != "female") {
        return Err(bad("Pick men, women or everyone to be compared with."));
    }
    state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.normSex = $normSex")
        .param("personId", user.person_id.as_str())
        .param("normSex", req.norm_sex)
    ).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
