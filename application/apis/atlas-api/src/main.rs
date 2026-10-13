mod state;

//one module + router per graph layer (see documentation/data_model/data_model.md)
mod personality;
mod physical;
mod skills;
mod topics;
mod auth;
mod feedback;

use axum::{
    Json, Router,
    http::{HeaderValue, Method, header::{AUTHORIZATION, CONTENT_TYPE}},
    response::IntoResponse,
    routing::get,
};
use serde_json::json;
use axum_prometheus::PrometheusMetricLayer;
use neo4rs::{Graph,query};
use std::env;
use tower_http::cors::CorsLayer;

use state::AppState;

#[tokio::main]
async fn main() {
    //logs go to stdout. RUST_LOG overrides the level, e.g. RUST_LOG=debug
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    //collect http metrics with prometheus
    let (prometheus_layer, metric_handle) = PrometheusMetricLayer::pair(); 

    //instantiate neo4j connector
   let graph = Graph::new(
        env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()),
        env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string()),
        env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo".to_string())
    ).unwrap();
    assert!(graph.run(query("RETURN 1")).await.is_ok());

    //create state every route can grab from
    let state = AppState { graph };

    //let the UI call us from another origin. CORS_ORIGINS is a comma separated list, defaulting to the vite dev server
    let origins: Vec<HeaderValue> = env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:5173".to_string())
        .split(',')
        .map(|origin| origin.trim().parse().expect("CORS_ORIGINS contains an invalid origin"))
        .collect();
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

    // build our application 
    let app = Router::new()
        .route("/api", get(health_check))
        .route("/metrics", get(|| async move { metric_handle.render() }))
        .nest("/api/auth", auth::router())
        .nest("/api/personality", personality::router())
        .nest("/api/topics", topics::router())
        .nest("/api/skills", skills::router())
        .nest("/api/physical", physical::router())
        .nest("/api/feedback", feedback::router())
        .layer(prometheus_layer)
        .layer(cors)
        .with_state(state);

    // listen globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server started successfully at 0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Api Healthy!"
    });
    Json(json_response)
}
