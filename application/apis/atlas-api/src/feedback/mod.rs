//Feedback: what users tell us about the app, each Feedback node SUBMITTED_BY the Person who wrote it
use axum::{Json, Router, extract::State, http::StatusCode, routing::post};
use neo4rs::query;
use serde::Deserialize;

use crate::{auth::AuthUser, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/", post(submit_feedback))
}

#[derive(Deserialize)]
pub struct FeedbackPayload {
    description: String,
    url: String, //the page the user was on when they opened the form
}

//saves the logged in user's feedback
pub async fn submit_feedback(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<FeedbackPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    let description = body.description.trim().to_string();
    if description.is_empty() || description.chars().count() > 5000 {
        return Err((StatusCode::BAD_REQUEST, "Feedback needs to be between 1 and 5000 characters.".to_string()));
    }

    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        CREATE (p)-[:SUBMITTED_BY]->(:Feedback {description: $description, url: $url, submittedDate: datetime()})
        RETURN p.id AS person_id
    ")
        .param("personId", user.person_id)
        .param("description", description)
        .param("url", body.url.chars().take(2000).collect::<String>())
    ).await.map_err(|e| internal(&e))?;
    match rows.next().await.map_err(|e| internal(&e))? {
        Some(_) => Ok(StatusCode::NO_CONTENT), //the ui reads a body on anything but 204
        None => Err((StatusCode::UNAUTHORIZED, "Your session has expired. Please log in again.".to_string())),
    }
}
