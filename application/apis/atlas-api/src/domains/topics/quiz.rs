//testing what someone knows of a topic with its questions, one on each of the levels that have one. They answer them
//from the highest down: each one they get wrong, or say they don't know, takes them to the next question below it, and
//the first they get right is the level they're placed at, unless they're higher already. Getting the lowest wrong
//places them nowhere. See "Testing what someone knows" in documentation/data_model/topics/topics.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    state::AppState,
};

use super::set_person_level;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/{id}/question", get(next_question))
        .route("/questions/{id}/answer", post(answer))
}

//whether the person p is done with the topic t's questions: they got one right, or got its lowest wrong. Its own names
//don't clash with the query it's in
pub const DONE: &str = "EXISTS {
    MATCH (p)-[answered:ANSWERED_QUIZ]->(:QuizQuestion)-[:TESTS]->(tested:BloomLevel)<-[:HAS_LEVEL]-(t)
    WHERE answered.correct OR NOT EXISTS {
        MATCH (t)-[:HAS_LEVEL]->(lower:BloomLevel)<-[:TESTS]-(:QuizQuestion) WHERE lower.rank < tested.rank
    }
}";

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn bad_request(message: &str) -> (StatusCode, String) {
    (StatusCode::BAD_REQUEST, message.to_string())
}

fn not_found(what: &str) -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, format!("That {what} doesn't exist."))
}

//a question as the person sees it, without its answer
#[derive(Serialize, Deserialize)]
struct Asked {
    id: String,
    rank: i64, //the level it tests
    prompt: String,
    choices: Vec<String>,
}

//the highest question on a topic below a level
async fn question_below(state: &AppState, topic_id: &str, below: i64) -> Result<Option<Asked>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (:Topic {id: $id})-[:HAS_LEVEL]->(l:BloomLevel)<-[:TESTS]-(q:QuizQuestion)
        WHERE l.rank < $below
        RETURN q.id AS id, l.rank AS rank, q.prompt AS prompt, q.choices AS choices
        ORDER BY l.rank DESC
        LIMIT 1
    ").param("id", topic_id).param("below", below)).await.map_err(internal)?;
    match rows.next().await.map_err(internal)? {
        Some(row) => Ok(Some(row.to::<Asked>().map_err(internal)?)),
        None => Ok(None),
    }
}

#[derive(Serialize)]
struct Next {
    question: Option<Asked>, //none once they're done with the topic, or when it has no questions
}

//the question to ask next about a topic: its highest, or the next below the last they got wrong
async fn next_question(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Next>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (t:Topic {{id: $id}}), (p:Person {{id: $personId}})
        RETURN {DONE} AS done,
               COLLECT {{ MATCH (p)-[a:ANSWERED_QUIZ]->(:QuizQuestion)-[:TESTS]->(l:BloomLevel)<-[:HAS_LEVEL]-(t)
                          WHERE NOT a.correct RETURN l.rank }} AS missed
    ")).param("id", id.as_str()).param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| not_found("topic"))?;
    let done: bool = row.get("done").map_err(internal)?;
    let missed: Vec<i64> = row.get("missed").map_err(internal)?;
    drop(rows);
    if done {
        return Ok(Json(Next { question: None }));
    }
    let below = missed.into_iter().min().unwrap_or(i64::MAX);
    Ok(Json(Next { question: question_below(&state, &id, below).await? }))
}

#[derive(Deserialize)]
struct AnswerRequest {
    choice: Option<i64>, //none when they don't know, which is a wrong answer
}

#[derive(Serialize)]
struct Answered {
    correct: bool,
    answer: i64, //the right choice
    explanation: String,
    next: Option<Asked>, //the next question below, when they got this one wrong
    placed: Option<i64>, //the level they were placed at, once the questions are done and it's higher than they were
    rank: Option<i64>,   //the level they're at once the questions are done
}

//what answering a question needs to know about it
#[derive(Deserialize)]
struct Answering {
    topic_id: String,
    rank: i64,
    answer: i64,
    choices: i64,
    explanation: String,
    above_wrong: bool, //whether they got every question above it wrong, or it's the highest
    current: Option<i64>,
}

//answers one of a topic's questions, or says they don't know it. They answer them from the highest down, each after
//getting the ones above it wrong, and the first they get right is the level they're placed at, unless they're higher
//already
async fn answer(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<AnswerRequest>) -> Result<Json<Answered>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (q:QuizQuestion {id: $id})-[:TESTS]->(l:BloomLevel)<-[:HAS_LEVEL]-(t:Topic), (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(current:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN t.id AS topic_id, l.rank AS rank, q.answer AS answer, size(q.choices) AS choices, q.explanation AS explanation,
               NOT EXISTS {
                   MATCH (t)-[:HAS_LEVEL]->(above:BloomLevel)<-[:TESTS]-(other:QuizQuestion)
                   WHERE above.rank > l.rank AND NOT EXISTS { (p)-[a:ANSWERED_QUIZ]->(other) WHERE NOT a.correct }
               } AS above_wrong,
               current.rank AS current
    ").param("id", id.as_str()).param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let answering = rows.next().await.map_err(internal)?.ok_or_else(|| not_found("question"))?.to::<Answering>().map_err(internal)?;
    drop(rows);
    if req.choice.is_some_and(|choice| !(0..answering.choices).contains(&choice)) {
        return Err(bad_request("Pick one of the answers."));
    }
    if !answering.above_wrong {
        return Err(bad_request("Answer the topic's questions in order, from the start."));
    }

    let correct = req.choice == Some(answering.answer);
    state.graph.run(query("
        MATCH (p:Person {id: $personId}), (q:QuizQuestion {id: $id})
        MERGE (p)-[a:ANSWERED_QUIZ]->(q)
        SET a.choice = $choice, a.correct = $correct, a.answeredAt = datetime()
    ").param("personId", user.person_id.as_str()).param("id", id.as_str()).param("choice", req.choice).param("correct", correct))
        .await.map_err(internal)?;

    let next = match correct {
        true => None,
        false => question_below(&state, &answering.topic_id, answering.rank).await?,
    };
    let (mut placed, mut rank) = (None, answering.current);
    if correct && answering.current.is_none_or(|current| answering.rank > current) {
        set_person_level(&state.graph, &user.person_id, &answering.topic_id, answering.rank).await.map_err(internal)?;
        tracing::info!(topic_id = answering.topic_id, rank = answering.rank, "placed a person on a topic from its questions");
        (placed, rank) = (Some(answering.rank), Some(answering.rank));
    }
    Ok(Json(Answered { correct, answer: answering.answer, explanation: answering.explanation, next, placed, rank }))
}
