use super::provider::{GenerationConfig, LlmError, LlmProvider};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;

/// Request format for llama.cpp /completion endpoint
#[derive(Debug, Serialize)]
struct LlamaCppCompletionRequest {
    prompt: String,
    n_predict: Option<u32>,
    temperature: Option<f32>,
    stop: Option<Vec<String>>,
    stream: bool,
}

/// Response format from llama.cpp /completion endpoint
#[derive(Debug, Deserialize)]
struct LlamaCppCompletionResponse {
    content: String,
    #[allow(dead_code)]
    stop: bool,
}

/// Request format for llama.cpp /v1/chat/completions endpoint (OpenAI-compatible)
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

/// Response format from /v1/chat/completions endpoint
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

/// Llama.cpp server provider implementation
pub struct LlamaCppProvider {
    client: Client,
    endpoint: String,
    use_chat_api: bool,
}

impl LlamaCppProvider {
    /// Create a new LlamaCppProvider
    ///
    /// Looks for LLM_ENDPOINT env var first, then falls back to EMBEDDING_ENDPOINT
    /// with path conversion from /embedding to /completion
    pub fn new() -> Result<Self, LlmError> {
        let endpoint = Self::resolve_endpoint()?;
        let use_chat_api = endpoint.contains("/v1/chat/completions");

        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minute timeout for long generations
            .build()
            .map_err(|e| LlmError::ConnectionFailed(e.to_string()))?;

        tracing::info!("LlamaCppProvider initialized with endpoint: {}", endpoint);

        Ok(Self {
            client,
            endpoint,
            use_chat_api,
        })
    }

    fn resolve_endpoint() -> Result<String, LlmError> {
        // First try LLM_ENDPOINT
        if let Ok(endpoint) = env::var("LLM_ENDPOINT") {
            return Ok(endpoint);
        }

        // Fall back to EMBEDDING_ENDPOINT with path conversion
        if let Ok(embedding_endpoint) = env::var("EMBEDDING_ENDPOINT") {
            // Convert /embedding to /completion
            let completion_endpoint = if embedding_endpoint.contains("/embedding") {
                embedding_endpoint.replace("/embedding", "/completion")
            } else {
                format!("{}/completion", embedding_endpoint.trim_end_matches('/'))
            };
            return Ok(completion_endpoint);
        }

        Err(LlmError::NotConfigured(
            "LLM_ENDPOINT or EMBEDDING_ENDPOINT not set".to_string(),
        ))
    }

    /// Build prompt in instruction format for non-chat models
    fn build_instruction_prompt(system: &str, user: &str) -> String {
        format!(
            "<|system|>\n{}\n<|end|>\n<|user|>\n{}\n<|end|>\n<|assistant|>\n",
            system, user
        )
    }

    /// Generate using the /completion endpoint
    async fn generate_completion(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        config: &GenerationConfig,
    ) -> Result<String, LlmError> {
        let prompt = Self::build_instruction_prompt(system_prompt, user_prompt);

        let request = LlamaCppCompletionRequest {
            prompt,
            n_predict: config.max_tokens,
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

        let result: LlamaCppCompletionResponse = response
            .json()
            .await
            .map_err(|e| LlmError::ParseError(e.to_string()))?;

        Ok(result.content)
    }

    /// Generate using the /v1/chat/completions endpoint (OpenAI-compatible)
    async fn generate_chat(
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
}

#[async_trait]
impl LlmProvider for LlamaCppProvider {
    async fn generate(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        config: &GenerationConfig,
    ) -> Result<String, LlmError> {
        if self.use_chat_api {
            self.generate_chat(system_prompt, user_prompt, config).await
        } else {
            self.generate_completion(system_prompt, user_prompt, config)
                .await
        }
    }

    fn name(&self) -> &'static str {
        "llama-cpp"
    }

    async fn health_check(&self) -> Result<(), LlmError> {
        // Try /health endpoint first
        let health_url = self
            .endpoint
            .replace("/completion", "/health")
            .replace("/v1/chat/completions", "/health");

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
