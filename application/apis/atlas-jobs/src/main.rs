//the Atlas of Us job worker. Lambda invokes this asynchronously with one job from the api, or one event from a rule on the
//bus for a module that reacts to it
mod bedrock;
mod events;
mod ideas;
mod jobs;

use std::{env, io::IsTerminal};

use neo4rs::Graph;

//an event comes wrapped by its rule with the handler it's for (infrastructure/events.tf). Anything else is a job
async fn run(graph: &Graph, payload: serde_json::Value) {
    match payload["handler"].as_str() {
        Some(handler) => events::handle(graph, handler, payload["event"].clone()).await,
        None => jobs::handle(graph, payload).await,
    }
}

#[tokio::main]
async fn main() {
    //logs go to stdout, which lambda sends to cloudwatch. Readable text in a terminal, and json lines everywhere else so
    //their fields can be searched. RUST_LOG overrides the level, e.g. RUST_LOG=debug
    let logs = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()));
    if std::io::stdout().is_terminal() {
        logs.init();
    } else {
        logs.json().flatten_event(true).init();
    }

    let graph = Graph::new(
        env::var("NEO4J_URI").unwrap_or_else(|_| "127.0.0.1:7687".to_string()),
        env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string()),
        env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo".to_string())
    ).unwrap();

    lambda_runtime::run(lambda_runtime::service_fn(|event: lambda_runtime::LambdaEvent<serde_json::Value>| {
        let graph = graph.clone();
        async move {
            run(&graph, event.payload).await;
            Ok::<(), lambda_runtime::Error>(())
        }
    })).await.unwrap();
}
