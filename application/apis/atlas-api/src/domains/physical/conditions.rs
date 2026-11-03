//conditions: diseases from Mondo and features from HPO, with the conditions a person has. A few hundred common ones are
//seeded, and anyone can add another from either ontology, which is looked up in EBI's Ontology Lookup Service (OLS).
//Only the person who noted a condition sees that they have it
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, put},
};
use neo4rs::query;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::{auth::AuthUser, events, state::AppState};

use super::{bad, internal};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/conditions", get(conditions).post(add_condition))
        .route("/conditions/lookup", get(lookup))
        .route("/conditions/{id}/mine", put(set_mine).delete(clear_mine))
}

//how much a condition affects someone
const SEVERITIES: [&str; 3] = ["mild", "moderate", "severe"];

const OLS: &str = "https://www.ebi.ac.uk/ols4/api";
//the classes every condition has to be under: human diseases in Mondo, which also has diseases of other animals, and
//phenotypic abnormalities in HPO, which also has modes of inheritance, onsets and frequencies
const ROOTS: [&str; 2] = ["MONDO:0700096", "HP:0000118"];
//how many terms a lookup returns
const LOOKUP_RESULTS: usize = 10;

//a condition, with the body functions and parts it affects
#[derive(Serialize, Deserialize)]
pub struct Condition {
    id: String,
    source_id: String, //the ontology's id, such as MONDO:0004979
    source: String,    //Mondo or HPO
    name: String,
    description: Option<String>,
    synonyms: Vec<String>,
    broader: Vec<String>, //the ids of the conditions it's a kind of
    functions: Vec<Affected>,
    parts: Vec<AffectedPart>,
}

//a body function a condition affects
#[derive(Serialize, Deserialize)]
pub struct Affected {
    code: String,
    name: String,
}

//a body part a condition affects
#[derive(Serialize, Deserialize)]
pub struct AffectedPart {
    id: String,
    name: String,
}

//one of the logged in user's conditions
#[derive(Serialize, Deserialize)]
pub struct MyCondition {
    id: String,               //the condition
    severity: Option<String>, //mild, moderate or severe, when they've said
    diagnosed: bool,          //whether a professional diagnosed it
    managed: bool,            //whether it's under control, with treatment or otherwise
}

#[derive(Serialize)]
pub struct Conditions {
    conditions: Vec<Condition>,
    mine: Vec<MyCondition>,
}

//the conditions with these ids, or all of them when there are none
async fn fetch(state: &AppState, ids: Option<Vec<String>>) -> Result<Vec<Condition>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (c:Condition)
        WHERE $ids IS NULL OR c.id IN $ids
        RETURN c.id AS id, c.sourceId AS source_id, c.source AS source, c.name AS name, c.description AS description,
               coalesce(c.synonyms, []) AS synonyms,
               COLLECT { MATCH (c)-[:SUBTYPE_OF]->(b:Condition) RETURN b.id } AS broader,
               COLLECT { MATCH (c)-[:AFFECTS]->(p:BodyFunction) RETURN {code: p.code, name: p.name} ORDER BY p.code } AS functions,
               COLLECT { MATCH (c)-[:AFFECTS]->(p:BodyPart) RETURN {id: p.id, name: p.name} ORDER BY p.name } AS parts
        ORDER BY toLower(c.name)
    ").param("ids", ids)).await.map_err(internal)?;
    let mut conditions = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        conditions.push(row.to::<Condition>().map_err(internal)?);
    }
    Ok(conditions)
}

//every condition, with the logged in user's
async fn conditions(State(state): State<AppState>, user: AuthUser) -> Result<Json<Conditions>, (StatusCode, String)> {
    let conditions = fetch(&state, None).await?;
    let mut rows = state.graph.execute(query("
        MATCH (:Person {id: $personId})-[h:HAS_CONDITION]->(c:Condition)
        RETURN c.id AS id, h.severity AS severity, h.diagnosed AS diagnosed, h.managed AS managed
        ORDER BY toLower(c.name)
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let mut mine = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        mine.push(row.to::<MyCondition>().map_err(internal)?);
    }
    Ok(Json(Conditions { conditions, mine }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Adding a condition from Mondo or HPO
// ---------------------------------------------------------------------------------------------------------------------

fn unreachable_ols(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("the ontology search failed: {e}");
    (StatusCode::BAD_GATEWAY, "We couldn't reach the list of conditions. Please try again in a bit.".to_string())
}

//the ontology an id is from, as OLS names it, when it's a Mondo or HPO id: MONDO:0004979 or HP:0001382
fn ontology(source_id: &str) -> Option<&'static str> {
    let (prefix, number) = source_id.split_once(':')?;
    if number.len() != 7 || !number.chars().all(|c| c.is_ascii_digit()) {
        return None;
    }
    match prefix {
        "MONDO" => Some("mondo"),
        "HP" => Some("hp"),
        _ => None,
    }
}

//where the ontology publishes a term: MONDO:0004979 is http://purl.obolibrary.org/obo/MONDO_0004979
fn uri(source_id: &str) -> String {
    format!("http://purl.obolibrary.org/obo/{}", source_id.replace(':', "_"))
}

//a term from the ontology search, with the id of the condition it is when we have it
#[derive(Serialize)]
pub struct Candidate {
    source_id: String,
    source: String,
    name: String,
    description: Option<String>,
    id: Option<String>,
}

#[derive(Deserialize)]
pub struct LookupParams {
    q: String,
}

//the Mondo and HPO terms closest to what was typed, for adding a condition we don't have
async fn lookup(State(state): State<AppState>, _user: AuthUser, Query(params): Query<LookupParams>) -> Result<Json<Vec<Candidate>>, (StatusCode, String)> {
    let q = params.q.trim();
    if q.is_empty() {
        return Ok(Json(Vec::new()));
    }
    if q.chars().count() > 100 {
        return Err(bad("That search is too long."));
    }
    let roots: Vec<String> = ROOTS.iter().map(|r| uri(r)).collect();
    let answer: Value = state.http.get(format!("{OLS}/search"))
        .query(&[
            ("q", q), ("ontology", "mondo,hp"), ("type", "class"), ("local", "true"), ("obsoletes", "false"),
            ("rows", &LOOKUP_RESULTS.to_string()), ("fieldList", "obo_id,label,description,ontology_name"),
            ("allChildrenOf", &roots.join(",")),
        ])
        .send().await.and_then(|r| r.error_for_status()).map_err(unreachable_ols)?
        .json().await.map_err(unreachable_ols)?;

    let mut candidates: Vec<Candidate> = answer["response"]["docs"].as_array().into_iter().flatten()
        .filter_map(|doc| Some(Candidate {
            source_id: doc["obo_id"].as_str()?.to_string(),
            source: if doc["ontology_name"] == "mondo" { "Mondo" } else { "HPO" }.to_string(),
            name: doc["label"].as_str()?.to_string(),
            description: doc["description"][0].as_str().map(str::to_string),
            id: None,
        }))
        .filter(|c| ontology(&c.source_id).is_some())
        .collect();
    let source_ids: Vec<String> = candidates.iter().map(|c| c.source_id.clone()).collect();
    let mut rows = state.graph.execute(query("MATCH (c:Condition) WHERE c.sourceId IN $sourceIds RETURN c.sourceId AS source_id, c.id AS id")
        .param("sourceIds", source_ids)).await.map_err(internal)?;
    while let Some(row) = rows.next().await.map_err(internal)? {
        let (source_id, id): (String, String) = (row.get("source_id").map_err(internal)?, row.get("id").map_err(internal)?);
        if let Some(c) = candidates.iter_mut().find(|c| c.source_id == source_id) {
            c.id = Some(id);
        }
    }
    Ok(Json(candidates))
}

#[derive(Deserialize)]
struct AddRequest {
    source_id: String,
}

//adds a Mondo or HPO term as a condition, as the ontology has it, and places it among the conditions we have: under the
//nearest ones it's a kind of, and over the nearest ones that are kinds of it. Then ConditionAdded asks atlas-jobs to link
//it to the body functions and parts it affects. One we have already comes back as it is
async fn add_condition(State(state): State<AppState>, _user: AuthUser, Json(req): Json<AddRequest>) -> Result<Json<Condition>, (StatusCode, String)> {
    let source_id = req.source_id.trim();
    let ontology = ontology(source_id).ok_or_else(|| bad("That isn't a Mondo or HPO id."))?;
    let mut rows = state.graph.execute(query("MATCH (c:Condition {sourceId: $sourceId}) RETURN c.id AS id")
        .param("sourceId", source_id)).await.map_err(internal)?;
    if let Some(row) = rows.next().await.map_err(internal)? {
        let id: String = row.get("id").map_err(internal)?;
        return one(&state, id).await;
    }

    //OLS takes the term's uri encoded twice
    let encoded = uri(source_id).replace(':', "%253A").replace('/', "%252F");
    let response = state.http.get(format!("{OLS}/ontologies/{ontology}/terms/{encoded}"))
        .send().await.map_err(unreachable_ols)?;
    let term = match response.status() {
        reqwest::StatusCode::NOT_FOUND => return Err((StatusCode::NOT_FOUND, "That condition isn't in Mondo or HPO.".to_string())),
        _ => response.error_for_status().map_err(unreachable_ols)?.json::<Value>().await.map_err(unreachable_ols)?,
    };
    let ancestors: Value = state.http.get(format!("{OLS}/ontologies/{ontology}/terms/{encoded}/ancestors"))
        .query(&[("size", "1000")])
        .send().await.and_then(|r| r.error_for_status()).map_err(unreachable_ols)?
        .json().await.map_err(unreachable_ols)?;
    //only its own ontology's classes, leaving out the upper ontologies Mondo builds on, as the seed does
    let prefix = source_id.split(':').next().unwrap_or_default();
    let ancestors: Vec<String> = ancestors["_embedded"]["terms"].as_array().into_iter().flatten()
        .filter_map(|t| t["obo_id"].as_str().map(str::to_string))
        .filter(|a| a.split(':').next() == Some(prefix))
        .collect();
    let name = term["label"].as_str().ok_or_else(|| internal(format!("OLS gave {source_id} no label")))?;
    if term["is_obsolete"].as_bool().unwrap_or(false) || !ancestors.iter().any(|a| ROOTS.contains(&a.as_str())) {
        return Err(bad("That isn't a condition a person can have."));
    }
    let synonyms: Vec<String> = term["obo_synonym"].as_array().into_iter().flatten()
        .filter(|s| s["scope"] == "hasExactSynonym" && !s["type"].as_str().is_some_and(|t| t.contains("obsolete")))
        .filter_map(|s| s["name"].as_str().map(str::to_string))
        .collect();

    //every condition carries its ontology ancestors, so the nearest ones above and below it are found from those alone.
    //Conditions below it that linked straight to ones above it now link through it instead
    let mut rows = state.graph.execute(query("
        MERGE (n:Condition {sourceId: $sourceId})
        ON CREATE SET n.id = randomUUID(), n.addedAt = datetime()
        SET n.source = $source, n.name = $name, n.sourceUri = $sourceUri, n.description = $description,
            n.synonyms = $synonyms, n.ancestors = $ancestors
        WITH n
        CALL (n) {
            MATCH (b:Condition) WHERE b.sourceId IN $ancestors
              AND NOT EXISTS { MATCH (o:Condition) WHERE o.sourceId IN $ancestors AND b.sourceId IN o.ancestors }
            MERGE (n)-[:SUBTYPE_OF]->(b)
        }
        CALL (n) {
            MATCH (d:Condition) WHERE $sourceId IN d.ancestors
              AND NOT EXISTS { MATCH (e:Condition) WHERE $sourceId IN e.ancestors AND e.sourceId IN d.ancestors }
            MERGE (d)-[:SUBTYPE_OF]->(n)
            WITH d
            MATCH (d)-[r:SUBTYPE_OF]->(b:Condition) WHERE b.sourceId IN $ancestors
            DELETE r
        }
        RETURN n.id AS id
    ")
        .param("sourceId", source_id)
        .param("source", if ontology == "mondo" { "Mondo" } else { "HPO" })
        .param("name", name)
        .param("sourceUri", uri(source_id))
        .param("description", term["description"][0].as_str())
        .param("synonyms", synonyms)
        .param("ancestors", ancestors)
    ).await.map_err(internal)?;
    let id: String = rows.next().await.map_err(internal)?.ok_or_else(|| internal("adding a condition returned nothing"))?
        .get("id").map_err(internal)?;
    tracing::info!(source_id, condition_id = id, "added a condition");
    //the condition is usable without its links to the body, so a failure is only logged
    if let Err(e) = events::publish(&state.bus, "atlas.physical", "ConditionAdded", 1, json!({"conditionId": id})).await {
        tracing::error!(condition_id = id, "couldn't publish ConditionAdded: {e}");
    }
    one(&state, id).await
}

async fn one(state: &AppState, id: String) -> Result<Json<Condition>, (StatusCode, String)> {
    let condition = fetch(state, Some(vec![id])).await?.pop().ok_or_else(|| internal("a condition went missing"))?;
    Ok(Json(condition))
}

// ---------------------------------------------------------------------------------------------------------------------
// The logged in user's conditions
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Deserialize)]
struct MineRequest {
    severity: Option<String>,
    diagnosed: bool,
    managed: bool,
}

//notes that the logged in user has a condition, or changes what they've said about it
async fn set_mine(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>, Json(req): Json<MineRequest>) -> Result<StatusCode, (StatusCode, String)> {
    if req.severity.as_deref().is_some_and(|s| !SEVERITIES.contains(&s)) {
        return Err(bad("Pick mild, moderate or severe."));
    }
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId}), (c:Condition {id: $id})
        MERGE (p)-[h:HAS_CONDITION]->(c)
        SET h.severity = $severity, h.diagnosed = $diagnosed, h.managed = $managed, h.updatedAt = datetime()
        RETURN count(h) AS set
    ")
        .param("personId", user.person_id.as_str())
        .param("id", id.as_str())
        .param("severity", req.severity)
        .param("diagnosed", req.diagnosed)
        .param("managed", req.managed)
    ).await.map_err(internal)?;
    let set: i64 = rows.next().await.map_err(internal)?.map(|r| r.get("set")).transpose().map_err(internal)?.unwrap_or(0);
    if set == 0 {
        return Err((StatusCode::NOT_FOUND, "That condition doesn't exist.".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

//removes one of the logged in user's conditions
async fn clear_mine(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<StatusCode, (StatusCode, String)> {
    state.graph.run(query("
        MATCH (:Person {id: $personId})-[h:HAS_CONDITION]->(:Condition {id: $id})
        DELETE h
    ").param("personId", user.person_id.as_str()).param("id", id.as_str())).await.map_err(internal)?;
    Ok(StatusCode::NO_CONTENT)
}
