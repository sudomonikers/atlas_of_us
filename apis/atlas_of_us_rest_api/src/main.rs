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
use domains::auth::{healthcheck, jwt_auth_middleware, login, signup};
use domains::profile::handlers::get_user_profile;
use dotenvy::dotenv;
use neo4rs::*;
use serde_json::json;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Install rustls crypto provider
    let _ = rustls::crypto::ring::default_provider().install_default();

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
        .allow_origin(
            std::env::var("ALLOWED_ORIGIN")
                .unwrap()
                .parse::<HeaderValue>()
                .unwrap(),
        )
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
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
        // Graph management routes
        .route("/api/secure/graph/get-nodes", get(placeholder_handler))
        .route(
            "/api/secure/graph/get-node-with-relationships-by-search-term",
            get(placeholder_handler),
        )
        .route("/api/secure/graph/create-node", post(placeholder_handler))
        .route("/api/secure/graph/update-node", put(placeholder_handler))
        .route(
            "/api/secure/graph/create-relationship",
            post(placeholder_handler),
        )
        .route(
            "/api/secure/graph/update-relationship",
            put(placeholder_handler),
        )
        .route("/api/secure/graph/similar-nodes", post(placeholder_handler))
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
        .layer(cors)
        .with_state(graph);

    println!("Server listening on port 8000");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
