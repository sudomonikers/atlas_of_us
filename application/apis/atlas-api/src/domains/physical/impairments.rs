//impairments: a person's body functions and body parts that don't work as they might, and how much. Only the person
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

use super::{abilities, bad, internal};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/impairments", get(impairments))
        .route("/impairments/{id}", put(set_impairment).delete(clear_impairment))
}

//how much a function or part is impaired
const EXTENTS: [&str; 4] = ["mild", "moderate", "severe", "complete"];
//how a part has changed
const CHANGES: [&str; 7] = [
    "total_absence", "partial_absence", "additional_part", "aberrant_dimensions", "discontinuity", "deviating_position",
    "qualitative_change",
];

//the body function or part with an id, as `c`. Ids are unique within each label, so each side uses its index
const FIND: &str = "CALL { MATCH (c:BodyFunction {id: $id}) RETURN c UNION MATCH (c:BodyPart {id: $id}) RETURN c }";

//a body function
#[derive(Serialize, Deserialize)]
pub struct BodyFunction {
    id: String,
    code: String, //the ICF code, such as b2100
    name: String,
    group: String,
    subgroup: Option<String>,
    parent: Option<String>, //the id of the one it's part of
    description: Option<String>,
    includes: Vec<String>,
    excludes: Vec<String>,
    abilities: Vec<String>, //the abilities it underlies
}

//one of the logged in user's impairments, in a body function or a body part
#[derive(Serialize, Deserialize)]
pub struct Impairment {
    id: String,             //the function or part it's in
    extent: String,         //mild, moderate, severe or complete
    change: Option<String>, //how a part has changed
}

#[derive(Serialize)]
pub struct Impairments {
    functions: Vec<BodyFunction>,
    impairments: Vec<Impairment>,
}

//every body function, with the logged in user's impairments. The parts they can be in come from GET /anatomy
async fn impairments(State(state): State<AppState>, user: AuthUser) -> Result<Json<Impairments>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (c:BodyFunction)
        OPTIONAL MATCH (c)-[:SUBFUNCTION_OF]->(p:BodyFunction)
        RETURN c.id AS id, c.code AS code, c.name AS name, c.group AS group, c.subgroup AS subgroup, p.id AS parent,
               c.description AS description, coalesce(c.includes, []) AS includes, coalesce(c.excludes, []) AS excludes,
               COLLECT { MATCH (c)-[:UNDERLIES]->(a:Ability) RETURN a.name ORDER BY a.name } AS abilities
        ORDER BY c.code
    ")).await.map_err(internal)?;
    let mut functions = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        functions.push(row.to::<BodyFunction>().map_err(internal)?);
    }
    let mut rows = state.graph.execute(query("
        MATCH (:Person {id: $personId})-[i:HAS_IMPAIRMENT]->(c)
        RETURN c.id AS id, i.extent AS extent, i.change AS change
        ORDER BY c.name
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let mut impairments = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        impairments.push(row.to::<Impairment>().map_err(internal)?);
    }
    Ok(Json(Impairments { functions, impairments }))
}

#[derive(Deserialize)]
struct ImpairmentRequest {
    extent: String,
    change: Option<String>, //only kept on a part
}

//notes or changes an impairment in a body function or part for the logged in user
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
        SET i.extent = $extent, i.change = CASE WHEN c:BodyPart THEN $change END, i.updatedAt = datetime()
        RETURN count(i) AS set
    "))
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("extent", req.extent.as_str())
        .param("change", req.change)
    ).await.map_err(internal)?;
    let set: i64 = rows.next().await.map_err(internal)?.map(|r| r.get("set")).transpose().map_err(internal)?.unwrap_or(0);
    if set == 0 {
        return Err((StatusCode::NOT_FOUND, "That body function or part doesn't exist.".to_string()));
    }
    //an impairment holds back the abilities it rests on
    abilities::refresh(&state, &user.person_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

//removes one of the logged in user's impairments
async fn clear_impairment(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query(&format!("
        {FIND}
        MATCH (:Person {{id: $personId}})-[i:HAS_IMPAIRMENT]->(c)
        DELETE i
    ")).param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    abilities::refresh(&state, &user.person_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
