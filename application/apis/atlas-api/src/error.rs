use axum::{Json, http::StatusCode, response::{IntoResponse, Response}};
use serde_json::json;

//common error type so handlers can use `?` and still return a proper http response
pub enum ApiError {
    Database(neo4rs::Error),
    Unauthorized(&'static str),
}

impl From<neo4rs::Error> for ApiError {
    fn from(err: neo4rs::Error) -> Self {
        ApiError::Database(err)
    }
}

impl From<neo4rs::DeError> for ApiError {
    fn from(err: neo4rs::DeError) -> Self {
        ApiError::Database(err.into())
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::Database(err) => {
                //log the real cause, never send db internals to the client
                tracing::error!(error = %err, "neo4j error");
                (StatusCode::INTERNAL_SERVER_ERROR, "database error")
            }
            ApiError::Unauthorized(reason) => (StatusCode::UNAUTHORIZED, reason),
        };
        (status, Json(json!({ "status": "error", "message": message }))).into_response()
    }
}
