mod state;

//one module + router per graph layer (see documentation/data_model/data_model.md)
mod personality;
mod physical;
mod skills;
mod topics;
mod auth;
mod feedback;
mod admin;

use axum::{
    Json, Router,
    response::IntoResponse,
    routing::get,
};
use serde_json::json;
use neo4rs::Graph;
use std::env;

use state::AppState;

#[tokio::main]
async fn main() {
    //logs go to stdout. RUST_LOG overrides the level, e.g. RUST_LOG=debug
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    //instantiate neo4j connector
   let graph = Graph::new(
        env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()),
        env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string()),
        env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo".to_string())
    ).unwrap();

    //mail lives in us-east-1 (SES receiving, the mail bucket) wherever the api runs
    let mail_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(aws_config::Region::new("us-east-1"))
        .load()
        .await;

    //create state every route can grab from
    let state = AppState {
        graph,
        s3: aws_sdk_s3::Client::new(&mail_config),
        ses: aws_sdk_sesv2::Client::new(&mail_config),
    };

    // build our application 
    let app = Router::new()
        .route("/api", get(health_check))
        .nest("/api/auth", auth::router())
        .nest("/api/personality", personality::router())
        .nest("/api/topics", topics::router())
        .nest("/api/skills", skills::router())
        .nest("/api/physical", physical::router())
        .nest("/api/feedback", feedback::router())
        .nest("/api/admin", admin::router(state.clone()))
        .with_state(state);

    //lambda sets AWS_LAMBDA_RUNTIME_API, otherwise run as a normal server
    if env::var("AWS_LAMBDA_RUNTIME_API").is_ok() {
        lambda_http::run(app).await.unwrap();
        return;
    }

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
