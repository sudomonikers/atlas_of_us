use super::provider::{GenerationConfig, LlmError, LlmProvider};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;

/// Request format for OpenAI-compatible chat completions endpoint
#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    stop: Option<Vec<String>>,
    stream: bool,
}

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

/// Response format from chat completions endpoint
#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Debug, Deserialize)]
struct ChatMessageResponse {
    content: String,
}

/// LLM provider using OpenAI-compatible chat completions API
pub struct LlamaCppProvider {
    client: Client,
    endpoint: String,
}

impl LlamaCppProvider {
    /// Create a new LlamaCppProvider
    pub fn new() -> Result<Self, LlmError> {
        let endpoint = env::var("LLM_ENDPOINT")
            .map_err(|_| LlmError::ConnectionFailed("LLM_ENDPOINT environment variable not set".to_string()))?;

        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minute timeout for long generations
            .build()
            .map_err(|e| LlmError::ConnectionFailed(e.to_string()))?;

        tracing::info!("LlamaCppProvider initialized with endpoint: {}", endpoint);

        Ok(Self { client, endpoint })
    }
}

#[async_trait]
impl LlmProvider for LlamaCppProvider {
    async fn generate(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        config: &GenerationConfig,
    ) -> Result<String, LlmError> {
        let messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user_prompt.to_string(),
            },
        ];

        let request = ChatCompletionRequest {
            model: "local".to_string(),
            messages,
            max_tokens: config.max_tokens,
            temperature: config.temperature,
            stop: config.stop_sequences.clone(),
            stream: false,
        };

        let response = self
            .client
            .post(&self.endpoint)
            .json(&request)
            .send()
            .await
            .map_err(|e| LlmError::ConnectionFailed(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(LlmError::RequestFailed(format!(
                "Status {}: {}",
                status, body
            )));
        }

        let result: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| LlmError::ParseError(e.to_string()))?;

        result
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| LlmError::ParseError("No choices in response".to_string()))
    }

    fn name(&self) -> &'static str {
        "llama-cpp"
    }

    async fn health_check(&self) -> Result<(), LlmError> {
        let health_url = self.endpoint.replace("/v1/chat/completions", "/health");

        let response = self
            .client
            .get(&health_url)
            .timeout(Duration::from_secs(5))
            .send()
            .await;

        match response {
            Ok(resp) if resp.status().is_success() => Ok(()),
            Ok(resp) => Err(LlmError::RequestFailed(format!(
                "Health check returned status: {}",
                resp.status()
            ))),
            Err(e) => Err(LlmError::ConnectionFailed(e.to_string())),
        }
    }
}
