//Personality Graph: static PersonalityTrait nodes, Person -[:HAS_PERSONALITY_TRAIT {value}]-> PersonalityTrait
use axum::{Json, Router, extract::State, routing::get};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{error::ApiError, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/traits", get(list_all_personality_traits))
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, ApiError> {
    let mut rows = state
        .graph
        .execute(query("
            MATCH (p:PersonalityTrait) 
            RETURN p.name AS name, p.description AS description, <id> AS id 
            ORDER BY name"
        ))
        .await?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await? {
        traits.push(row.to::<PersonalityTrait>()?);
    }
    Ok(Json(traits))
}
