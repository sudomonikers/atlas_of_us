
use aws_sdk_sqs::error::DisplayErrorContext;
use axum::{Json, Router, extract::{Path, State}, http::StatusCode, routing::{get, post, put}};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{auth::AuthUser, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/traits", get(list_all_personality_traits))
        .route("/explore", get(get_explore))
        .route("/people/{person_id}/evidence", get(list_person_evidence))
        .route("/profiles/{username}", get(get_profile))
        .route("/scenarios/{name}/questions", get(list_scenario_questions))
        .route("/answers", put(answer_question))
        .route("/progress", get(get_progress))
        .route("/rescore", post(rescore_personality))
        .route("/scoring", get(get_scoring))
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
    id: String,
    domain: String, //the PersonalityDomain's key, e.g. 'openness', or 'other'
    average: Option<f64>, //everyone's mean value for the trait, 0 to 1. Missing until someone has been measured on it
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
            MATCH (p:PersonalityTrait)
            OPTIONAL MATCH (d:PersonalityDomain)-[:HAS_FACET]->(p)
            OPTIONAL MATCH (:Person)-[r:HAS_PERSONALITY_TRAIT]->(p)
            RETURN p.name AS name, p.description AS description, elementId(p) AS id, coalesce(d.key, 'other') AS domain,
                   avg(toFloat(r.value)) AS average
            ORDER BY name"
        )).await.map_err(|e| internal(&e))?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        traits.push(row.to::<PersonalityTrait>().map_err(|e| internal(&e))?);
    }
    Ok(Json(traits))
}

#[derive(Serialize, Deserialize)]
pub struct ExploreModel {
    name: String,
    overview: Option<String>,
    history: Option<String>,
    limits: Option<String>,
    our_take: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Interaction {
    name: String, //the other trait
    description: String,
}

#[derive(Serialize, Deserialize)]
pub struct ExploreTrait {
    id: String,
    name: String,
    description: Option<String>,
    overview: Option<String>,
    high_good: Option<Vec<String>>, //where being high helps
    low_good: Option<Vec<String>>, //where being low helps
    high_watch: Option<Vec<String>>, //what to watch out for when high
    low_watch: Option<Vec<String>>, //what to watch out for when low
    interactions: Vec<Interaction>,
}

#[derive(Serialize, Deserialize)]
pub struct ExploreDomain {
    key: String,
    name: String,
    overview: Option<String>,
    high_good: Option<Vec<String>>, //where being high helps
    low_good: Option<Vec<String>>, //where being low helps
    high_watch: Option<Vec<String>>, //what to watch out for when high
    low_watch: Option<Vec<String>>, //what to watch out for when low
    traits: Vec<ExploreTrait>,
}

#[derive(Serialize)]
pub struct Explore {
    model: ExploreModel,
    domains: Vec<ExploreDomain>,
}

//the Big Five model, its domains, and every trait with its breakdown and interactions. The Explore tab's reading material
pub async fn get_explore(State(state): State<AppState>) -> Result<Json<Explore>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    //built inside out: each trait's interactions, then each domain's traits, then the domains
    let mut rows = state.graph.execute(query("
        MATCH (m:PersonalityModel {name: 'Big Five'})-[:HAS_DOMAIN]->(d:PersonalityDomain)
        OPTIONAL MATCH (d)-[:HAS_FACET]->(t:PersonalityTrait)
        OPTIONAL MATCH (t)-[r:INTERACTS_WITH]->(o:PersonalityTrait)
        WITH m, d, t, r, o ORDER BY o.name
        WITH m, d, t, collect(CASE WHEN o IS NULL THEN null ELSE {name: o.name, description: r.description} END) AS interactions
        ORDER BY t.name
        WITH m, d, collect(CASE WHEN t IS NULL THEN null ELSE {
            id: elementId(t), name: t.name, description: t.description, overview: t.overview,
            high_good: t.highGood, low_good: t.lowGood, high_watch: t.highWatch, low_watch: t.lowWatch,
            interactions: interactions
        } END) AS traits
        ORDER BY d.order
        RETURN {name: m.name, overview: m.overview, history: m.history, limits: m.limits, our_take: m.ourTake} AS model,
               collect({
                   key: d.key, name: d.name, overview: d.overview,
                   high_good: d.highGood, low_good: d.lowGood, high_watch: d.highWatch, low_watch: d.lowWatch,
                   traits: traits
               }) AS domains
    ")).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(Explore {
            model: row.get("model").map_err(|e| internal(&e))?,
            domains: row.get("domains").map_err(|e| internal(&e))?,
        })),
        None => Err((StatusCode::NOT_FOUND, "The personality guide isn't set up yet. Check back soon.".to_string())),
    }
}

#[derive(Serialize, Deserialize)]
pub struct PersonTrait {
    id: String, //the PersonalityTrait's id
    name: String,
    description: Option<String>,
    domain: String, //the PersonalityDomain's key, e.g. 'openness', or 'other'
    value: f64, //how strongly the person has the trait, 0 to 1
    confidence: f64, //how much evidence the value is based on, 0 to 1
}

#[derive(Serialize, Deserialize)]
pub struct Profile {
    username: String,
    first_name: String,
    public: bool,
    traits: Vec<PersonTrait>,
}

//someone's profile at /u/{username}. Private ones are only seen by their owner, and look missing to everyone else
pub async fn get_profile(
    State(state): State<AppState>,
    user: Option<AuthUser>,
    Path(username): Path<String>,
) -> Result<Json<Profile>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        MATCH (p:Person {username: toLower($username)})
        WHERE coalesce(p.public, false) OR elementId(p) = $viewerId
        OPTIONAL MATCH (p)-[r:HAS_PERSONALITY_TRAIT]->(t:PersonalityTrait)
        OPTIONAL MATCH (d:PersonalityDomain)-[:HAS_FACET]->(t)
        WITH p, r, t, d ORDER BY t.name
        RETURN p.username AS username, p.firstName AS first_name, coalesce(p.public, false) AS public,
            collect(CASE WHEN t IS NULL THEN null ELSE {
                id: elementId(t), name: t.name, description: t.description, domain: coalesce(d.key, 'other'), value: toFloat(r.value),
                confidence: toFloat(coalesce(r.confidence, 0))
            } END) AS traits
    ")
        .param("username", username)
        .param("viewerId", user.map(|u| u.person_id).unwrap_or_default())
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.to::<Profile>().map_err(|e| internal(&e))?)),
        None => Err((StatusCode::NOT_FOUND, "This profile is private or doesn't exist.".to_string())),
    }
}

#[derive(Deserialize)]
struct EvidenceRow {
    scenario: String,
    question: String,
    answer: String,
    reasoning: Option<String>,
    scoring: String, //json list of Shifts, written when the person was last scored
}

#[derive(Serialize)]
pub struct AnswerEvidence {
    scenario: String, //the scenario's title
    question: String,
    answer: String,
    reasoning: Option<String>,
    shifts: Vec<Shift>, //how this answer moved each trait the last time the person was scored
}

//every scored answer and how it moved the person's traits, so they can see what went into their scores. People can only see their own
pub async fn list_person_evidence(
    State(state): State<AppState>,
    user: AuthUser,
    Path(person_id): Path<String>,
) -> Result<Json<Vec<AnswerEvidence>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
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
            scenario: s.title, question: q.prompt, answer: a.answer, reasoning: a.reasoning, scoring: a.scoring
        } END) AS answers
    ")
        .param("personId", person_id)
    ).await.map_err(|e| internal(&e))?;

    let Some(row) = rows.next().await.map_err(|e| internal(&e))? else {
        return Err((StatusCode::NOT_FOUND, "We couldn't find that person.".to_string()));
    };
    let mut answers = Vec::new();
    for answer in row.get::<Vec<EvidenceRow>>("answers").map_err(|e| internal(&e))? {
        answers.push(AnswerEvidence {
            shifts: serde_json::from_str(&answer.scoring).map_err(|e| internal(&e))?,
            scenario: answer.scenario,
            question: answer.question,
            answer: answer.answer,
            reasoning: answer.reasoning,
        });
    }
    Ok(Json(answers))
}

#[derive(Serialize, Deserialize)]
pub struct ScenarioQuestion {
    id: String,
    key: String, //the prompt id in the scenario's script
    prompt: String,
}

//the questions in a scenario, in the order they're asked. Empty if the scenario doesn't exist
pub async fn list_scenario_questions(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<Vec<ScenarioQuestion>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        MATCH (:PersonalityScenario {name: $name})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion)
        RETURN elementId(q) AS id, q.key AS key, q.prompt AS prompt
        ORDER BY q.order
    ")
        .param("name", name)
    ).await.map_err(|e| internal(&e))?;

    let mut questions = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        questions.push(row.to::<ScenarioQuestion>().map_err(|e| internal(&e))?);
    }
    Ok(Json(questions))
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
    scored: bool, //this answer finished the scenario, so the person's traits are being rescored in the background
}

//saves the logged in user's answer, replacing any earlier answer to the same question.
//Answering the last question of a scenario starts a scoring job, which rescores the person's traits in the background
pub async fn answer_question(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<AnswerPayload>,
) -> Result<Json<AnswerResponse>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
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

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion) WHERE elementId(q) = $questionId
        MERGE (p)-[a:ANSWERED]->(q)
        SET a.answer = $answer, a.reasoning = $reasoning, a.context = $context, a.answeredDate = datetime(),
            a.clockSeconds = $clockSeconds, a.clockLeft = $clockLeft, a.clockRanOut = $clockRanOut
        WITH s, q, a
        MATCH (s)-[:HAS_QUESTION]->(each:PersonalityScenarioQuestion)
        WITH s, q, a, max(each.order) AS last
        RETURN s.name AS scenario, elementId(q) AS question_id, q.key AS question_key,
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
    ).await.map_err(|e| internal(&e))?;
    let Some(row) = rows.next().await.map_err(|e| internal(&e))? else {
        return Err((StatusCode::NOT_FOUND, "That question doesn't exist anymore. Try reloading the page.".to_string()));
    };
    let answer = row.to::<Answer>().map_err(|e| internal(&e))?;

    //only on the last question, so replaying a finished scenario doesn't rescore on its first answer.
    //Earlier questions can go unanswered, when a scenario's clock runs out before them
    let scored = row.get::<bool>("last_question").map_err(|e| internal(&e))?;
    if scored {
        start_scoring(&state, &user.person_id, Some(&answer.scenario)).await.map_err(|e| internal(&e))?;
    }
    Ok(Json(AnswerResponse { answer, scored }))
}

//every scenario question the logged in user has answered
pub async fn get_progress(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Answer>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        MATCH (p:Person)-[a:ANSWERED]->(q:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
        WHERE elementId(p) = $personId
        RETURN s.name AS scenario, elementId(q) AS question_id, q.key AS question_key,
               a.answer AS answer, a.reasoning AS reasoning, toString(a.answeredDate) AS answered_date
        ORDER BY s.name, q.order
    ")
        .param("personId", user.person_id)
    ).await.map_err(|e| internal(&e))?;

    let mut answers = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        answers.push(row.to::<Answer>().map_err(|e| internal(&e))?);
    }
    Ok(Json(answers))
}

//rescores the logged in user without finishing a scenario, e.g. after changing the prompt. Responds once the job has started
pub async fn rescore_personality(State(state): State<AppState>, user: AuthUser) -> Result<StatusCode, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    start_scoring(&state, &user.person_id, None).await.map_err(|e| internal(&e))?;
    Ok(StatusCode::ACCEPTED)
}

#[derive(Serialize)]
pub struct ScoringStatus {
    running: bool, //a scoring job for the logged in user hasn't finished yet
}

//whether the logged in user's traits are still being rescored. The ui polls this and holds off new scenarios until it's done
pub async fn get_scoring(State(state): State<AppState>, user: AuthUser) -> Result<Json<ScoringStatus>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        OPTIONAL MATCH (p:Person)-[:HAS_JOB]->(j:JobRunning {kind: 'personality_scoring'})
        WHERE elementId(p) = $personId AND j.startedAt > datetime() - duration({minutes: $staleMinutes})
        RETURN count(j) > 0 AS running
    ")
        .param("personId", user.person_id)
        .param("staleMinutes", STALE_JOB_MINUTES)
    ).await.map_err(|e| internal(&e))?;
    let running = match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => row.get::<bool>("running").map_err(|e| internal(&e))?,
        None => false,
    };
    Ok(Json(ScoringStatus { running }))
}

/* ---------------------------------------------------------------------------------------------
 * scoring
 * ------------------------------------------------------------------------------------------- */

//one piece of evidence about a trait
#[derive(Serialize, Deserialize)]
struct Shift {
    r#trait: String,
    evidence: String, //what in the answer shows it
    level: f64, //where the answer puts them, -1 (the low end) to 1 (the high end), 0 is typical
    weight: f64, //how strongly the answer shows it, 0 to 1
}

#[derive(Serialize, Deserialize)]
struct ScoredAnswer {
    id: String, //the ANSWERED relationship's id
    scenario: String,
    prompt: String,
    context: Option<String>, //the story the person saw just before the question
    answer: String,
    reasoning: Option<String>,
    clock_seconds: Option<i64>,
    clock_left: Option<i64>,
    clock_ran_out: Option<bool>,
}

//a job left this long is treated as finished: atlas-jobs has 15 minutes, and the queue gives a job two tries
const STALE_JOB_MINUTES: i64 = 35;

//everything atlas-jobs needs to score a person, sent whole through the queue
#[derive(Serialize)]
struct ScoringJob {
    id: String, //the JobRunning node's id
    person_id: String,
    answers: Vec<ScoredAnswer>,
    traits: Vec<JobTrait>,
}

#[derive(Serialize, Deserialize)]
struct JobTrait {
    name: String,
    description: Option<String>,
}

type BoxError = Box<dyn std::error::Error + Send + Sync>;

//gathers the person's answers to one scenario, or to all of them when there's none, into a scoring job,
//marks it running on the person, and queues it for atlas-jobs.
//Without a queue (running locally) the job is logged instead, to run through atlas-jobs by hand
async fn start_scoring(state: &AppState, person_id: &str, scenario: Option<&str>) -> Result<(), BoxError> {
    let graph = &state.graph;
    let mut rows = graph.execute(query("
        MATCH (p:Person)-[a:ANSWERED]->(q:PersonalityScenarioQuestion)<-[:HAS_QUESTION]-(s:PersonalityScenario)
        WHERE elementId(p) = $personId AND ($scenario IS NULL OR s.name = $scenario)
        RETURN elementId(a) AS id, s.title AS scenario, q.prompt AS prompt, a.context AS context,
               a.answer AS answer, a.reasoning AS reasoning,
               a.clockSeconds AS clock_seconds, a.clockLeft AS clock_left, a.clockRanOut AS clock_ran_out
        ORDER BY s.name, q.order
    ")
        .param("personId", person_id)
        .param("scenario", scenario)
    ).await?;
    let mut answers = Vec::new();
    while let Some(row) = rows.next().await? {
        answers.push(row.to::<ScoredAnswer>()?);
    }

    let mut rows = graph.execute(query("
        MATCH (t:PersonalityTrait)
        RETURN t.name AS name, t.description AS description
        ORDER BY name
    ")).await?;
    let mut traits = Vec::new();
    while let Some(row) = rows.next().await? {
        traits.push(row.to::<JobTrait>()?);
    }

    //the ui watches for this node, and stale ones left by a job that died are cleared on the way
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
    let id = rows.next().await?.ok_or("couldn't find the person to score")?.get::<String>("id")?;
    let job = ScoringJob { id, person_id: person_id.to_string(), answers, traits };

    let body = json!({"kind": "personality_scoring", "job": job}).to_string();
    let Some((sqs, url)) = &state.jobs_queue else {
        tracing::info!("JOBS_QUEUE_URL isn't set, so run this job through atlas-jobs by hand: {body}");
        return Ok(());
    };
    if let Err(e) = sqs.send_message().queue_url(url).message_body(body).send().await {
        //nothing will pick the job up, so don't leave the person locked out waiting for it
        graph.run(query("MATCH (j:JobRunning) WHERE elementId(j) = $id DETACH DELETE j").param("id", job.id)).await?;
        return Err(DisplayErrorContext(e).to_string().into());
    }
    Ok(())
}
