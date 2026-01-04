pub mod claude;
pub mod llama_cpp;
pub mod provider;

use claude::ClaudeProvider;
use llama_cpp::LlamaCppProvider;
use std::sync::Arc;

// Re-export commonly used types
pub use provider::{GenerationConfig, LlmError, LlmProvider};

/// Available LLM provider types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProviderType {
    LlamaCpp,
    Claude,
}

impl Default for ProviderType {
    fn default() -> Self {
        ProviderType::LlamaCpp
    }
}

/// Factory function to create an LLM provider instance
pub fn create_provider(provider_type: ProviderType) -> Result<Arc<dyn LlmProvider>, LlmError> {
    match provider_type {
        ProviderType::LlamaCpp => {
            let provider = LlamaCppProvider::new()?;
            Ok(Arc::new(provider))
        }
        ProviderType::Claude => {
            let provider = ClaudeProvider::new()?;
            Ok(Arc::new(provider))
        }
    }
}
