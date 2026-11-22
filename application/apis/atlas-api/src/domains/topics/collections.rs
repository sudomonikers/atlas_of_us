//collections: groups of topics to go through in order, such as General Schooling Knowledge and Life Knowledge, each
//topic with how much of it the person showed through its questions (see quiz.rs). The UI asks for a collection by its
//id. See documentation/architecture/collections.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    state::AppState,
};

use super::quiz::DONE;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/{id}", get(collection))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

//a collection, without its topics
#[derive(Serialize, Deserialize)]
struct CollectionSummary {
    id: String,
    name: String,
    description: Option<String>,
    size: i64, //how many topics it contains
    done: i64, //how many of them the person has answered the questions of
}

//every collection, by name, with how far through it the person is
async fn list(State(state): State<AppState>, user: AuthUser) -> Result<Json<Vec<CollectionSummary>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (c:Collection), (p:Person {{id: $personId}})
        RETURN c.id AS id, c.name AS name, c.description AS description,
               COUNT {{ (c)-[:CONTAINS]->(:Topic) }} AS size,
               COUNT {{ MATCH (c)-[:CONTAINS]->(t:Topic) WHERE {DONE} }} AS done
        ORDER BY c.name
    ")).param("personId", user.person_id)).await.map_err(internal)?;
    let mut collections = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        collections.push(row.to::<CollectionSummary>().map_err(internal)?);
    }
    Ok(Json(collections))
}

//a topic in a collection, with where the person is with it
#[derive(Serialize, Deserialize)]
struct CollectionTopic {
    id: String,
    name: String,
    description: Option<String>,
    done: bool,        //they've answered its questions
    rank: Option<i64>, //the level they're at, from its questions or anywhere else
}

#[derive(Serialize)]
struct Collection {
    id: String,
    name: String,
    description: Option<String>,
    topics: Vec<CollectionTopic>, //in order
}

//a collection with its topics in order
async fn collection(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Collection>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (c:Collection {id: $id})
        RETURN c.name AS name, c.description AS description
    ").param("id", id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That collection doesn't exist.".to_string()))?;
    let name: String = row.get("name").map_err(internal)?;
    let description: Option<String> = row.get("description").map_err(internal)?;
    drop(rows);

    let mut rows = state.graph.execute(query(&format!("
        MATCH (:Collection {{id: $id}})-[contains:CONTAINS]->(t:Topic), (p:Person {{id: $personId}})
        OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN t.id AS id, t.name AS name, t.description AS description, {DONE} AS done, l.rank AS rank
        ORDER BY contains.order
    ")).param("id", id.as_str()).param("personId", user.person_id)).await.map_err(internal)?;
    let mut topics = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        topics.push(row.to::<CollectionTopic>().map_err(internal)?);
    }
    Ok(Json(Collection { id, name, description, topics }))
}
