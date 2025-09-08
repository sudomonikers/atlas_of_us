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

pub async fn generate_embedding(
    text_to_embed: &str,
) -> Result<Vec<f64>, Box<dyn std::error::Error>> {
    let embedding_endpoint = env::var("EMBEDDING_ENDPOINT")
        .map_err(|_| "EMBEDDING_ENDPOINT environment variable not set")?;

    let request_body = EmbeddingRequest {
        content: text_to_embed.to_string(),
    };

    let client = reqwest::Client::new();
    let response = client
        .post(&embedding_endpoint)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Embedding endpoint returned status: {}", response.status()).into());
    }

    let embedding_response: EmbeddingResponse = response.json().await?;

    if embedding_response.is_empty() || embedding_response[0].embedding.is_empty() {
        return Err("Invalid embedding response".into());
    }

    Ok(embedding_response[0].embedding[0].clone())
}
