use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct EmbeddingRequest {
    content: String,
}

#[derive(Debug, Deserialize)]
struct EmbeddingResponseItem {
    embedding: Vec<Vec<f64>>,
}

type EmbeddingResponse = Vec<EmbeddingResponseItem>;

/// Generate an embedding vector for the given text
pub async fn generate_embedding(
    text_to_embed: &str,
) -> Result<Vec<f64>, EmbeddingError> {
    let embedding_endpoint = env::var("EMBEDDING_ENDPOINT")
        .map_err(|_| EmbeddingError::NotConfigured("EMBEDDING_ENDPOINT environment variable not set".to_string()))?;

    let request_body = EmbeddingRequest {
        content: text_to_embed.to_string(),
    };

    let client = reqwest::Client::new();
    let response = client
        .post(&embedding_endpoint)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| EmbeddingError::ConnectionFailed(e.to_string()))?;

    if !response.status().is_success() {
        return Err(EmbeddingError::RequestFailed(format!(
            "Status: {}",
            response.status()
        )));
    }

    let embedding_response: EmbeddingResponse = response
        .json()
        .await
        .map_err(|e| EmbeddingError::ParseError(e.to_string()))?;

    if embedding_response.is_empty() || embedding_response[0].embedding.is_empty() {
        return Err(EmbeddingError::InvalidResponse(
            "Empty embedding response".to_string(),
        ));
    }

    Ok(embedding_response[0].embedding[0].clone())
}

#[derive(Debug, thiserror::Error)]
pub enum EmbeddingError {
    #[error("Not configured: {0}")]
    NotConfigured(String),
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Request failed: {0}")]
    RequestFailed(String),
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}
