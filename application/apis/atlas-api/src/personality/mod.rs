//Personality Graph: static PersonalityTrait nodes, Person -[:HAS_PERSONALITY_TRAIT {value}]-> PersonalityTrait
use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/traits", get(list_all_personality_traits))
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
    id: String
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());

    let mut rows = state
        .graph
        .execute(query("
            MATCH (p:PersonalityTrait) 
            RETURN p.name AS name, p.description AS description, elementId(p) AS id
            ORDER BY name"
        ))
        .await
        .map_err(|e| internal(&e))?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        traits.push(row.to::<PersonalityTrait>().map_err(|e| internal(&e))?);
    }
    Ok(Json(traits))
}
