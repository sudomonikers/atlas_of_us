pub mod common;
pub mod domains;

use axum::{
    response::Json,
    routing::{get, post, put},
    Router,
    http::{
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
        HeaderValue, Method,
    },
    middleware::{self},
};
use tower_http::cors::CorsLayer;
use neo4rs::*;
use dotenvy::dotenv;
use serde_json::json;
use domains::auth::{login, signup, healthcheck, jwt_auth_middleware};


#[tokio::main] 
async fn main() {
    // Load environment variables from .env file
    dotenv().ok();

    let config: Config = ConfigBuilder::default()
        .uri(std::env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()))
        .user(std::env::var("NEO4J_USERNAME").unwrap_or_else(|_| "neo4j".to_string()))
        .password(std::env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo4j".to_string()))
        .db(std::env::var("NEO4J_DATABASE").unwrap_or_else(|_| "neo4j".to_string()))
        .fetch_size(500)
        .max_connections(10)
        .build()
        .unwrap();
   let graph: Graph = Graph::connect(config).await.unwrap();

    let cors: CorsLayer = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    // Placeholder handlers - these will be implemented later
    let placeholder_handler = || async { Json(json!({"message": "Handler not implemented yet"})) };

    // Create secure routes with JWT middleware
    let secure_routes = Router::new()
        // Helper routes
        .route("/api/secure/helper/s3-object", get(placeholder_handler))
        .route("/api/secure/helper/s3-upload", post(placeholder_handler))
        .route("/api/secure/helper/embedding", post(placeholder_handler))

        // Graph management routes
        .route("/api/secure/graph/get-nodes", get(placeholder_handler))
        .route("/api/secure/graph/get-node-with-relationships-by-search-term", get(placeholder_handler))
        .route("/api/secure/graph/create-node", post(placeholder_handler))
        .route("/api/secure/graph/update-node", put(placeholder_handler))
        .route("/api/secure/graph/create-relationship", post(placeholder_handler))
        .route("/api/secure/graph/update-relationship", put(placeholder_handler))
        .route("/api/secure/graph/similar-nodes", post(placeholder_handler))

        // Profile routes
        .route("/api/secure/profile/user-profile/{username}", get(placeholder_handler))
        .route_layer(middleware::from_fn(jwt_auth_middleware));

    let app: Router = Router::new()
        // Swagger documentation route
        .route("/swagger/{*path}", get(placeholder_handler))
        
        // Base API routes (no authentication required)
        .route("/api/", get(healthcheck))
        .route("/api/sign-up", post(signup))
        .route("/api/login", post(login))
        .merge(secure_routes)
        .layer(cors)
        .with_state(graph);

    println!("🚀 Server started successfully");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}