//the Atlas of Us job worker. The api queues slow work on SQS, each module that reacts to events has a queue of them, and
//Lambda invokes this with one record at a time from any of those queues
mod bedrock;
mod events;
mod ideas;
mod jobs;

use std::{env, io::IsTerminal};

use neo4rs::Graph;

//the queue the api puts jobs on (infrastructure/jobs_lambda.tf). Every other queue carries events from the bus
const JOBS_QUEUE: &str = "atlas-jobs";

//a record is a job or an event depending on the queue it came from, the last part of its eventSourceARN
async fn run(graph: &Graph, record: &serde_json::Value) {
    let queue = record["eventSourceARN"].as_str().and_then(|arn| arn.rsplit(':').next()).unwrap_or_default();
    let body = record["body"].as_str().unwrap_or_default();
    if queue == JOBS_QUEUE {
        jobs::handle(graph, body).await;
    } else {
        events::handle(graph, queue, body).await;
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

    //each record's body is one job or event
    lambda_runtime::run(lambda_runtime::service_fn(|event: lambda_runtime::LambdaEvent<serde_json::Value>| {
        let graph = graph.clone();
        async move {
            for record in event.payload["Records"].as_array().into_iter().flatten() {
                run(&graph, record).await;
            }
            Ok::<(), lambda_runtime::Error>(())
        }
    })).await.unwrap();
}
