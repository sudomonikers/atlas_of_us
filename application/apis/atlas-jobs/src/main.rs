//the Atlas of Us job worker. The api queues slow work on SQS, and Lambda invokes this with one record at a time
mod personality_contest;
mod personality_report;
mod personality_scoring;

use std::{env, io::IsTerminal};

use neo4rs::Graph;
use serde::Deserialize;

//every kind of job, as the api sends it: {"kind": "personality_scoring", "job": {...}}
#[derive(Deserialize)]
#[serde(tag = "kind", content = "job", rename_all = "snake_case")]
enum Job {
    PersonalityScoring(personality_scoring::ScoringJob),
    PersonalityContest(personality_contest::ContestJob),
    PersonalityReport(personality_report::ReportJob),
}

//jobs handle their own failures, so a bad one is logged and never retried
async fn run(graph: &Graph, body: &str) {
    match serde_json::from_str::<Job>(body) {
        Ok(Job::PersonalityScoring(job)) => personality_scoring::run(graph, job).await,
        Ok(Job::PersonalityContest(job)) => personality_contest::run(graph, job).await,
        Ok(Job::PersonalityReport(job)) => personality_report::run(graph, job).await,
        Err(e) => tracing::error!("unreadable job: {e}"),
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

    //each record's body is one job
    lambda_runtime::run(lambda_runtime::service_fn(|event: lambda_runtime::LambdaEvent<serde_json::Value>| {
        let graph = graph.clone();
        async move {
            for record in event.payload["Records"].as_array().into_iter().flatten() {
                run(&graph, record["body"].as_str().unwrap_or_default()).await;
            }
            Ok::<(), lambda_runtime::Error>(())
        }
    })).await.unwrap();
}
