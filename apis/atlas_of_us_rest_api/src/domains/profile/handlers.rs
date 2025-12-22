use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use neo4rs::Graph;
use serde_json::Value;

use super::services;

pub async fn get_user_profile(
    Path(username): Path<String>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    match services::get_user_profile(&graph, &username).await {
        Ok(profile_data) => Ok(Json(profile_data)),
        Err(e) => {
            tracing::error!("ERROR AT get_user_profile: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
