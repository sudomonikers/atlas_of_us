//Characteristics Graph: facts about a person's body that are each one of a few choices rather than a number, such as
//their sex, which hand they use or their blood type, kept together on their Characteristics node. Their sex decides
//who their readings in Abilities are compared with. See documentation/data_model/characteristics/characteristics.md
//and documentation/architecture/characteristics.md
use std::collections::HashMap;

use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::{Graph, query};
use serde::Serialize;

use crate::{auth::AuthUser, state::AppState};

use super::abilities;

//the sex a person (p) is compared with in Abilities, male or female. null, with no answer, compares them with everyone
pub const SEX: &str = "toLower(COLLECT { MATCH (p)-[:HAS_CHARACTERISTICS]->(c:Characteristics) RETURN c.sex }[0])";

//a characteristic: its property on the Characteristics node, what Atlas asks, and what can be answered
struct Kind {
    key: &'static str,
    name: &'static str,
    question: &'static str,
    choices: &'static [&'static str],
}

//in the order they're asked
const KINDS: [Kind; 5] = [
    Kind {
        key: "sex",
        name: "Sex",
        question: "Men's and women's bodies differ quite a bit, so I compare your readings with people of your sex and age. What's your sex? Skip it to be compared with everyone your age.",
        choices: &["Female", "Male"],
    },
    Kind {
        key: "handedness",
        name: "Handedness",
        question: "Which hand do you use most, for writing, throwing or using a fork?",
        choices: &["Right", "Left", "Both"],
    },
    Kind {
        key: "eyeColor",
        name: "Eye Color",
        question: "What color are your eyes?",
        choices: &["Brown", "Hazel", "Amber", "Green", "Blue", "Gray"],
    },
    Kind {
        key: "hairColor",
        name: "Hair Color",
        question: "What color is your hair naturally, or was it before it went gray?",
        choices: &["Black", "Dark brown", "Light brown", "Blonde", "Red", "Auburn"],
    },
    Kind {
        key: "bloodType",
        name: "Blood Type",
        question: "What's your blood type? It's on a blood donor card, and your doctor may have it on record.",
        choices: &["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    },
];

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_characteristics).put(set_characteristics))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn bad(message: &str) -> (StatusCode, String) {
    (StatusCode::BAD_REQUEST, message.to_string())
}

//a characteristic, with the person's answer
#[derive(Serialize)]
pub struct Characteristic {
    key: &'static str,
    pub name: &'static str,
    question: &'static str,
    choices: &'static [&'static str],
    pub value: Option<String>, //one of the choices, or None when they haven't said
}

//every characteristic, in the order they're asked, with the person's answers
pub async fn of(graph: &Graph, person_id: &str) -> Result<Vec<Characteristic>, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[:HAS_CHARACTERISTICS]->(c:Characteristics)
        RETURN [k IN $keys | c[k]] AS values
    ")
        .param("personId", person_id)
        .param("keys", KINDS.iter().map(|k| k.key).collect::<Vec<_>>())
    ).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?;
    let values: Vec<Option<String>> = row.get("values").map_err(internal)?;
    Ok(KINDS.iter().zip(values).map(|(k, value)| Characteristic { key: k.key, name: k.name, question: k.question, choices: k.choices, value }).collect())
}

//the logged in user's characteristics
pub async fn get_characteristics(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<Characteristic>>, (StatusCode, String)> {
    Ok(Json(of(&state.graph, &user.person_id).await?))
}

//changes the characteristics sent, by key, each to one of its choices, or to null to take the answer back, and returns
//them all. Their sex decides who their readings are compared with, so changing it works out their abilities again
pub async fn set_characteristics(
    State(state): State<AppState>,
    user: AuthUser,
    Json(req): Json<HashMap<String, Option<String>>>,
) -> Result<Json<Vec<Characteristic>>, (StatusCode, String)> {
    let known = of(&state.graph, &user.person_id).await?;
    let mut rescore = false;
    for (key, value) in &req {
        let c = known.iter().find(|c| c.key == key).ok_or_else(|| bad("That characteristic doesn't exist."))?;
        if value.as_deref().is_some_and(|v| !c.choices.contains(&v)) {
            return Err(bad(&format!("Pick one of the choices for {}.", c.name.to_lowercase())));
        }
        rescore |= c.key == "sex" && c.value != *value;
    }

    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        MERGE (p)-[:HAS_CHARACTERISTICS]->(c:Characteristics)
        SET c += $values, c.updatedAt = datetime()
    ")
        .param("personId", user.person_id.as_str())
        .param("values", req)
    ).await.map_err(internal)?;

    if rescore {
        abilities::refresh(&state, &user.person_id).await?;
    }
    Ok(Json(of(&state.graph, &user.person_id).await?))
}
