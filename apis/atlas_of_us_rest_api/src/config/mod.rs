use std::env;
use std::sync::OnceLock;

/// Centralized application configuration loaded from environment variables.
/// Uses OnceLock to ensure configuration is loaded only once and shared across threads.
#[derive(Debug, Clone)]
pub struct AppConfig {
    // Neo4j Database
    pub neo4j_uri: String,
    pub neo4j_user: String,
    pub neo4j_password: String,
    pub neo4j_database: String,

    // Server
    pub server_port: u16,
    pub allowed_origin: String,

    // Authentication
    pub jwt_secret: String,

    // AWS
    pub aws_region: String,
    pub s3_bucket: Option<String>,

    // External Services
    pub embedding_endpoint: String,
    pub llm_endpoint: Option<String>,
    pub image_gen_endpoint: Option<String>,
    pub image_gen_api_key: Option<String>,
}

static CONFIG: OnceLock<AppConfig> = OnceLock::new();

impl AppConfig {
    /// Load configuration from environment variables.
    /// This should be called once at application startup.
    /// Returns a static reference to the configuration.
    pub fn load() -> Result<&'static AppConfig, String> {
        // Build the config first, then store it
        let config = AppConfig {
            // Neo4j - with sensible defaults for local development
            neo4j_uri: env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()),
            neo4j_user: env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string()),
            neo4j_password: env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo4j".to_string()),
            neo4j_database: env::var("NEO4J_DATABASE").unwrap_or_else(|_| "neo4j".to_string()),

            // Server
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .unwrap_or(8000),
            allowed_origin: env::var("ALLOWED_ORIGIN")
                .map_err(|_| "ALLOWED_ORIGIN environment variable not set".to_string())?,

            // Authentication - required in production
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string()),

            // AWS
            aws_region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-2".to_string()),
            s3_bucket: env::var("S3_BUCKET").ok(),

            // External Services
            embedding_endpoint: env::var("EMBEDDING_ENDPOINT")
                .map_err(|_| "EMBEDDING_ENDPOINT environment variable not set".to_string())?,
            llm_endpoint: env::var("LLM_ENDPOINT").ok(),
            image_gen_endpoint: env::var("IMAGE_GEN_ENDPOINT").ok(),
            image_gen_api_key: env::var("IMAGE_GEN_API_KEY").ok(),
        };

        // Store it in OnceLock (get_or_init doesn't fail)
        Ok(CONFIG.get_or_init(|| config))
    }

    /// Get the configuration. Panics if configuration hasn't been loaded.
    /// Use this after `load()` has been called in main.
    pub fn get() -> &'static AppConfig {
        CONFIG
            .get()
            .expect("Configuration not initialized. Call AppConfig::load() first.")
    }
}
