use super::provider::{GenerationConfig, LlmError, LlmProvider};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;

/// Request format for Anthropic Claude Messages API
#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    system: String,
    messages: Vec<ClaudeMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stop_sequences: Option<Vec<String>>,
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
    usage: Option<ClaudeUsage>,
}

#[derive(Debug, Deserialize)]
struct ClaudeUsage {
    input_tokens: Option<u32>,
    output_tokens: Option<u32>,
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

/// LLM provider using Anthropic Claude API
pub struct ClaudeProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl ClaudeProvider {
    const API_ENDPOINT: &'static str = "https://api.anthropic.com/v1/messages";
    const ANTHROPIC_VERSION: &'static str = "2023-06-01";

    /// Create a new ClaudeProvider
    pub fn new() -> Result<Self, LlmError> {
        let api_key = env::var("CLAUDE_API_KEY").map_err(|_| {
            LlmError::NotConfigured("CLAUDE_API_KEY environment variable not set".to_string())
        })?;

        let model = env::var("CLAUDE_MODEL").unwrap_or_else(|_| "claude-sonnet-4-20250514".to_string());

        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minute timeout for long generations
            .build()
            .map_err(|e| LlmError::ConnectionFailed(e.to_string()))?;

        tracing::info!("ClaudeProvider initialized with model: {}", model);

        Ok(Self {
            client,
            api_key,
            model,
        })
    }
}

#[async_trait]
impl LlmProvider for ClaudeProvider {
    async fn generate(
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
            max_tokens: config.max_tokens.unwrap_or(16384),
            system: system_prompt.to_string(),
            messages,
            temperature: config.temperature,
            stop_sequences: config.stop_sequences.clone(),
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
            // Try to parse structured error
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

        // Log response metadata for debugging
        tracing::debug!(
            "Claude response - stop_reason: {:?}, usage: {:?}",
            result.stop_reason,
            result.usage
        );

        if result.stop_reason.as_deref() == Some("max_tokens") {
            tracing::warn!(
                "Claude hit max_tokens limit. Requested: {}, Used: {:?}",
                config.max_tokens.unwrap_or(16384),
                result.usage.as_ref().and_then(|u| u.output_tokens)
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

    fn name(&self) -> &'static str {
        "claude"
    }

    async fn health_check(&self) -> Result<(), LlmError> {
        // Claude doesn't have a dedicated health endpoint
        // We verify the API key is set and valid format
        if self.api_key.is_empty() {
            return Err(LlmError::NotConfigured(
                "API key is empty".to_string(),
            ));
        }

        // Optionally, we could do a minimal request to verify connectivity
        // For now, just verify configuration is present
        Ok(())
    }
}
