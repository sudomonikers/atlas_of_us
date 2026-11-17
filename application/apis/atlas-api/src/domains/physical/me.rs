//The logged in user's own physical attributes that are set rather than recorded as readings: their characteristics,
//such as their sex, which hand they use or their blood type, each one of a few choices
use std::collections::HashMap;

use axum::{Json, extract::State, http::StatusCode};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{abilities, bad, internal};

//a characteristic, with the logged in user's answer
#[derive(Serialize, Deserialize)]
pub struct Characteristic {
    id: String,
    name: String,
    question: String,
    choices: Vec<String>,
    value: Option<String>, //one of the choices, or None when they haven't said
}

#[derive(Serialize, Deserialize)]
pub struct Me {
    characteristics: Vec<Characteristic>, //in the order they're asked
}

async fn load(state: &AppState, person_id: &str) -> Result<Me, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN COLLECT {
                   MATCH (c:Characteristic)
                   OPTIONAL MATCH (p)-[h:HAS_CHARACTERISTIC]->(c)
                   RETURN {id: c.id, name: c.name, question: c.question, choices: c.choices, value: h.value} ORDER BY c.order
               } AS characteristics
    ").param("personId", person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?;
    row.to::<Me>().map_err(internal)
}

//the logged in user's own physical attributes
pub async fn get_me(State(state): State<AppState>, user: AuthUser) -> Result<Json<Me>, (StatusCode, String)> {
    Ok(Json(load(&state, &user.person_id).await?))
}

//what to change: the characteristics sent, by id, each to one of its choices, or to null to take the answer back. The
//rest stay as they are
#[derive(Deserialize)]
pub struct MeRequest {
    characteristics: HashMap<String, Option<String>>,
}

//what changed, and their abilities when that moved them
#[derive(Serialize)]
pub struct Changed {
    me: Me,
    abilities: Option<Vec<abilities::Ability>>,
}

//the characteristic that decides who a person is compared with
const SEX: &str = "Sex";

//changes the logged in user's characteristics. Their sex decides who they're compared with, so changing it moves every
//reading's percentile, and so their abilities, which are worked out again and come back; the others move nothing else
pub async fn set_me(State(state): State<AppState>, user: AuthUser, Json(req): Json<MeRequest>) -> Result<Json<Changed>, (StatusCode, String)> {
    let known = load(&state, &user.person_id).await?.characteristics;
    let mut rescore = false;
    for (id, value) in &req.characteristics {
        let c = known.iter().find(|c| &c.id == id).ok_or_else(|| bad("That characteristic doesn't exist."))?;
        if value.as_ref().is_some_and(|v| !c.choices.contains(v)) {
            return Err(bad(&format!("Pick one of the choices for {}.", c.name.to_lowercase())));
        }
        rescore |= c.name == SEX && c.value != *value;
    }

    for (id, value) in req.characteristics {
        state.graph.run(query("
            MATCH (p:Person {id: $personId}), (c:Characteristic {id: $id})
            OPTIONAL MATCH (p)-[old:HAS_CHARACTERISTIC]->(c)
            DELETE old
            WITH p, c
            WHERE $value IS NOT NULL
            CREATE (p)-[:HAS_CHARACTERISTIC {value: $value, setAt: datetime()}]->(c)
        ")
            .param("personId", user.person_id.as_str())
            .param("id", id)
            .param("value", value)
        ).await.map_err(internal)?;
    }

    let abilities = if rescore { Some(abilities::refresh(&state, &user.person_id).await?) } else { None };
    Ok(Json(Changed { me: load(&state, &user.person_id).await?, abilities }))
}

//clears everything the logged in user has entered in Physical Traits, in one go: their characteristics, readings,
//impairments and conditions, where they stand on each ability, which those were all it came from, and the
//summary written from them
pub async fn clear_me(State(state): State<AppState>, user: AuthUser) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        REMOVE p.physicalSummary, p.physicalSummaryInput, p.physicalSummaryAt, p.physicalSummaryAskedAt, p.physicalSummaryFailedAt
        WITH p
        OPTIONAL MATCH (p)-[r:HAS_CHARACTERISTIC|HAS_MEASUREMENT|HAS_IMPAIRMENT|HAS_CONDITION|HAS_ABILITY]->()
        DELETE r
    ")
        .param("personId", user.person_id)
    ).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
