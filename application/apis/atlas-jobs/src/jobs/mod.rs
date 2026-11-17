//slow work the api hands to atlas-jobs. Each job carries everything it needs
use neo4rs::Graph;
use serde::Deserialize;
use serde_json::Value;

pub mod personality_contest;
pub mod personality_report;
pub mod personality_scoring;
pub mod abilities_summary;
pub mod overall_summary;

//every kind of job, as the api sends it: {"kind": "personality_scoring", "job": {...}}
#[derive(Deserialize)]
#[serde(tag = "kind", content = "job", rename_all = "snake_case")]
enum Job {
    PersonalityScoring(personality_scoring::ScoringJob),
    PersonalityContest(personality_contest::ContestJob),
    PersonalityReport(personality_report::ReportJob),
    AbilitiesSummary(abilities_summary::SummaryJob),
    OverallSummary(overall_summary::SummaryJob),
}

//handlers are picked by kind. Jobs handle their own failures, so a bad one is logged and never retried
pub async fn handle(graph: &Graph, job: Value) {
    match serde_json::from_value::<Job>(job) {
        Ok(Job::PersonalityScoring(job)) => personality_scoring::run(graph, job).await,
        Ok(Job::PersonalityContest(job)) => personality_contest::run(graph, job).await,
        Ok(Job::PersonalityReport(job)) => personality_report::run(graph, job).await,
        Ok(Job::AbilitiesSummary(job)) => abilities_summary::run(graph, job).await,
        Ok(Job::OverallSummary(job)) => overall_summary::run(graph, job).await,
        Err(e) => tracing::error!("unreadable job: {e}"),
    }
}

//marks a premium feature's write failed and gives back the credit spent on it, once. `feature` is the prefix of its
//properties on the Person, such as abilitiesSummary (see the api's credits module)
pub fn failed_query(feature: &str) -> String {
    format!("
        MATCH (p:Person {{id: $personId}})
        SET p.lock = true REMOVE p.lock
        SET p.{feature}FailedAt = datetime(),
            p.credits = coalesce(p.credits, 0) + CASE WHEN coalesce(p.{feature}Charged, false) THEN 1 ELSE 0 END,
            p.{feature}Charged = false
    ")
}
