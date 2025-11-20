pub mod common;
pub mod domains;

use axum::{
    Router,
    http::{
        HeaderValue, Method,
        header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    },
    middleware::{self},
    response::Json,
    routing::{get, post, put},
};
use common::handlers::{create_embedding_from_text, return_s3_object, upload_s3_object};
use common::logging_middleware::logging_middleware;
use domains::auth::{healthcheck, jwt_auth_middleware, login, signup};
use domains::profile::handlers::get_user_profile;
use domains::graph::handlers::{
    get_nodes, get_node_with_relationships_by_search_term, create_node, create_relationship,
    update_node, update_relationship, get_similar_nodes, get_domain
};
use dotenvy::dotenv;
use neo4rs::*;
use serde_json::json;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "info".to_string())
        )
        .init();

    tracing::info!("Starting Atlas of Us REST API");
    
    // Install rustls crypto provider
    let _ = rustls::crypto::ring::default_provider().install_default();

    dotenv().ok();

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
    let graph: Graph = Graph::connect(config).expect("Failed to connect to Neo4j");

    let cors: CorsLayer = CorsLayer::new()
        .allow_origin(
            std::env::var("ALLOWED_ORIGIN")
                .expect("ALLOWED_ORIGIN environment variable not set")
                .parse::<HeaderValue>()
                .expect("Invalid ALLOWED_ORIGIN value"),
        )
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE, Method::OPTIONS])
        .allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    // Placeholder handlers - these will be implemented later
    let placeholder_handler = || async { Json(json!({"message": "Handler not implemented yet"})) };

    //Swagger routes
    let swagger_documentation_routes: Router<Graph> =
        Router::new().route("/swagger/{*path}", get(placeholder_handler));

    // Auth routes
    let auth_routes: Router<Graph> = Router::new()
        .route("/api/healthcheck", get(healthcheck))
        .route("/api/register", post(signup))
        .route("/api/login", post(login));

    //Helper routes
    let helper_routes: Router<Graph> = Router::new()
        .route("/api/secure/helper/s3-object", get(return_s3_object))
        .route("/api/secure/helper/s3-upload", post(upload_s3_object))
        .route(
            "/api/secure/helper/embedding",
            post(create_embedding_from_text),
        )
        .route_layer(middleware::from_fn(jwt_auth_middleware));

    // Graph management routes
    let graph_management_routes: Router<Graph> = Router::new()
        .route("/api/secure/graph/get-nodes", get(get_nodes))
        .route(
            "/api/secure/graph/get-node-with-relationships-by-search-term",
            get(get_node_with_relationships_by_search_term),
        )
        .route("/api/secure/graph/create-node", post(create_node))
        .route("/api/secure/graph/update-node", put(update_node))
        .route("/api/secure/graph/create-relationship", post(create_relationship))
        .route("/api/secure/graph/update-relationship", put(update_relationship))
        .route("/api/secure/graph/similar-nodes", post(get_similar_nodes))
        .route("/api/secure/graph/domain", get(get_domain))
        .route_layer(middleware::from_fn(jwt_auth_middleware));

    let profile_routes: Router<Graph> = Router::new()
        .route("/api/secure/profile/user-profile/{username}", get(get_user_profile))
        .route_layer(middleware::from_fn(jwt_auth_middleware));
    
    let app: Router = Router::new()
        .merge(swagger_documentation_routes)
        .merge(auth_routes)
        .merge(helper_routes)
        .merge(graph_management_routes)
        .merge(profile_routes)
        .layer(middleware::from_fn(logging_middleware))
        .layer(cors)
        .with_state(graph);

    tracing::info!("Server listening on port 8000");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
