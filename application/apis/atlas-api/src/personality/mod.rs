//Personality Graph: static PersonalityTrait nodes, Person -[:HAS_PERSONALITY_TRAIT {value}]-> PersonalityTrait
//Scenarios: PersonalityScenario -[:HAS_QUESTION]-> PersonalityScenarioQuestion <-[:ANSWERED {answer, reasoning}]- Person
use axum::{Json, Router, extract::{Path, State}, http::StatusCode, routing::{get, put}};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/traits", get(list_all_personality_traits))
        .route("/people/{person_id}/traits", get(list_person_traits))
        .route("/scenarios/{name}/questions", get(list_scenario_questions))
        .route("/answers", put(answer_question))
        .route("/progress", get(get_progress))
}

#[derive(Serialize, Deserialize)]
pub struct PersonalityTrait {
    name: String,
    description: Option<String>,
    id: String
}

pub async fn list_all_personality_traits(State(state): State<AppState>) -> Result<Json<Vec<PersonalityTrait>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
            MATCH (p:PersonalityTrait)
            RETURN p.name AS name, p.description AS description, elementId(p) AS id
            ORDER BY name"
        )).await.map_err(|e| internal(&e))?;

    let mut traits = Vec::new();
    while let Some(row) = rows.next().await.map_err(|e| internal(&e))? {
        traits.push(row.to::<PersonalityTrait>().map_err(|e| internal(&e))?);
    }
    Ok(Json(traits))
}

#[derive(Serialize, Deserialize)]
pub struct PersonTrait {
    id: String, //the PersonalityTrait's id
    name: String,
    description: Option<String>,
    value: f64, //how strongly the person has the trait, 0 to 1
}

//a person's personality traits, from their HAS_PERSONALITY_TRAIT relationships. People can only see their own
pub async fn list_person_traits(
    State(state): State<AppState>,
    user: AuthUser,
    Path(person_id): Path<String>,
) -> Result<Json<Vec<PersonTrait>>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    if person_id != user.person_id {
        return Err((StatusCode::FORBIDDEN, "You can only see your own personality traits.".to_string()));
    }

    //grouped by the person, so there's one row if they exist (with no traits, an empty list) and none if they don't
    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        OPTIONAL MATCH (p)-[r:HAS_PERSONALITY_TRAIT]->(t:PersonalityTrait)
        WITH p, r, t ORDER BY t.name
        RETURN elementId(p) AS person_id, collect(CASE WHEN t IS NULL THEN null ELSE {
            id: elementId(t), name: t.name, description: t.description, value: toFloat(r.value)
        } END) AS traits
    ")
        .param("personId", person_id)
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.get::<Vec<PersonTrait>>("traits").map_err(|e| internal(&e))?)),
        None => Err((StatusCode::NOT_FOUND, "We couldn't find that person.".to_string())),
    }
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

#[derive(Deserialize)]
pub struct AnswerPayload {
    question_id: String,
    answer: String, //the picked choice, or the whole answer when the question has no choices
    reasoning: Option<String>, //why, in the user's words
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

//saves the logged in user's answer, replacing any earlier answer to the same question
pub async fn answer_question(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<AnswerPayload>,
) -> Result<Json<Answer>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $personId
        MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion) WHERE elementId(q) = $questionId
        MERGE (p)-[a:ANSWERED]->(q)
        SET a.answer = $answer, a.reasoning = $reasoning, a.answeredDate = datetime()
        RETURN s.name AS scenario, elementId(q) AS question_id, q.key AS question_key,
               a.answer AS answer, a.reasoning AS reasoning, toString(a.answeredDate) AS answered_date
    ")
        .param("personId", user.person_id)
        .param("questionId", body.question_id)
        .param("answer", body.answer)
        .param("reasoning", body.reasoning)
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.to::<Answer>().map_err(|e| internal(&e))?)),
        None => Err((StatusCode::NOT_FOUND, "That question doesn't exist anymore. Try reloading the page.".to_string())),
    }
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
