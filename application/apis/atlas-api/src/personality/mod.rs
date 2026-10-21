use std::collections::HashMap;

use aws_sdk_sqs::error::DisplayErrorContext;
use axum::{Extension, Json, Router, extract::{Path, State}, http::StatusCode, response::Html, routing::{get, post, put}};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tower_http::request_id::RequestId;

use crate::{auth::AuthUser, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/traits", get(list_all_personality_traits))
        .route("/model", get(get_model))
        .route("/people/{person_id}/evidence", get(list_person_evidence))
        .route("/profiles/{username}", get(get_profile))
        .route("/answers", put(answer_question).delete(clear_answers))
        .route("/progress", get(get_user_scenario_progress))
        .route("/rescore", post(rescore_personality))
        .route("/scoring", get(get_scoring))
        .route("/contests", post(contest_evidence))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
    id: String,
    domain: String, //the PersonalityDomain's key, e.g. 'openness'
    average: Option<f64>, //everyone's mean value for the trait, 0 to 1. Missing until someone has been measured on it
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
            MATCH (d:PersonalityDomain)-[:HAS_FACET]->(p:PersonalityTrait)
            OPTIONAL MATCH (:Person)-[r:HAS_PERSONALITY_TRAIT]->(p)
            RETURN p.name AS name, p.description AS description, elementId(p) AS id, d.key AS domain,
                   avg(toFloat(r.value)) AS average
            ORDER BY name"
        )).await.map_err(internal)?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        traits.push(row.to::<PersonalityTrait>().map_err(internal)?);
    }
    Ok(Json(traits))
}

#[derive(Serialize, Deserialize)]
pub struct Interaction {
    name: String, //the other trait
    description: String,
}

#[derive(Serialize, Deserialize)]
pub struct DomainTrait {
    id: String,
    name: String,
    description: Option<String>,
    overview: Option<String>,
    high_good: Vec<String>, //where being high helps
    low_good: Vec<String>, //where being low helps
    high_watch: Vec<String>, //what to watch out for when high
    low_watch: Vec<String>, //what to watch out for when low
    interactions: Vec<Interaction>,
}

#[derive(Serialize, Deserialize)]
pub struct Domain {
    key: String,
    name: String,
    overview: Option<String>,
    high_good: Vec<String>, //where being high helps
    low_good: Vec<String>, //where being low helps
    high_watch: Vec<String>, //what to watch out for when high
    low_watch: Vec<String>, //what to watch out for when low
    traits: Vec<DomainTrait>,
}

#[derive(Serialize, Deserialize)]
pub struct Model {
    name: Option<String>,
    overview: Option<String>,
    history: Option<String>,
    limits: Option<String>,
    our_take: Option<String>,
    domains: Vec<Domain>,
}

//the personality model: what it is, where it came from and its limits, then every domain with its traits, each with
//what being high or low on it means and how it interacts with other traits
pub async fn get_model(State(state): State<AppState>) -> Result<Json<Model>, (StatusCode, String)> {
    //built inside out: each trait's interactions, then each domain's traits, then the domains
    let mut rows = state.graph.execute(query("
        MATCH (d:PersonalityDomain)
        OPTIONAL MATCH (d)-[:HAS_FACET]->(t:PersonalityTrait)
        OPTIONAL MATCH (t)-[r:INTERACTS_WITH]->(o:PersonalityTrait)
        WITH d, t, r, o ORDER BY o.name
        WITH d, t, collect(CASE WHEN o IS NULL THEN null ELSE {name: o.name, description: r.description} END) AS interactions
        ORDER BY t.name
        WITH d, collect(CASE WHEN t IS NULL THEN null ELSE {
            id: elementId(t), name: t.name, description: t.description, overview: t.overview,
            high_good: t.highGood, low_good: t.lowGood, high_watch: t.highWatch, low_watch: t.lowWatch,
            interactions: interactions
        } END) AS traits
        ORDER BY d.order
        WITH collect({
            key: d.key, name: d.name, overview: d.overview,
            high_good: d.highGood, low_good: d.lowGood, high_watch: d.highWatch, low_watch: d.lowWatch,
            traits: traits
        }) AS domains
        OPTIONAL MATCH (m:PersonalityModel)
        RETURN m.name AS name, m.overview AS overview, m.history AS history, m.limits AS limits, m.ourTake AS our_take, domains
    ")).await.map_err(internal)?;

    let row = rows.next().await.map_err(internal)?.ok_or_else(|| internal("no personality model row"))?;
    Ok(Json(row.to::<Model>().map_err(internal)?))
}

#[derive(Serialize, Deserialize)]
pub struct PersonTrait {
    id: String, //the PersonalityTrait's id
    name: String,
    description: Option<String>,
    domain: String, //the PersonalityDomain's key, e.g. 'openness'
    value: f64, //how strongly the person has the trait, 0 to 1
    confidence: f64, //how much evidence the value is based on, 0 to 1
}

#[derive(Deserialize)]
struct ProfileRow {
    username: String,
    first_name: String,
    public: bool,
    traits: Vec<PersonTrait>,
    report: Option<String>, //json, written by atlas-jobs once the person is fully scored
    report_at: Option<String>,
}

#[derive(Serialize)]
pub struct Profile {
    username: String,
    first_name: String,
    public: bool,
    traits: Vec<PersonTrait>,
    report: Option<serde_json::Value>, //the written report on all their traits, once they've finished every scenario
    report_at: Option<String>, //when it was last written
}

//someone's profile. Private ones are only seen by their owner, and look missing to everyone else
pub async fn get_profile(
    State(state): State<AppState>,
    user: Option<AuthUser>,
    Path(username): Path<String>,
) -> Result<Json<Profile>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {username: toLower($username)})
        WHERE coalesce(p.public, false) OR elementId(p) = $viewerId
        OPTIONAL MATCH (p)-[r:HAS_PERSONALITY_TRAIT]->(t:PersonalityTrait)<-[:HAS_FACET]-(d:PersonalityDomain)
        WITH p, r, t, d ORDER BY t.name
        RETURN p.username AS username, p.firstName AS first_name, coalesce(p.public, false) AS public,
            collect(CASE WHEN t IS NULL THEN null ELSE {
                id: elementId(t), name: t.name, description: t.description, domain: d.key, value: toFloat(r.value),
                confidence: toFloat(coalesce(r.confidence, 0))
            } END) AS traits, p.personalityReport AS report, p.personalityReportAt AS report_at
    ")
        .param("username", username)
        .param("viewerId", user.map(|u| u.person_id).unwrap_or_default())
    ).await.map_err(internal)?;

    let Some(row) = rows.next().await.map_err(internal)? else {
        return Err((StatusCode::NOT_FOUND, "This profile is private or doesn't exist.".to_string()));
    };
    let row = row.to::<ProfileRow>().map_err(internal)?;
    Ok(Json(Profile {
        report: row.report.as_deref().map(serde_json::from_str).transpose().map_err(internal)?,
        report_at: row.report_at,
        username: row.username,
        first_name: row.first_name,
        public: row.public,
        traits: row.traits,
    }))
}

//where share links and their preview image live
const SITE: &str = "https://atlas-of-us.com";

//the page a shared profile link opens, at /share/{username}. Sites like LinkedIn and X don't run javascript, so they'd only
//see the ui's bare index.html: this gives them a preview card, then sends people on to the profile itself. Only public
//profiles get their name and headline on it
pub async fn share_page(State(state): State<AppState>, Path(username): Path<String>) -> Result<Html<String>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {username: toLower($username)}) WHERE coalesce(p.public, false)
        RETURN p.firstName AS first_name, p.personalityReport AS report
    ")
        .param("username", username.as_str())
    ).await.map_err(internal)?;

    let (title, description) = match rows.next().await.map_err(internal)? {
        Some(row) => {
            let first_name = row.get::<String>("first_name").map_err(internal)?;
            let headline = row.get::<Option<String>>("report").map_err(internal)?
                .and_then(|r| serde_json::from_str::<serde_json::Value>(&r).ok())
                .and_then(|r| r["headline"].as_str().map(str::to_string));
            (format!("This Is {first_name}"), headline.unwrap_or_else(|| format!("See how {first_name} maps out on Atlas Of Us.")))
        }
        None => ("Atlas Of Us".to_string(), "Map your personality, one scenario at a time.".to_string()),
    };
    let (title, description, username) = (escape(&title), escape(&description), escape(&username));
    let url = format!("{SITE}/share/{username}");
    Ok(Html(format!(r#"<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title} | Atlas Of Us</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Atlas Of Us">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=/u/{username}">
</head>
<body><a href="/u/{username}">{title}</a></body>
</html>"#)))
}

fn escape(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&#39;")
}

#[derive(Deserialize)]
struct EvidenceRow {
    id: String,
    scenario: String,
    question: String,
    answer: String,
    reasoning: Option<String>,
    scoring: String, //json list of Shifts, written when the person was last scored
    contests: Option<String>, //json list of the person's contests of those Shifts
}

#[derive(Serialize)]
pub struct AnswerEvidence {
    id: String, //the ANSWERED relationship's id
    scenario: String, //the scenario's title
    question: String,
    answer: String,
    reasoning: Option<String>,
    shifts: Vec<Shift>, //how this answer moved each trait the last time the person was scored
    contests: Vec<serde_json::Value>, //each contest of a shift, oldest first, as atlas-jobs writes them
}

//every scored answer and how it moved the person's traits, so they can see what went into their scores. People can only see their own
pub async fn list_person_evidence(
    State(state): State<AppState>,
    user: AuthUser,
    Path(person_id): Path<String>,
) -> Result<Json<Vec<AnswerEvidence>>, (StatusCode, String)> {
    if person_id != user.person_id {
        return Err((StatusCode::FORBIDDEN, "You can only see what went into your own personality traits.".to_string()));
    }

    //grouped by the person, so there's one row if they exist (with nothing scored, an empty list) and none if they don't
    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        OPTIONAL MATCH (p)-[a:ANSWERED]->(q:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
        WHERE a.scoring IS NOT NULL
        WITH p, s, q, a ORDER BY s.name, q.order
        RETURN elementId(p) AS person_id, collect(CASE WHEN a IS NULL THEN null ELSE {
            id: elementId(a), scenario: s.title, question: q.prompt, answer: a.answer, reasoning: a.reasoning,
            scoring: a.scoring, contests: a.contests
        } END) AS answers
    ")
        .param("personId", person_id)
    ).await.map_err(internal)?;

    let Some(row) = rows.next().await.map_err(internal)? else {
        return Err((StatusCode::NOT_FOUND, "We couldn't find that person.".to_string()));
    };
    let answers = row.get::<Vec<EvidenceRow>>("answers").map_err(internal)?.into_iter().map(|a| Ok(AnswerEvidence {
        shifts: serde_json::from_str(&a.scoring).map_err(internal)?,
        contests: serde_json::from_str(a.contests.as_deref().unwrap_or("[]")).map_err(internal)?,
        id: a.id,
        scenario: a.scenario,
        question: a.question,
        answer: a.answer,
        reasoning: a.reasoning,
    })).collect::<Result<_, _>>()?;
    Ok(Json(answers))
}

#[derive(Serialize, Deserialize)]
pub struct ScenarioQuestion {
    id: String,
    key: String, //the prompt id in the scenario's script
    prompt: String,
}

const MAX_ANSWER_CHARS: usize = 2000;
const MAX_CONTEXT_CHARS: usize = 8000;
const MAX_CLOCK_SECONDS: i64 = 24 * 60 * 60;

#[derive(Deserialize)]
pub struct AnswerPayload {
    question_id: String,
    answer: String, //the picked choice, or the whole answer when the question has no choices
    reasoning: Option<String>, //why, in the user's words
    context: String, //the story the user saw just before the question, and the choices offered, for the scorer
    clock: Option<AnswerClock>, //only for answers given once a scenario's clock has started
    #[serde(default)]
    facets: Vec<String>, //the traits the question was written to draw out
}

//where the scenario's clock stood when the answer was given
#[derive(Deserialize)]
pub struct AnswerClock {
    seconds: i64, //how long the clock runs in total
    left: i64, //seconds left when answered, or when the clock stopped if it already had
    ran_out: bool, //the clock hit zero before the person finished
}

#[derive(Serialize, Deserialize)]
pub struct Answer {
    scenario: String,
    question_id: String,
    question_key: String,
    answer: String,
    reasoning: Option<String>,
    answered_date: String,
}

#[derive(Serialize)]
pub struct AnswerResponse {
    #[serde(flatten)]
    answer: Answer,
    scored: bool, //this answer finished the last unfinished scenario in its batch, or replayed one in a finished batch, so that batch is being scored
}

//saves the logged in user's answer, replacing any earlier answer to the same question.
//Answering the first question of a scenario starts a fresh run, so it first clears the rest of their answers to it: a
//replay down another branch, or one where the clock runs out sooner, would otherwise keep answers from the old run.
//Finishing every scenario in a batch, or replaying one in a finished batch, starts a scoring job for that batch
pub async fn answer_question(
    State(state): State<AppState>,
    user: AuthUser,
    Extension(request_id): Extension<RequestId>,
    Json(body): Json<AnswerPayload>,
) -> Result<Json<AnswerResponse>, (StatusCode, String)> {
    let too_long = |text: &str| text.chars().count() > MAX_ANSWER_CHARS;
    if too_long(&body.answer) || body.reasoning.as_deref().is_some_and(too_long) {
        return Err((StatusCode::BAD_REQUEST, format!("Answers can be up to {MAX_ANSWER_CHARS} characters. Try shortening yours.")));
    }
    if body.context.chars().count() > MAX_CONTEXT_CHARS {
        return Err((StatusCode::BAD_REQUEST, "That question's story is too long to save. Try reloading the page.".to_string()));
    }
    if body.clock.as_ref().is_some_and(|c| !(1..=MAX_CLOCK_SECONDS).contains(&c.seconds) || !(0..=c.seconds).contains(&c.left)) {
        return Err((StatusCode::BAD_REQUEST, "That scenario's clock doesn't look right. Try reloading the page.".to_string()));
    }

    //a first answer clears the old run's answers, each in its own transaction. Deleting a relationship locks the question
    //at its other end, and players share questions: one transaction locking several of them deadlocked against the
    //others when many people started the same scene at once
    tracing::debug!("answer {}: clearing an old run", user.person_id);
    state.graph.run(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion) WHERE elementId(q) = $questionId
          AND NOT EXISTS { (s)-[:HAS_QUESTION]->(earlier:PersonalityScenarioQuestion) WHERE earlier.order < q.order }
        MATCH (p)-[old:ANSWERED]->(other:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s) WHERE other <> q
        CALL (old) { DELETE old } IN TRANSACTIONS OF 1 ROW
    ")
        .param("personId", user.person_id.clone())
        .param("questionId", body.question_id.clone())
    ).await.map_err(internal)?;

    tracing::debug!("answer {}: saving", user.person_id);
    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion) WHERE elementId(q) = $questionId
        MERGE (p)-[a:ANSWERED]->(q)
        SET a.answer = $answer, a.reasoning = $reasoning, a.context = $context, a.answeredDate = datetime(), a.scoring = null, a.contests = null,
            a.clockSeconds = $clockSeconds, a.clockLeft = $clockLeft, a.clockRanOut = $clockRanOut, a.facets = $facets
        WITH s, q, a
        MATCH (s)-[:HAS_QUESTION]->(each:PersonalityScenarioQuestion)
        WITH s, q, a, max(each.order) AS last
        RETURN s.name AS scenario, elementId(s) AS scenario_id, elementId(q) AS question_id, q.key AS question_key,
               a.answer AS answer, a.reasoning AS reasoning, toString(a.answeredDate) AS answered_date,
               q.order = last AS last_question
    ")
        .param("personId", user.person_id.clone())
        .param("questionId", body.question_id)
        .param("answer", body.answer)
        .param("reasoning", body.reasoning)
        .param("context", body.context)
        //null clears the clock from an earlier answer to the same question
        .param("clockSeconds", body.clock.as_ref().map(|c| c.seconds))
        .param("clockLeft", body.clock.as_ref().map(|c| c.left))
        .param("clockRanOut", body.clock.as_ref().map(|c| c.ran_out))
        .param("facets", body.facets)
    ).await.map_err(internal)?;
    let Some(row) = rows.next().await.map_err(internal)? else {
        return Err((StatusCode::NOT_FOUND, "That question doesn't exist anymore. Try reloading the page.".to_string()));
    };
    let answer = row.to::<Answer>().map_err(internal)?;

    //only on the last question, so replaying a finished scenario doesn't rescore on its first answer.
    //Earlier questions can go unanswered, when a scenario's clock runs out before them
    let finished = row.get::<bool>("last_question").map_err(internal)?;
    let scenario_id = row.get::<String>("scenario_id").map_err(internal)?;
    //the stream holds its pooled connection until it's dropped, and what follows needs connections of its own
    drop(rows);
    let (batch, scored) = match finished {
        true => batch_finished(&state, &user.person_id, &scenario_id).await.map_err(internal)?,
        false => (0, false),
    };
    if scored {
        tracing::debug!("answer {}: batch {batch} is finished, starting scoring", user.person_id);
        start_scoring(&state, &user.person_id, Some(batch), &request_id).await.map_err(internal)?;
    }
    Ok(Json(AnswerResponse { answer, scored }))
}

pub async fn clear_answers(State(state): State<AppState>, user: AuthUser) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        OPTIONAL MATCH (p)-[a:ANSWERED|HAS_PERSONALITY_TRAIT]->()
        DELETE a
        WITH DISTINCT p
        REMOVE p.personalityReport, p.personalityReportAt
    ")
        .param("personId", user.person_id)
    ).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Serialize)]
pub struct Progress {
    answers: Vec<Answer>, //every question the logged in user has answered
    questions: HashMap<String, Vec<ScenarioQuestion>>, //every scenario's questions in the order they're asked, keyed by scenario name
}

pub async fn get_user_scenario_progress(State(state): State<AppState>, user: AuthUser) -> Result<Json<Progress>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person)-[a:ANSWERED]->(q:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
        WHERE elementId(p) = $personId
        RETURN s.name AS scenario, elementId(q) AS question_id, q.key AS question_key,
               a.answer AS answer, a.reasoning AS reasoning, toString(a.answeredDate) AS answered_date
        ORDER BY s.name, q.order
    ")
        .param("personId", user.person_id.clone())
    ).await.map_err(internal)?;
    let mut answers = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        answers.push(row.to::<Answer>().map_err(internal)?);
    }
    drop(rows); //the stream holds its pooled connection until it's dropped, and the next query needs one

    let mut rows = state.graph.execute(query("
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion)
        WITH s, q ORDER BY q.order
        RETURN s.name AS name, collect({id: elementId(q), key: q.key, prompt: q.prompt}) AS questions
    ")).await.map_err(internal)?;
    let mut questions = HashMap::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        questions.insert(row.get::<String>("name").map_err(internal)?, row.get("questions").map_err(internal)?);
    }
    Ok(Json(Progress { answers, questions }))
}

pub async fn rescore_personality(
    State(state): State<AppState>,
    user: AuthUser,
    Extension(request_id): Extension<RequestId>,
) -> Result<StatusCode, (StatusCode, String)> {
    start_scoring(&state, &user.person_id, None, &request_id).await.map_err(internal)?;
    Ok(StatusCode::ACCEPTED)
}

#[derive(Serialize)]
pub struct ScoringStatus {
    running: bool, //a scoring job for the logged in user hasn't finished yet
}

//whether a scoring job for the logged in user is still running
pub async fn get_scoring(State(state): State<AppState>, user: AuthUser) -> Result<Json<ScoringStatus>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        OPTIONAL MATCH (p:Person)-[:HAS_JOB]->(j:JobRunning {kind: 'personality_scoring'})
        WHERE elementId(p) = $personId AND j.startedAt > datetime() - duration({minutes: $staleMinutes})
        RETURN count(j) > 0 AS running
    ")
        .param("personId", user.person_id)
        .param("staleMinutes", STALE_JOB_MINUTES)
    ).await.map_err(internal)?;
    let running = match rows.next().await.map_err(internal)? {
        Some(row) => row.get::<bool>("running").map_err(internal)?,
        None => false,
    };
    Ok(Json(ScoringStatus { running }))
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContestKind {
    Explain, //the person explains why they answered as they did
    Wrong, //the person says the evidence misreads their answer
}

#[derive(Deserialize)]
pub struct ContestPayload {
    answer_id: String, //the ANSWERED relationship's id
    r#trait: String, //the trait whose evidence on that answer is contested
    kind: ContestKind,
    message: String,
}

//a contest of one piece of evidence, with every answer in its scene for atlas-jobs to review it against
#[derive(Serialize)]
struct ContestJob {
    person_id: String,
    request_id: String, //the request that queued it, so its logs and the job's can be found together
    answer_id: String,
    r#trait: String,
    kind: ContestKind,
    message: String,
    scene: Vec<ScoredAnswer>, //the scene's answers, ordered by question, each with its evidence and earlier contests
}

//so a run of contests can't run up the bedrock bill: how many can wait for review at once, and how many times one piece
//of evidence can be contested
const MAX_PENDING_CONTESTS: usize = 3;
const MAX_CONTESTS_PER_EVIDENCE: usize = 3;

//contests one piece of evidence on the logged in user's answer: they explain the answer, or say the evidence misread it.
//It's saved as pending on the answer, then atlas-jobs reviews it and either changes that evidence or rejects it with a reply
pub async fn contest_evidence(
    State(state): State<AppState>,
    user: AuthUser,
    Extension(request_id): Extension<RequestId>,
    Json(body): Json<ContestPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let message = body.message.trim().to_string();
    if message.is_empty() || message.chars().count() > MAX_ANSWER_CHARS {
        return Err((StatusCode::BAD_REQUEST, format!("Tell us what you think in up to {MAX_ANSWER_CHARS} characters.")));
    }

    //the answer's evidence and contests, and every answer in its scene in the order they were asked
    let mut rows = state.graph.execute(query("
        MATCH (p:Person)-[a:ANSWERED]->(:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
        WHERE elementId(p) = $personId AND elementId(a) = $answerId AND a.scoring IS NOT NULL
        MATCH (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion)<-[each:ANSWERED]-(p)
        WITH s, a, q, each, EXISTS {
            MATCH (p)-[:HAS_JOB]->(j:JobRunning {kind: 'personality_scoring'})
            WHERE j.startedAt > datetime() - duration({minutes: $staleMinutes})
        } AS scoring_running, [(p)-[other:ANSWERED]->() WHERE other.contests CONTAINS $pendingMark | other.contests] AS pending
        ORDER BY q.order
        RETURN a.scoring AS scoring, a.contests AS contests, toString(datetime()) AS now, scoring_running, pending, collect({
            id: elementId(each), scenario: s.title, prompt: q.prompt, real_life: coalesce(q.real_life, false),
            context: each.context, answer: each.answer, reasoning: each.reasoning,
            clock_seconds: each.clockSeconds, clock_left: each.clockLeft, clock_ran_out: each.clockRanOut, facets: each.facets,
            scoring: each.scoring, contests: each.contests
        }) AS scene
    ")
        .param("personId", user.person_id.clone())
        .param("answerId", body.answer_id.clone())
        .param("staleMinutes", STALE_JOB_MINUTES)
        .param("pendingMark", r#""status":"pending""#) //how a pending contest reads in the json, to find the answers holding one
    ).await.map_err(internal)?;
    let Some(row) = rows.next().await.map_err(internal)? else {
        return Err((StatusCode::NOT_FOUND, "We couldn't find that answer. Try reloading the page.".to_string()));
    };
    drop(rows); //the stream holds its pooled connection until it's dropped, and the next query needs one

    if row.get::<bool>("scoring_running").map_err(internal)? {
        return Err((StatusCode::CONFLICT, "Your results are being recalculated. Try again once that's done.".to_string()));
    }
    let shifts: Vec<Shift> = serde_json::from_str(&row.get::<String>("scoring").map_err(internal)?).map_err(internal)?;
    if !shifts.iter().any(|s| s.r#trait == body.r#trait) {
        return Err((StatusCode::NOT_FOUND, "That evidence isn't there anymore. Try reloading the page.".to_string()));
    }
    let old = row.get::<Option<String>>("contests").map_err(internal)?;
    let mut contests: Vec<serde_json::Value> = serde_json::from_str(old.as_deref().unwrap_or("[]")).map_err(internal)?;
    let on_this = contests.iter().filter(|c| c["trait"] == body.r#trait.as_str()).collect::<Vec<_>>();
    if on_this.iter().any(|c| c["status"] == "pending") {
        return Err((StatusCode::CONFLICT, "We're still looking at what you said about this one.".to_string()));
    }
    if on_this.len() >= MAX_CONTESTS_PER_EVIDENCE {
        return Err((StatusCode::TOO_MANY_REQUESTS, format!("You've contested this one {MAX_CONTESTS_PER_EVIDENCE} times already, so it stays as it is.")));
    }
    //the answers holding the person's pending contests, each a json list of contests
    let pending = row.get::<Vec<String>>("pending").map_err(internal)?.iter()
        .map(|list| serde_json::from_str::<Vec<serde_json::Value>>(list).map(|list| list.iter().filter(|c| c["status"] == "pending").count()))
        .sum::<Result<usize, _>>().map_err(internal)?;
    if pending >= MAX_PENDING_CONTESTS {
        return Err((StatusCode::TOO_MANY_REQUESTS, format!("We're still looking at {pending} of your contests. Try again once they're done.")));
    }
    contests.push(json!({
        "trait": body.r#trait, "kind": body.kind, "message": message, "at": row.get::<String>("now").map_err(internal)?, "status": "pending",
    }));
    let contests = serde_json::to_string(&contests).map_err(internal)?;

    //only if the contests haven't changed since they were read, so a double click can't open two
    let mut rows = state.graph.execute(query("
        MATCH ()-[a:ANSWERED]->() WHERE elementId(a) = $answerId AND coalesce(a.contests, '') = coalesce($old, '')
        SET a.contests = $contests
        RETURN count(a) AS saved
    ")
        .param("answerId", body.answer_id.clone())
        .param("old", old.clone())
        .param("contests", contests.clone())
    ).await.map_err(internal)?;
    let saved = rows.next().await.map_err(internal)?.map(|r| r.get::<i64>("saved")).transpose().map_err(internal)?;
    drop(rows);
    if saved != Some(1) {
        return Err((StatusCode::CONFLICT, "That answer just changed. Try reloading the page.".to_string()));
    }

    let job = ContestJob {
        person_id: user.person_id,
        request_id: request_id.header_value().to_str().unwrap_or_default().to_string(),
        answer_id: body.answer_id,
        r#trait: body.r#trait,
        kind: body.kind,
        message,
        scene: row.get("scene").map_err(internal)?,
    };
    if let Err(e) = queue(&state, "personality_contest", &job).await {
        //nothing will review it, so don't leave it pending
        state.graph.run(query("MATCH ()-[a:ANSWERED]->() WHERE elementId(a) = $answerId AND a.contests = $contests SET a.contests = $old")
            .param("answerId", job.answer_id)
            .param("contests", contests)
            .param("old", old)
        ).await.map_err(internal)?;
        return Err(internal(e));
    }
    Ok(StatusCode::NO_CONTENT)
}

//one piece of evidence about a trait
#[derive(Serialize, Deserialize)]
struct Shift {
    r#trait: String,
    evidence: String, //what in the answer shows it
    level: f64, //where the answer puts them, 0 (the low end) to 1 (the high end), 0.5 is typical
    weight: f64, //how strongly the answer shows it, 0 to 1
}

#[derive(Serialize, Deserialize)]
struct ScoredAnswer {
    id: String, //the ANSWERED relationship's id
    scenario: String,
    prompt: String,
    real_life: bool, //the question asks about the person's own life rather than the story
    context: Option<String>, //the story the person saw just before the question
    answer: String,
    reasoning: Option<String>,
    clock_seconds: Option<i64>,
    clock_left: Option<i64>,
    clock_ran_out: Option<bool>,
    facets: Vec<String>, //the traits the question was written to draw out
    scoring: Option<String>, //json list of the answer's Shifts. Only read for contests
    contests: Option<String>, //json list of the person's contests of the answer's Shifts
}

//scenarios are scored in batches of this many, by their order: the first six are a batch, then the next six, and so on.
//A third of the 18 scenes, so each call still reads across several scenes without reading everything
const BATCH_SIZE: i64 = 6;

//the scenario's batch, and whether the person has finished every scenario in it, meaning answered its last question
async fn batch_finished(state: &AppState, person_id: &str, scenario_id: &str) -> Result<(i64, bool), BoxError> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        MATCH (finished:PersonalityScenario) WHERE elementId(finished) = $scenarioId
        WITH p, finished.order / $batchSize AS batch
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(each:PersonalityScenarioQuestion) WHERE s.order / $batchSize = batch
        WITH p, batch, s, max(each.order) AS last
        OPTIONAL MATCH (s)-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {order: last})<-[a:ANSWERED]-(p)
        RETURN batch, count(s) = count(a) AS finished
    ")
        .param("personId", person_id)
        .param("scenarioId", scenario_id)
        .param("batchSize", BATCH_SIZE)
    ).await?;
    let row = rows.next().await?.ok_or("couldn't find the person or the scenario")?;
    Ok((row.get::<i64>("batch")?, row.get::<bool>("finished")?))
}

//a job left this long is treated as finished: atlas-jobs has 15 minutes, and the queue gives a job two tries
const STALE_JOB_MINUTES: i64 = 35;

//everything atlas-jobs needs to score a person, sent whole through the queue
#[derive(Serialize)]
struct ScoringJob {
    id: String, //the JobRunning node's id
    person_id: String,
    request_id: String, //the request that queued it, so its logs and the job's can be found together
    batches: Vec<Vec<ScoredAnswer>>, //each batch's answers, ordered by scenario, then question
}

type BoxError = Box<dyn std::error::Error + Send + Sync>;

//scores one batch, or every batch when it's None
async fn start_scoring(state: &AppState, person_id: &str, batch: Option<i64>, request_id: &RequestId) -> Result<(), BoxError> {
    let graph = &state.graph;
    tracing::debug!("scoring {person_id}: reading answers");
    let batches = {
        let mut rows = graph.execute(query("
            MATCH (p:Person)-[a:ANSWERED]->(q:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
            WHERE elementId(p) = $personId AND ($batch IS NULL OR s.order / $batchSize = $batch)
            WITH s, q, a ORDER BY s.order, q.order
            RETURN s.order / $batchSize AS batch, collect({
                id: elementId(a), scenario: s.title, prompt: q.prompt, real_life: coalesce(q.real_life, false),
                context: a.context, answer: a.answer, reasoning: a.reasoning,
                clock_seconds: a.clockSeconds, clock_left: a.clockLeft, clock_ran_out: a.clockRanOut, facets: a.facets,
                contests: a.contests
            }) AS answers
            ORDER BY batch
        ")
            .param("personId", person_id)
            .param("batch", batch)
            .param("batchSize", BATCH_SIZE)
        ).await?;
        let mut batches = Vec::<Vec<ScoredAnswer>>::new();
        while let Some(row) = rows.next().await? {
            batches.push(row.get("answers")?);
        }
        batches
    };

    tracing::debug!("scoring {person_id}: marking the job running");
    let id = {
        let mut rows = graph.execute(query("
            MATCH (p:Person) WHERE elementId(p) = $personId
            OPTIONAL MATCH (p)-[:HAS_JOB]->(stale:JobRunning)
            WHERE stale.startedAt < datetime() - duration({minutes: $staleMinutes})
            DETACH DELETE stale
            WITH DISTINCT p
            CREATE (p)-[:HAS_JOB]->(j:JobRunning {kind: 'personality_scoring', startedAt: datetime()})
            RETURN elementId(j) AS id
        ")
            .param("personId", person_id)
            .param("staleMinutes", STALE_JOB_MINUTES)
        ).await?;
        rows.next().await?.ok_or("couldn't find the person to score")?.get::<String>("id")?
    };
    let request_id = request_id.header_value().to_str().unwrap_or_default().to_string();
    let job = ScoringJob { id, person_id: person_id.to_string(), request_id, batches };

    tracing::debug!("scoring {person_id}: queueing");
    if let Err(e) = queue(state, "personality_scoring", &job).await {
        //nothing will pick the job up, so don't leave the person locked out waiting for it
        graph.run(query("MATCH (j:JobRunning) WHERE elementId(j) = $id DETACH DELETE j").param("id", job.id)).await?;
        return Err(e);
    }
    Ok(())
}

//sends a job to atlas-jobs, or logs it to run by hand when there's no queue
async fn queue(state: &AppState, kind: &str, job: impl Serialize) -> Result<(), BoxError> {
    let body = json!({"kind": kind, "job": job}).to_string();
    let Some((sqs, url)) = &state.jobs_queue else {
        tracing::info!("JOBS_QUEUE_URL isn't set, so run this job through atlas-jobs by hand: {body}");
        return Ok(());
    };
    sqs.send_message().queue_url(url).message_body(body).send().await.map_err(|e| DisplayErrorContext(e).to_string())?;
    Ok(())
}
