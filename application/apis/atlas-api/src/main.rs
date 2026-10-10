mod error;
mod state;

//one module + router per graph layer (see documentation/data_model/data_model.md)
mod personality;
mod physical;
mod skills;
mod topics;

use axum::{Json, Router, response::IntoResponse, routing::get};
use serde_json::json;
use axum_prometheus::PrometheusMetricLayer;
use neo4rs::{Graph,query};
use std::env;

use state::AppState;

#[tokio::main]
async fn main() {
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

    // build our application 
    let app = Router::new()
        .route("/api", get(health_check))
        .route("/metrics", get(|| async move { metric_handle.render() }))
        .nest("/api/personality", personality::router())
        .nest("/api/topics", topics::router())
        .nest("/api/skills", skills::router())
        .nest("/api/physical", physical::router())
        .layer(prometheus_layer)
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
