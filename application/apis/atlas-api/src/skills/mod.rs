//Skills Graph: Skill nodes with 5 Dreyfus levels linked by HAS_LEVEL / NEXT_LEVEL
use axum::{Json, Router, response::IntoResponse, routing::get};
use serde_json::json;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(health_check))
}

/// Healthcheck for the skills router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Skills Api Healthy!"
    });
    Json(json_response)
}
