//slow work the api queues on the atlas-jobs queue. Each message carries everything the job needs
use neo4rs::Graph;
use serde::Deserialize;

use crate::{personality_contest, personality_report, personality_scoring};

//every kind of job, as the api sends it: {"kind": "personality_scoring", "job": {...}}
#[derive(Deserialize)]
#[serde(tag = "kind", content = "job", rename_all = "snake_case")]
enum Job {
    PersonalityScoring(personality_scoring::ScoringJob),
    PersonalityContest(personality_contest::ContestJob),
    PersonalityReport(personality_report::ReportJob),
}

//handlers are picked by kind. Jobs handle their own failures, so a bad one is logged and never retried
pub async fn handle(graph: &Graph, body: &str) {
    match serde_json::from_str::<Job>(body) {
        Ok(Job::PersonalityScoring(job)) => personality_scoring::run(graph, job).await,
        Ok(Job::PersonalityContest(job)) => personality_contest::run(graph, job).await,
        Ok(Job::PersonalityReport(job)) => personality_report::run(graph, job).await,
        Err(e) => tracing::error!("unreadable job: {e}"),
    }
}
