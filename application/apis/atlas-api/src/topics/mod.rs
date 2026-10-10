//Topics Graph: Topic nodes that INCLUDE Idea nodes (concept | claim | norm | value)
use axum::{Json, Router, response::IntoResponse, routing::get};
use serde_json::json;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(health_check))
}

/// Healthcheck for the topics router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Topics Api Healthy!"
    });
    Json(json_response)
}
