mod state;
mod helpers;

mod domains;
mod auth;
mod evidence;
mod feedback;
mod admin;
mod profile;

use axum::{
    Json, Router,
    extract::{MatchedPath, Request},
    response::{IntoResponse, Response},
    routing::get,
};
use serde_json::json;
use neo4rs::Graph;
use std::{env, io::IsTerminal, time::Duration};
use tower_http::{
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, RequestId, SetRequestIdLayer},
    trace::TraceLayer,
};
use tracing::Span;

use atlas_shared::{bedrock, events};
use domains::{personality, physical, skills, topics};
use state::AppState;

#[tokio::main]
async fn main() {
    //logs go to stdout, which lambda sends to cloudwatch and kubernetes to its log collector. Readable text in a
    //terminal, and json lines everywhere else so their fields can be searched. RUST_LOG overrides the level, e.g. RUST_LOG=debug
    let logs = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()));
    if std::io::stdout().is_terminal() {
        logs.init();
    } else {
        logs.json().flatten_event(true).init();
    }

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

    let aws = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

    //slow work like personality scoring is queued for atlas-jobs
    let jobs_queue = env::var("JOBS_QUEUE_URL").ok().map(|url| (aws_sdk_sqs::Client::new(&aws), url));

    //create state every route can grab from
    let state = AppState {
        graph,
        s3: aws_sdk_s3::Client::new(&mail_config),
        ses: aws_sdk_sesv2::Client::new(&mail_config),
        jobs_queue,
        bus: env::var("EVENT_BUS_NAME").ok().map(|name| events::Bus::new(&aws, name)),
        bedrock: aws_sdk_bedrockruntime::Client::new(&aws),
        evidence_bucket: env::var("EVIDENCE_BUCKET").ok(),
    };

    // build our application 
    let app = Router::new()
        .nest("/api/auth", auth::router())
        .nest("/api/personality", personality::router())
        .nest("/api/topics", topics::router())
        .nest("/api/skills", skills::router())
        .nest("/api/physical", physical::router())
        .nest("/api/evidence", evidence::router())
        .nest("/api/feedback", feedback::router())
        .nest("/api/admin", admin::router(state.clone()))
        .nest("/api/profiles", profile::router())
        .route("/share/{username}", get(profile::share_page))
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(TraceLayer::new_for_http()
            .make_span_with(request_span)
            .on_request(|req: &Request, _: &Span| {
                tracing::info!("started");
                tracing::debug!(path = req.uri().path(), "request path"); //the route hides usernames and ids, which can help when debugging
            })
            .on_response(|res: &Response, latency: Duration, _: &Span| {
                tracing::info!(status = res.status().as_u16(), latency_ms = latency.as_millis() as u64, "finished");
            }))
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
        //added after the layers so it isn't logged: load balancers and kubernetes probes hit it every few seconds
        .route("/api", get(health_check))
        .with_state(state);

    //lambda sets AWS_LAMBDA_RUNTIME_API, otherwise run as a normal server
    if env::var("AWS_LAMBDA_RUNTIME_API").is_ok() {
        lambda_http::run(app).await.unwrap();
        return;
    }

    // listen globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    tracing::info!("Server started successfully at 0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}

//the request's id, kept from an x-request-id header if the caller sent one, and its route rather than its path, so
//requests group by endpoint and usernames and ids stay out of the logs. Unmatched requests log their path instead
fn request_span(req: &Request) -> Span {
    let id = req.extensions().get::<RequestId>().and_then(|id| id.header_value().to_str().ok()).unwrap_or_default();
    let route = req.extensions().get::<MatchedPath>().map_or(req.uri().path(), |p| p.as_str());
    tracing::info_span!("request", id, method = %req.method(), route)
}

async fn health_check() -> impl IntoResponse {
    let json_response = json!({
        "status": "ok",
        "message": "Api Healthy!"
    });
    Json(json_response)
}
