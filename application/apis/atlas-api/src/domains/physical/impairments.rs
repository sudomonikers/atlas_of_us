//impairments: a person's body functions and structures that don't work as they might, and how much. Only the person
//who noted them sees them
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{bad, internal};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/impairments", get(impairments))
        .route("/impairments/{id}", put(set_impairment).delete(clear_impairment))
}

//how much a function or structure is impaired
const EXTENTS: [&str; 4] = ["mild", "moderate", "severe", "complete"];
//how a structure has changed
const CHANGES: [&str; 7] = [
    "total_absence", "partial_absence", "additional_part", "aberrant_dimensions", "discontinuity", "deviating_position",
    "qualitative_change",
];

//the body function or structure with an id, as `c`. Ids are unique within each label, so each side uses its index
const FIND: &str = "CALL { MATCH (c:BodyFunction {id: $id}) RETURN c UNION MATCH (c:BodyStructure {id: $id}) RETURN c }";

//a body function or structure
#[derive(Serialize, Deserialize)]
pub struct BodyPart {
    id: String,
    code: String, //the ICF code, such as b2100 or s7502
    name: String,
    group: String,
    subgroup: Option<String>,
    parent: Option<String>, //the id of the one it's part of
    description: Option<String>,
    includes: Vec<String>,
    excludes: Vec<String>,
    abilities: Vec<String>, //the abilities it underlies
}

//one of the logged in user's impairments
#[derive(Serialize, Deserialize)]
pub struct Impairment {
    id: String,             //the function or structure it's in
    extent: String,         //mild, moderate, severe or complete
    change: Option<String>, //how a structure has changed
}

#[derive(Serialize)]
pub struct Impairments {
    functions: Vec<BodyPart>,
    structures: Vec<BodyPart>,
    impairments: Vec<Impairment>,
}

//every node with the label, broader ones before the narrower ones under them, with the relationship from a narrower one
//to the broader one it's part of
async fn parts(state: &AppState, label: &str, narrower: &str) -> Result<Vec<BodyPart>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (c:{label})
        OPTIONAL MATCH (c)-[:{narrower}]->(p:{label})
        RETURN c.id AS id, c.code AS code, c.name AS name, c.group AS group, c.subgroup AS subgroup, p.id AS parent,
               c.description AS description, coalesce(c.includes, []) AS includes, coalesce(c.excludes, []) AS excludes,
               COLLECT {{ MATCH (c)-[:UNDERLIES]->(a:Ability) RETURN a.name ORDER BY a.name }} AS abilities
        ORDER BY c.code
    "))).await.map_err(internal)?;
    let mut parts = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        parts.push(row.to::<BodyPart>().map_err(internal)?);
    }
    Ok(parts)
}

//every body function and structure, with the logged in user's impairments
async fn impairments(State(state): State<AppState>, user: AuthUser) -> Result<Json<Impairments>, (StatusCode, String)> {
    let functions = parts(&state, "BodyFunction", "SUBFUNCTION_OF").await?;
    let structures = parts(&state, "BodyStructure", "SUBSTRUCTURE_OF").await?;
    let mut rows = state.graph.execute(query("
        MATCH (:Person {id: $personId})-[i:HAS_IMPAIRMENT]->(c)
        RETURN c.id AS id, i.extent AS extent, i.change AS change
        ORDER BY c.code
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let mut impairments = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        impairments.push(row.to::<Impairment>().map_err(internal)?);
    }
    Ok(Json(Impairments { functions, structures, impairments }))
}

#[derive(Deserialize)]
struct ImpairmentRequest {
    extent: String,
    change: Option<String>, //only kept on a structure
}

//notes or changes an impairment in a body function or structure for the logged in user
async fn set_impairment(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<ImpairmentRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if !EXTENTS.contains(&req.extent.as_str()) {
        return Err(bad("Pick mild, moderate, severe or complete."));
    }
    if req.change.as_deref().is_some_and(|c| !CHANGES.contains(&c)) {
        return Err(bad("Pick one of the kinds of change."));
    }
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})
        {FIND}
        MERGE (p)-[i:HAS_IMPAIRMENT]->(c)
        SET i.extent = $extent, i.change = CASE WHEN c:BodyStructure THEN $change END, i.updatedAt = datetime()
        RETURN count(i) AS set
    "))
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("extent", req.extent.as_str())
        .param("change", req.change)
    ).await.map_err(internal)?;
    let set: i64 = rows.next().await.map_err(internal)?.map(|r| r.get("set")).transpose().map_err(internal)?.unwrap_or(0);
    if set == 0 {
        return Err((StatusCode::NOT_FOUND, "That body function or structure doesn't exist.".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

//removes one of the logged in user's impairments
async fn clear_impairment(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query(&format!("
        {FIND}
        MATCH (:Person {{id: $personId}})-[i:HAS_IMPAIRMENT]->(c)
        DELETE i
    ")).param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
