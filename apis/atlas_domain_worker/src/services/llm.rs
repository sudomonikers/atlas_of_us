use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Configuration for LLM text generation
#[derive(Debug, Clone)]
pub struct GenerationConfig {
    pub max_tokens: u32,
    pub temperature: f32,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        Self {
            max_tokens: 8192,
            temperature: 0.7,
        }
    }
}

/// Request format for Anthropic Claude Messages API
#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    system: String,
    messages: Vec<ClaudeMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
}

#[derive(Debug, Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

/// Response format from Claude Messages API
#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ContentBlock>,
    stop_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    content_type: String,
    text: Option<String>,
}

/// Error response from Claude API
#[derive(Debug, Deserialize)]
struct ClaudeErrorResponse {
    error: ClaudeErrorDetail,
}

#[derive(Debug, Deserialize)]
struct ClaudeErrorDetail {
    message: String,
    #[serde(rename = "type")]
    error_type: String,
}

/// LLM service using Anthropic Claude API
pub struct LlmService {
    client: Client,
    api_key: String,
    model: String,
}

impl LlmService {
    const API_ENDPOINT: &'static str = "https://api.anthropic.com/v1/messages";
    const ANTHROPIC_VERSION: &'static str = "2023-06-01";

    /// Create a new LlmService
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minute timeout for long generations
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            api_key,
            model: "claude-sonnet-4-20250514".to_string(),
        }
    }

    /// Generate a response from the LLM
    pub async fn generate(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        config: &GenerationConfig,
    ) -> Result<String, LlmError> {
        let messages = vec![ClaudeMessage {
            role: "user".to_string(),
            content: user_prompt.to_string(),
        }];

        let request = ClaudeRequest {
            model: self.model.clone(),
            max_tokens: config.max_tokens,
            system: system_prompt.to_string(),
            messages,
            temperature: Some(config.temperature),
        };

        let response = self
            .client
            .post(Self::API_ENDPOINT)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", Self::ANTHROPIC_VERSION)
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    LlmError::Timeout
                } else {
                    LlmError::ConnectionFailed(e.to_string())
                }
            })?;

        let status = response.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            return Err(LlmError::RateLimited);
        }

        if !status.is_success() {
            let error_body = response.text().await.unwrap_or_default();
            if let Ok(error_response) = serde_json::from_str::<ClaudeErrorResponse>(&error_body) {
                return Err(LlmError::RequestFailed(format!(
                    "{}: {}",
                    error_response.error.error_type, error_response.error.message
                )));
            }
            return Err(LlmError::RequestFailed(format!(
                "Status {}: {}",
                status, error_body
            )));
        }

        let result: ClaudeResponse = response
            .json()
            .await
            .map_err(|e| LlmError::ParseError(e.to_string()))?;

        // Log if max tokens was hit
        if result.stop_reason.as_deref() == Some("max_tokens") {
            tracing::warn!(
                "Claude hit max_tokens limit. Requested: {}",
                config.max_tokens
            );
        }

        // Extract text from the first text content block
        result
            .content
            .iter()
            .find_map(|block| {
                if block.content_type == "text" {
                    block.text.clone()
                } else {
                    None
                }
            })
            .ok_or_else(|| LlmError::ParseError("No text content in response".to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Request failed: {0}")]
    RequestFailed(String),
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("Request timed out")]
    Timeout,
    #[error("Rate limited")]
    RateLimited,
}

impl LlmError {
    /// Check if this error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            LlmError::ConnectionFailed(_) | LlmError::Timeout | LlmError::RateLimited
        )
    }
}
