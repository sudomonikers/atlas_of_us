//Personality Graph: static PersonalityTrait nodes, Person -[:HAS_PERSONALITY_TRAIT {value}]-> PersonalityTrait
use axum::{Json, Router, extract::State, http::StatusCode, routing::{get,post}};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/traits", get(list_all_personality_traits))
        .route("/attach", post(create_user_personality_trait_affiliation))
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
    id: String
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());

    let mut rows = state.graph.execute(query("
            MATCH (p:PersonalityTrait) 
            RETURN p.name AS name, p.description AS description, elementId(p) AS id
            ORDER BY name"
        )).await.map_err(|e| internal(&e))?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        traits.push(row.to::<PersonalityTrait>().map_err(|e| internal(&e))?);
    }
    Ok(Json(traits))
}

#[derive(Deserialize)]
pub struct UpdatePayload {
    user_id: String,
    trait_id: String,
    value: u8
}
pub async fn create_user_personality_trait_affiliation(
    State(state): State<AppState>,
    Json(body): Json<UpdatePayload>
) -> Result<Json<PersonalityTrait>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $userId
        MATCH (t:PersonalityTrait) WHERE elementId(t) = $traitId
        MERGE (p)-[r:HAS_PERSONALITY_TRAIT]->(t)
        SET r.value = $value, r.updatedDate = datetime()
        RETURN t.name AS name, t.description AS description, elementId(t) AS id
    ")
        .param("user_id", body.user_id)
        .param("trait_id", body.trait_id)
        .param("value", body.value as i64)
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.to::<PersonalityTrait>().map_err(|e| internal(&e))?)),
        None => Err((StatusCode::NOT_FOUND, "person or trait not found".to_string())),
    }
}
