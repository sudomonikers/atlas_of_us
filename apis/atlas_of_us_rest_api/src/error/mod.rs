use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Unified API error response format
#[derive(Debug, Serialize)]
pub struct ApiErrorResponse {
    pub error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

/// Unified application error type with automatic HTTP response conversion
#[derive(Debug)]
pub enum AppError {
    // Validation errors (400)
    ValidationError(String),

    // Authentication errors (401)
    Unauthorized(String),

    // Authorization errors (403)
    Forbidden(String),

    // Not found errors (404)
    NotFound(String),

    // Conflict errors (409)
    SimilarNodeExists { score: f64, details: String },
    AlreadyExists(String),

    // External service errors (502/503)
    EmbeddingFailed(String),
    StorageFailed(String),
    ImageGenerationFailed(String),
    LlmFailed(String),

    // Database errors (500)
    DatabaseError(String),

    // Internal errors (500)
    InternalError(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::SimilarNodeExists { score, details } => {
                write!(f, "Similar node exists (score: {:.2}): {}", score, details)
            }
            AppError::AlreadyExists(msg) => write!(f, "Already exists: {}", msg),
            AppError::EmbeddingFailed(msg) => write!(f, "Embedding service failed: {}", msg),
            AppError::StorageFailed(msg) => write!(f, "Storage service failed: {}", msg),
            AppError::ImageGenerationFailed(msg) => write!(f, "Image generation failed: {}", msg),
            AppError::LlmFailed(msg) => write!(f, "LLM service failed: {}", msg),
            AppError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AppError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error, details, code) = match &self {
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                "Validation failed".to_string(),
                Some(msg.clone()),
                Some("VALIDATION_ERROR".to_string()),
            ),
            AppError::Unauthorized(msg) => (
                StatusCode::UNAUTHORIZED,
                "Unauthorized".to_string(),
                Some(msg.clone()),
                Some("UNAUTHORIZED".to_string()),
            ),
            AppError::Forbidden(msg) => (
                StatusCode::FORBIDDEN,
                "Forbidden".to_string(),
                Some(msg.clone()),
                Some("FORBIDDEN".to_string()),
            ),
            AppError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                "Resource not found".to_string(),
                Some(msg.clone()),
                Some("NOT_FOUND".to_string()),
            ),
            AppError::SimilarNodeExists { score, details } => (
                StatusCode::CONFLICT,
                format!("Similar node exists (score: {:.2})", score),
                Some(details.clone()),
                Some("SIMILAR_NODE_EXISTS".to_string()),
            ),
            AppError::AlreadyExists(msg) => (
                StatusCode::CONFLICT,
                "Resource already exists".to_string(),
                Some(msg.clone()),
                Some("ALREADY_EXISTS".to_string()),
            ),
            AppError::EmbeddingFailed(msg) => (
                StatusCode::BAD_GATEWAY,
                "Embedding service unavailable".to_string(),
                Some(msg.clone()),
                Some("EMBEDDING_FAILED".to_string()),
            ),
            AppError::StorageFailed(msg) => (
                StatusCode::BAD_GATEWAY,
                "Storage service unavailable".to_string(),
                Some(msg.clone()),
                Some("STORAGE_FAILED".to_string()),
            ),
            AppError::ImageGenerationFailed(msg) => (
                StatusCode::BAD_GATEWAY,
                "Image generation service unavailable".to_string(),
                Some(msg.clone()),
                Some("IMAGE_GEN_FAILED".to_string()),
            ),
            AppError::LlmFailed(msg) => (
                StatusCode::BAD_GATEWAY,
                "LLM service unavailable".to_string(),
                Some(msg.clone()),
                Some("LLM_FAILED".to_string()),
            ),
            AppError::DatabaseError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error".to_string(),
                Some(msg.clone()),
                Some("DATABASE_ERROR".to_string()),
            ),
            AppError::InternalError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
                Some(msg.clone()),
                Some("INTERNAL_ERROR".to_string()),
            ),
        };

        let body = Json(ApiErrorResponse {
            error,
            details,
            code,
        });

        (status, body).into_response()
    }
}

/// Convenience type alias for Result with AppError
pub type AppResult<T> = Result<T, AppError>;

// Conversion from neo4rs::Error
impl From<neo4rs::Error> for AppError {
    fn from(e: neo4rs::Error) -> Self {
        AppError::DatabaseError(e.to_string())
    }
}

// Backward compatibility: Convert from graph::ServiceError
// This allows gradual migration without breaking existing code
use crate::domains::graph::models::ServiceError;

impl From<ServiceError> for AppError {
    fn from(e: ServiceError) -> Self {
        match e {
            ServiceError::DatabaseError(msg) => AppError::DatabaseError(msg),
            ServiceError::EmbeddingFailed(msg) => AppError::EmbeddingFailed(msg),
            ServiceError::SimilarNodeExists { score, details } => {
                AppError::SimilarNodeExists { score, details }
            }
            ServiceError::NotFound(msg) => AppError::NotFound(msg),
            ServiceError::ValidationError(msg) => AppError::ValidationError(msg),
        }
    }
}
