use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fmt;

/// Configuration for LLM text generation
#[derive(Debug, Clone, Serialize)]
pub struct GenerationConfig {
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub stop_sequences: Option<Vec<String>>,
}

impl Default for GenerationConfig {
    fn default() -> Self {
        Self {
            max_tokens: Some(8192),
            temperature: Some(0.7),
            stop_sequences: None,
        }
    }
}

/// Error type for LLM operations
#[derive(Debug)]
pub enum LlmError {
    ConnectionFailed(String),
    RequestFailed(String),
    ParseError(String),
    Timeout,
    RateLimited,
    NotConfigured(String),
}

impl fmt::Display for LlmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LlmError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            LlmError::RequestFailed(msg) => write!(f, "Request failed: {}", msg),
            LlmError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            LlmError::Timeout => write!(f, "Request timed out"),
            LlmError::RateLimited => write!(f, "Rate limited"),
            LlmError::NotConfigured(msg) => write!(f, "Not configured: {}", msg),
        }
    }
}

impl std::error::Error for LlmError {}

/// Core trait for LLM providers - enables swapping between different backends
#[async_trait]
pub trait LlmProvider: Send + Sync {
    /// Generate a complete response (non-streaming)
    async fn generate(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        config: &GenerationConfig,
    ) -> Result<String, LlmError>;

    /// Get provider name for logging/debugging
    fn name(&self) -> &'static str;

    /// Check if provider is available/healthy
    async fn health_check(&self) -> Result<(), LlmError>;
}

/// Message format for chat-style APIs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

impl ChatMessage {
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: "system".to_string(),
            content: content.into(),
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: "user".to_string(),
            content: content.into(),
        }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: "assistant".to_string(),
            content: content.into(),
        }
    }
}
