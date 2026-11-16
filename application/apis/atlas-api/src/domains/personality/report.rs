//the written report on all of a person's traits, at the top of My Personality and on their profile. It's its own thing,
//apart from scoring: written only when the person asks for it, once they've finished and been scored on every scenario,
//by atlas-jobs' personality_report job. Scoring or an accepted contest changes their scores after it's written, which
//makes it stale, so they can ask for it again. See "Report" in documentation/architecture/personality.md
use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, credits::{refund, spend}, helpers::jobs::queue, state::AppState};

use super::{FINISHED, STALE_JOB_MINUTES, internal};

pub fn router() -> Router<AppState> {
    Router::new().route("/report", get(get_report).post(ask))
}

//how long a report asked for is taken to be on its way. A job that hasn't written it by then has failed
const WRITING_MINUTES: i64 = 5;

//the report's properties on the Person, which credits are spent and given back by
const FEATURE: &str = "personalityReport";

#[derive(Deserialize)]
struct Kept {
    report: Option<String>,
    written_at: Option<String>,
    stale: bool,
    writing: bool,
    asked: bool, //whether it was asked for since it was last written
    enough: bool,
    scoring: bool,
    charged: bool, //whether a credit was spent on the last ask, and not given back yet
}

//the report as it's kept on the person, and whether they can have one. A credit spent on one that couldn't be written
//goes back here, which covers a job that never ran as well as one that failed. Stale once their scores were worked out after it
//was written. Enough once they've finished every scenario and every answer is scored
async fn kept(graph: &Graph, person_id: &str) -> Result<Kept, (StatusCode, String)> {
    let mut rows = graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})
        WITH p, p.personalityReportAskedAt AS asked,
             coalesce(datetime(p.personalityReportAt), datetime({{year: 1}})) AS written,
             coalesce(p.personalityReportFailedAt, datetime({{year: 1}})) AS failed
        RETURN p.personalityReport AS report, p.personalityReportAt AS written_at,
               coalesce(p.personalityScoredAt > written, false) AS stale,
               coalesce(asked > written AND asked > failed AND asked > datetime() - duration({{minutes: $writingMinutes}}), false) AS writing,
               coalesce(asked > written, false) AS asked,
               NOT EXISTS {{ MATCH (s:PersonalityScenario) WHERE NOT ({FINISHED}) }}
                   AND NOT EXISTS {{ MATCH (p)-[a:ANSWERED]->() WHERE a.scoring IS NULL }} AS enough,
               EXISTS {{
                   MATCH (p)-[:HAS_JOB]->(j:JobRunning {{kind: 'personality_scoring'}})
                   WHERE j.startedAt > datetime() - duration({{minutes: $staleMinutes}})
               }} AS scoring,
               coalesce(p.personalityReportCharged, false) AS charged
    "))
        .param("personId", person_id)
        .param("writingMinutes", WRITING_MINUTES)
        .param("staleMinutes", STALE_JOB_MINUTES)
    ).await.map_err(internal)?;
    let mut kept = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?
        .to::<Kept>().map_err(internal)?;
    if kept.charged && kept.asked && !kept.writing {
        refund(graph, person_id, FEATURE).await.map_err(internal)?;
        kept.charged = false;
    }
    Ok(kept)
}

//the report, and where it's at
#[derive(Serialize)]
pub struct ReportState {
    report: Option<serde_json::Value>, //headline, overview, domains, strengths and watch_outs
    written_at: Option<String>,
    stale: bool, //whether their scores have changed since it was written
    writing: bool, //whether it's being written now
    failed: bool, //whether the last one asked for couldn't be written
    enough: bool, //whether they've finished and been scored on every scenario, and no scoring is running
}

fn report_state(kept: Kept) -> Result<ReportState, (StatusCode, String)> {
    Ok(ReportState {
        report: kept.report.as_deref().map(serde_json::from_str).transpose().map_err(internal)?,
        failed: kept.asked && !kept.writing,
        stale: kept.stale,
        writing: kept.writing,
        written_at: kept.written_at,
        enough: kept.enough && !kept.scoring,
    })
}

//the logged in user's report, and where it's at
async fn get_report(State(state): State<AppState>, user: AuthUser) -> Result<Json<ReportState>, (StatusCode, String)> {
    Ok(Json(report_state(kept(&state.graph, &user.person_id).await?)?))
}

//what atlas-jobs' personality_report job is sent
#[derive(Serialize)]
struct ReportJob<'a> {
    person_id: &'a str,
}

//asks for the logged in user's report to be written, for a credit, unless it's being written already or it's up to date
async fn ask(State(state): State<AppState>, user: AuthUser) -> Result<Json<ReportState>, (StatusCode, String)> {
    let current = kept(&state.graph, &user.person_id).await?;
    if current.scoring {
        return Err((StatusCode::BAD_REQUEST, "I'm still scoring your answers. Ask again once that's done.".to_string()));
    }
    if !current.enough {
        return Err((StatusCode::BAD_REQUEST, "Finish every chapter and have me score them first, and I'll write it up.".to_string()));
    }
    if current.writing || (current.report.is_some() && !current.stale) {
        return Ok(Json(report_state(current)?));
    }

    let person = user.person_id.as_str();
    spend(&state, person, FEATURE).await?;
    if let Err(e) = queue(&state, "personality_report", ReportJob { person_id: person }).await {
        tracing::error!("couldn't queue the personality report: {e}");
        state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.personalityReportFailedAt = datetime()").param("personId", person))
            .await.map_err(internal)?;
        refund(&state.graph, person, FEATURE).await.map_err(internal)?;
    }
    Ok(Json(report_state(kept(&state.graph, person).await?)?))
}
