//Physical Attributes Graph: body structure (Uberon), conditions (Mondo/HPO) and PhysicalMeasurement nodes
use axum::{Json, Router, response::IntoResponse, routing::get};
use serde_json::json;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(health_check))
}

/// Healthcheck for the physical router.
pub async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Physical Api Healthy!"
    });
    Json(json_response)
}
