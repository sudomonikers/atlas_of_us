use std::env;

/// Application configuration loaded from environment variables
#[derive(Debug, Clone)]
pub struct Config {
    /// Neo4j connection URI
    pub neo4j_uri: String,
    /// Neo4j username
    pub neo4j_user: String,
    /// Neo4j password
    pub neo4j_password: String,
    /// Embedding service endpoint
    pub embedding_endpoint: String,
    /// LLM API endpoint (optional, uses Anthropic API if not set)
    pub llm_endpoint: Option<String>,
    /// Anthropic API key for Claude
    pub anthropic_api_key: Option<String>,
    /// SQS queue URL for this worker
    pub queue_url: String,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            neo4j_uri: env::var("NEO4J_URI")
                .map_err(|_| ConfigError::MissingVar("NEO4J_URI"))?,
            neo4j_user: env::var("NEO4J_USER")
                .map_err(|_| ConfigError::MissingVar("NEO4J_USER"))?,
            neo4j_password: env::var("NEO4J_PASSWORD")
                .map_err(|_| ConfigError::MissingVar("NEO4J_PASSWORD"))?,
            embedding_endpoint: env::var("EMBEDDING_ENDPOINT")
                .map_err(|_| ConfigError::MissingVar("EMBEDDING_ENDPOINT"))?,
            llm_endpoint: env::var("LLM_ENDPOINT").ok(),
            anthropic_api_key: env::var("ANTHROPIC_API_KEY").ok(),
            queue_url: env::var("QUEUE_URL")
                .map_err(|_| ConfigError::MissingVar("QUEUE_URL"))?,
        })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Missing required environment variable: {0}")]
    MissingVar(&'static str),
}
