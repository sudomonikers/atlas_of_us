pub mod common;
pub mod config;
pub mod domains;
pub mod error;
pub mod router;

use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use dotenvy::dotenv;
use neo4rs::*;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()))
        .init();

    tracing::info!("Starting Atlas of Us REST API");

    // Install TLS crypto provider
    let _ = rustls::crypto::ring::default_provider().install_default();

    // Load environment variables
    dotenv().ok();

    // Connect to Neo4j
    let graph = create_neo4j_connection();

    // Configure CORS
    let cors = create_cors_layer();

    // Create router with all routes
    let app = router::create_router(graph, cors);

    // Start server
    tracing::info!("Server listening on port 8000");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn create_neo4j_connection() -> Graph {
    let config: Config = ConfigBuilder::default()
        .uri(std::env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()))
        .user(std::env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string()))
        .password(std::env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo4j".to_string()))
        .db(std::env::var("NEO4J_DATABASE").unwrap_or_else(|_| "neo4j".to_string()))
        .fetch_size(500)
        .max_connections(10)
        .build()
        .expect("Failed to build Neo4j config");

    tracing::info!("Attempting to connect to Neo4j...");
    Graph::connect(config).expect("Failed to connect to Neo4j")
}

fn create_cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(
            std::env::var("ALLOWED_ORIGIN")
                .expect("ALLOWED_ORIGIN environment variable not set")
                .parse::<HeaderValue>()
                .expect("Invalid ALLOWED_ORIGIN value"),
        )
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE])
}
