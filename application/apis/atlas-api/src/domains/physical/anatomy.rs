//the anatomy: every part of the body, from FMA, as the 3D body and the search need it, with the wholes it belongs to
//and the kinds of part it is. See documentation/architecture/physical.md
use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    routing::get,
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::internal;

pub fn router() -> Router<AppState> {
    Router::new().route("/anatomy", get(anatomy))
}

//a part as the 3D body and the search need it
#[derive(Serialize, Deserialize)]
pub struct PartSummary {
    id: String,
    fma_id: String,
    name: String,
    synonyms: Vec<String>,
    wholes: Vec<String>, //the ids of the parts it belongs to
    kinds: Vec<String>,  //the ids of the kinds of part it is
    drawn: bool,         //whether the 3D body has a model of it
}

//every part of the body
async fn anatomy(State(state): State<AppState>, _user: AuthUser) -> Result<Json<Vec<PartSummary>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:BodyPart)
        RETURN p.id AS id, p.fmaId AS fma_id, p.name AS name, coalesce(p.synonyms, []) AS synonyms,
               COLLECT { MATCH (p)-[:SUBPART_OF]->(w:BodyPart) RETURN w.id } AS wholes,
               COLLECT { MATCH (p)-[:PART_SUBTYPE_OF]->(k:BodyPart) RETURN k.id } AS kinds,
               size(coalesce(p.elements, [])) > 0 AS drawn
        ORDER BY toLower(p.name)
    ")).await.map_err(internal)?;
    let mut parts = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        parts.push(row.to::<PartSummary>().map_err(internal)?);
    }
    Ok(Json(parts))
}
