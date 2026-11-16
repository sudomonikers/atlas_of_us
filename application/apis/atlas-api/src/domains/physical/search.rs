//one search across conditions and impairments: conditions, and the body functions and parts an impairment can be in.
//The conditions seeded and added so far are a few hundred of Mondo's and HPO's tens of thousands, so when few of those
//match, the rest of Mondo and HPO are searched too, through EBI's Ontology Lookup Service, and one picked from there is
//added (see conditions.rs). Ours are found in full-text indexes with the english analyzer (see
//database/migrations/012_search_indexes.cypher), so plurals, possessives, prefixes and a typo all find what's meant
use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::get,
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, helpers::lucene, state::AppState};

use super::{bad, conditions, internal};

pub fn router() -> Router<AppState> {
    Router::new().route("/search", get(search))
}

//the most of each kind a search returns, and the most body parts when it's only for them
const CONDITIONS: i64 = 8;
const FUNCTIONS: i64 = 5;
const PARTS: i64 = 5;
const ONLY_PARTS: i64 = 20;
//fewer of ours than this and Mondo and HPO are searched too, for as many as this
const FEW: usize = 4;
const OUTSIDE: usize = 5;

#[derive(Deserialize)]
pub struct SearchParams {
    q: String,
    #[serde(default)]
    only: Option<String>, //"parts" searches only the body parts
}

#[derive(Serialize, Default)]
pub struct Found {
    conditions: Vec<String>, //the ids of ours, best first
    outside: Vec<conditions::Candidate>, //Mondo and HPO terms not in our database yet, from the Ontology Lookup Service, best first
    outside_failed: bool, //whether Mondo and HPO couldn't be reached, when they were searched
    functions: Vec<String>, //the ids of body functions
    parts: Vec<String>, //the ids of body parts
}

async fn search(State(state): State<AppState>, _user: AuthUser, Query(params): Query<SearchParams>) -> Result<Json<Found>, (StatusCode, String)> {
    let q = params.q.trim();
    if q.chars().count() > 100 {
        return Err(bad("That search is too long."));
    }
    let Some(lucene) = lucene::query(q) else {
        return Ok(Json(Found::default()));
    };
    let only_parts = params.only.as_deref() == Some("parts");
    let parts = ids(&state, "part_names", &lucene, if only_parts { ONLY_PARTS } else { PARTS }).await?;
    if only_parts {
        return Ok(Json(Found { parts, ..Found::default() }));
    }
    let conditions = ids(&state, "condition_names", &lucene, CONDITIONS).await?;
    let functions = ids(&state, "function_names", &lucene, FUNCTIONS).await?;

    //the outside search is slow and only adds to ours, so a failure leaves ours to show
    let (outside, outside_failed) = if conditions.len() < FEW {
        match conditions::outside(&state, q).await {
            Ok(found) => (found.into_iter().filter(|c| c.id.as_ref().is_none_or(|id| !conditions.contains(id))).take(OUTSIDE).collect(), false),
            Err(_) => (Vec::new(), true),
        }
    } else {
        (Vec::new(), false)
    };
    Ok(Json(Found { conditions, outside, outside_failed, functions, parts }))
}

//the ids of the best matches in a full-text index
async fn ids(state: &AppState, index: &str, lucene: &str, limit: i64) -> Result<Vec<String>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        CALL db.index.fulltext.queryNodes($index, $lucene, {limit: $limit}) YIELD node
        RETURN node.id AS id
    ").param("index", index).param("lucene", lucene).param("limit", limit)).await.map_err(internal)?;
    let mut found = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        found.push(row.get::<String>("id").map_err(internal)?);
    }
    Ok(found)
}
