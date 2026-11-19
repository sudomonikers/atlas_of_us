//Occupations Graph: O*NET's occupations, each with what the work takes across the Atlas (TAKES_ABILITY,
//TAKES_KNOWLEDGE, TAKES_SKILL, TAKES_TRAIT), and how far a person is from each. See
//documentation/data_model/occupations/occupations.md and documentation/architecture/occupations.md
mod gates;

use std::collections::HashMap;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use atlas_shared::occupations::{PARTS, resolver};

use crate::{auth::AuthUser, bedrock, helpers::lucene, state::AppState};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::post(ask_for_occupation))
        .route("/search", get(search))
        .route("/closest", get(closest))
        .route("/{id}", get(get_occupation))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "That occupation doesn't exist.".to_string())
}

// ---------------------------------------------------------------------------------------------------------------------
// How far a person is from what an occupation takes
// ---------------------------------------------------------------------------------------------------------------------
//
// Every requirement gets a score from 0 to 1 for the person, 1 when they meet it, and an occupation's closeness is the
// mean of its scores, weighted by how important each requirement is. Knowledge counts once they've placed themselves on
// a topic, and then a topic they aren't on scores 0; skills count the same way once they're on a skill. Abilities and
// traits count once they've been measured. Coverage is the share of the occupation's weight that counts, which says how
// much the closeness rests on.

//abilities and work styles count from O*NET's "important", 3 of its 5, as knowledge and skills do in the seed
const IMPORTANT: f64 = 0.5;


// ---------------------------------------------------------------------------------------------------------------------
// What the work is like for the body
// ---------------------------------------------------------------------------------------------------------------------
//
// Each physical demand of the work (standing, loud noise) strains body functions and parts. A demand the work has
// people in often is set beside the impairments and conditions the person has noted in what it strains, for them
// alone. It never changes how close they are: an impairment is noted beside what it touches and decides nothing.

//a demand counts as often from 3.5 of O*NET's 5: between about half and more than half the time, or between monthly
//and weekly, over 0 to 1
const FREQUENT: f64 = 0.625;
//whether what the person noted, `x`, is the body function or part `t` a demand strains, or is part of it or a kind of
//it. Only upward, so a condition that affects something broad, such as pain anywhere, isn't taken for each kind of it
const TOUCHES: &str = "(x = t OR EXISTS { (x)-[:SUBPART_OF|PART_SUBTYPE_OF|SUBFUNCTION_OF*1..8]->(t) })";

//a knowledge requirement `r` to Bloom level `b`, and the person's own level `y`, null when they aren't on the topic.
//`onTopics` is whether they're on any topic
const KNOWLEDGE_SCORE: &str = "CASE WHEN NOT onTopics THEN null WHEN y IS NULL THEN 0.0 WHEN y.rank >= b.rank THEN 1.0 ELSE toFloat(y.rank) / b.rank END";
//a skill requirement to Dreyfus level `l`, and `yours`, the highest level the person has reached, null when they aren't
//on it. `onSkills` is whether they're on any skill
const SKILL_SCORE: &str = "CASE WHEN NOT onSkills THEN null WHEN yours IS NULL THEN 0.0 WHEN yours >= l.rank THEN 1.0 ELSE toFloat(yours) / l.rank END";
//whether the person `p` is on any topic and any skill, as `onTopics` and `onSkills`. False for no one
const ON: &str = "p IS NOT NULL AND EXISTS { (p)-[:ENGAGES_TOPIC]->() } AS onTopics,
    p IS NOT NULL AND EXISTS { (p)-[:ACHIEVED]->() } AS onSkills";
//an ability requirement `r` at `r.level` over 7, and where the person stands on it, `y.value` from 0 to 1, null when
//unmeasured. Both are read on one scale from 0 to 1, as a skill level's ability requirements are
const ABILITY_SCORE: &str = "CASE WHEN y IS NULL THEN null WHEN y.value >= r.level THEN 1.0 ELSE y.value / r.level END";
//where the work pulls on a trait: above the middle, further for the work styles that matter most, or below it for a
//trait's low end. `r` is TAKES_TRAIT
const TRAIT_TARGET: &str = "0.5 + 0.3 * r.importance";
//the person's score `y.value` on the trait read toward the end the work pulls on, against the target
const TRAIT_SCORE: &str = "CASE WHEN y IS NULL THEN null
    WHEN (CASE WHEN r.opposite THEN 1 - y.value ELSE y.value END) >= 0.5 + 0.3 * r.importance THEN 1.0
    ELSE (CASE WHEN r.opposite THEN 1 - y.value ELSE y.value END) / (0.5 + 0.3 * r.importance) END";

//every requirement of the occupation `o` for the person `p`, as rows of `weight` (its importance) and `score`, null
//when it doesn't count. Needs `onTopics` and `onSkills`
fn scored_requirements() -> String {
    format!("
        MATCH (o)-[r:TAKES_KNOWLEDGE]->(b:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(y:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN r.importance AS weight, {KNOWLEDGE_SCORE} AS score
        UNION ALL
        MATCH (o)-[r:TAKES_SKILL]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        OPTIONAL MATCH (p)-[:ACHIEVED]->(y:DreyfusLevel)<-[:HAS_LEVEL]-(s)
        WITH r, l, onSkills, max(y.rank) AS yours
        RETURN r.importance AS weight, {SKILL_SCORE} AS score
        UNION ALL
        MATCH (o)-[r:TAKES_ABILITY]->(a:Ability) WHERE r.importance >= $important AND r.level > 0
        OPTIONAL MATCH (p)-[y:HAS_ABILITY]->(a)
        RETURN r.importance AS weight, {ABILITY_SCORE} AS score
        UNION ALL
        MATCH (o)-[r:TAKES_TRAIT]->(t:PersonalityTrait) WHERE r.importance >= $important
        OPTIONAL MATCH (p)-[y:HAS_PERSONALITY_TRAIT]->(t)
        RETURN r.importance AS weight, {TRAIT_SCORE} AS score
    ")
}

// ---------------------------------------------------------------------------------------------------------------------
// Searching for an occupation
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct OccupationRef {
    id: String,
    title: String,
    description: String,
}

#[derive(Deserialize)]
pub struct SearchParams {
    q: String,
}

const SEARCH_RESULTS: usize = 12;
const SEARCH_CANDIDATES: i64 = 24;
//how close an occupation has to be by meaning to be found, as the vector index scores it ((1 + cosine) / 2)
const SEARCH_MIN_SCORE: f64 = 0.6;
//reciprocal rank fusion's constant, as skills search uses
const RRF_K: f64 = 60.0;

//the occupations closest to what was typed, by title and other titles and by meaning
async fn search(State(state): State<AppState>, Query(params): Query<SearchParams>) -> Result<Json<Vec<OccupationRef>>, (StatusCode, String)> {
    let q = params.q.trim();
    if q.is_empty() {
        return Ok(Json(Vec::new()));
    }
    if q.chars().count() > 200 {
        return Err((StatusCode::BAD_REQUEST, "That search is too long.".to_string()));
    }

    let mut ranked: Vec<Vec<String>> = Vec::new();
    if let Some(lucene) = lucene::query(q) {
        let mut rows = state.graph.execute(query("
            CALL db.index.fulltext.queryNodes('occupation_titles', $lucene, {limit: $limit}) YIELD node
            RETURN node.id AS id
        ").param("lucene", lucene).param("limit", SEARCH_CANDIDATES)).await.map_err(internal)?;
        ranked.push(ids(&mut rows).await.map_err(internal)?);
    }
    //by meaning. Search still works by title when the embedding can't be made
    match bedrock::embed(&state.bedrock, q).await {
        Ok(vector) => {
            let mut rows = state.graph.execute(query("
                CALL db.index.vector.queryNodes('occupation_vector', $k, $vector) YIELD node, score
                WHERE score >= $min_score
                RETURN node.id AS id
            ").param("k", SEARCH_CANDIDATES).param("vector", vector).param("min_score", SEARCH_MIN_SCORE)).await.map_err(internal)?;
            ranked.push(ids(&mut rows).await.map_err(internal)?);
        }
        Err(e) => tracing::error!("couldn't embed the search, searching by title only: {e}"),
    }

    let mut scores: HashMap<String, f64> = HashMap::new();
    for list in &ranked {
        for (rank, id) in list.iter().enumerate() {
            *scores.entry(id.clone()).or_default() += 1.0 / (RRF_K + rank as f64 + 1.0);
        }
    }
    let mut best: Vec<(String, f64)> = scores.into_iter().collect();
    best.sort_by(|a, b| b.1.total_cmp(&a.1));
    let best: Vec<String> = best.into_iter().take(SEARCH_RESULTS).map(|(id, _)| id).collect();

    let mut rows = state.graph.execute(query("
        UNWIND range(0, size($ids) - 1) AS i
        MATCH (o:Occupation {id: $ids[i]})
        RETURN o.id AS id, o.title AS title, o.description AS description
        ORDER BY i
    ").param("ids", best)).await.map_err(internal)?;
    let mut found = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        found.push(row.to::<OccupationRef>().map_err(internal)?);
    }
    Ok(Json(found))
}

async fn ids(rows: &mut neo4rs::DetachedRowStream) -> Result<Vec<String>, BoxError> {
    let mut ids = Vec::new();
    while let Some(row) = rows.next().await? {
        ids.push(row.get("id")?);
    }
    Ok(ids)
}

// ---------------------------------------------------------------------------------------------------------------------
// Asking for an occupation we don't have
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct AskRequest {
    query: String, //what the user typed
}

//what came of asking for an occupation
#[derive(Serialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum AskOutcome {
    //it's something else: kind is skill, topic or other
    NotAnOccupation { kind: String, name: String },
    //nonsense, or a slur
    Rejected { reason: String },
    //an occupation we already have
    Existing { occupation: OccupationRef },
    //a new occupation, whose modules are working out what it takes
    Created { occupation: OccupationRef },
}

//adds an occupation someone asked for: the gates name and screen it, the resolver decides whether we have it, and a new
//one publishes OccupationCreated, which each module answers with its part of what the work takes
async fn ask_for_occupation(State(state): State<AppState>, _user: AuthUser, Json(req): Json<AskRequest>) -> Result<Json<AskOutcome>, (StatusCode, String)> {
    let typed = req.query.trim();
    if typed.is_empty() || typed.chars().count() > 100 {
        return Err((StatusCode::BAD_REQUEST, "Describe the occupation in 100 characters or fewer.".to_string()));
    }

    let screening = gates::screen(&state, typed).await.map_err(internal)?;
    tracing::info!(kind = screening.kind, acceptable = screening.acceptable, "screened an occupation request");
    if !screening.acceptable {
        return Ok(Json(AskOutcome::Rejected { reason: screening.rejection_reason }));
    }
    if screening.kind != "occupation" {
        return Ok(Json(AskOutcome::NotAnOccupation { kind: screening.kind, name: screening.title }));
    }

    let (resolution, vector) = resolver::resolve(&state.graph, &state.bedrock, &screening.title, &screening.description).await.map_err(internal)?;
    let (id, created) = match resolution {
        resolver::Resolution::Same { occupation_id } => (occupation_id, false),
        resolver::Resolution::New => {
            (resolver::create(&state.graph, &state.bus, &screening.title, &screening.description, vector).await.map_err(internal)?, true)
        }
    };
    tracing::info!(occupation_id = id, created, "resolved an occupation request");
    let mut rows = state.graph.execute(query("
        MATCH (o:Occupation {id: $id})
        RETURN o.id AS id, o.title AS title, o.description AS description
    ").param("id", id.as_str())).await.map_err(internal)?;
    let occupation = rows.next().await.map_err(internal)?.ok_or_else(not_found)?.to::<OccupationRef>().map_err(internal)?;
    Ok(Json(if created { AskOutcome::Created { occupation } } else { AskOutcome::Existing { occupation } }))
}

// ---------------------------------------------------------------------------------------------------------------------
// The occupations closest to a person
// ---------------------------------------------------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct Close {
    id: String,
    title: String,
    description: String,
    closeness: f64, //0 to 1
    coverage: f64,  //the share of the occupation's weight that's measured, 0 to 1
    met: i64,       //requirements they meet
    requirements: i64,
}

#[derive(Serialize)]
pub struct Closest {
    //what the person has given that the comparison can use: the topics and skills they're on, and whether their
    //abilities and personality have been measured
    topics: i64,
    skills: i64,
    abilities: bool,
    personality: bool,
    occupations: Vec<Close>,
}

//how many of the closest come at once
const CLOSEST: i64 = 40;

//every occupation, closest to the logged in user first
async fn closest(State(state): State<AppState>, user: AuthUser) -> Result<Json<Closest>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN COUNT { (p)-[:ENGAGES_TOPIC]->() } AS topics,
               COUNT { MATCH (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill) RETURN DISTINCT s } AS skills,
               EXISTS { (p)-[:HAS_ABILITY]->() } AS abilities,
               EXISTS { (p)-[:HAS_PERSONALITY_TRAIT]->() } AS personality
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let (topics, skills): (i64, i64) = (row.get("topics").map_err(internal)?, row.get("skills").map_err(internal)?);
    let (abilities, personality): (bool, bool) = (row.get("abilities").map_err(internal)?, row.get("personality").map_err(internal)?);
    drop(rows);
    if topics == 0 && skills == 0 && !abilities && !personality {
        return Ok(Json(Closest { topics, skills, abilities, personality, occupations: Vec::new() }));
    }

    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})
        WITH p, {ON}
        MATCH (o:Occupation {{status: 'ready'}})
        CALL (p, o, onTopics, onSkills) {{ {requirements} }}
        WITH o, sum(weight) AS total,
             sum(CASE WHEN score IS NULL THEN 0.0 ELSE weight END) AS measured,
             sum(coalesce(score, 0.0) * weight) AS points,
             count(CASE WHEN score >= 1.0 THEN 1 END) AS met, count(*) AS requirements
        WHERE measured > 0
        RETURN o.id AS id, o.title AS title, o.description AS description, points / measured AS closeness,
               measured / total AS coverage, met, requirements
        ORDER BY closeness DESC, coverage DESC, title
        LIMIT $limit
    ", requirements = scored_requirements()))
        .param("personId", user.person_id.as_str())
        .param("important", IMPORTANT)
        .param("limit", CLOSEST)
    ).await.map_err(internal)?;
    let mut occupations = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        occupations.push(row.to::<Close>().map_err(internal)?);
    }
    Ok(Json(Closest { topics, skills, abilities, personality, occupations }))
}

// ---------------------------------------------------------------------------------------------------------------------
// One occupation, and how far the person is from it
// ---------------------------------------------------------------------------------------------------------------------

//a topic or skill the occupation takes, to the level `rank`, with the person's own level in it. No score until they're
//on a topic, or a skill
#[derive(Serialize, Deserialize)]
pub struct LevelRequirement {
    id: String,
    name: String,
    status: String,
    rank: i64,
    importance: f64,
    yours: Option<i64>,
    score: Option<f64>,
}

//an ability the occupation takes, at `level` from 0 to 1, with where the person stands on it
#[derive(Serialize, Deserialize)]
pub struct AbilityRequirement {
    id: String,
    name: String,
    level: f64,
    importance: f64,
    yours: Option<f64>,
    score: Option<f64>,
}

//a trait that matters to the work, where the work pulls on it (`target`, toward its low end when `opposite`), with the
//person's score on it
#[derive(Serialize, Deserialize)]
pub struct TraitRequirement {
    name: String,
    importance: f64,
    opposite: bool,
    target: f64,
    yours: Option<f64>,
    score: Option<f64>,
}

//a physical demand of the work, how often it has people in it from 0 (never) to 1 (continually, or every day), and
//for a logged in user, what they've noted that it strains when it's often
#[derive(Serialize, Deserialize)]
pub struct Demand {
    name: String,
    group: String, //position, environment or hazard
    frequency: f64,
    noted: Vec<String>,
}

#[derive(Serialize)]
pub struct Occupation {
    id: String,
    onet_soc: Option<String>, //O*NET's code, for one of its occupations. None for one someone added
    status: String,           //filling while its modules work out what it takes, then ready
    pending: Vec<String>,     //the parts still being worked out: abilities, knowledge, skills or personality
    failed: Vec<String>,      //the parts that couldn't be worked out
    title: String,
    description: String,
    alternate_titles: Vec<String>,
    knowledge: Vec<LevelRequirement>,
    skills: Vec<LevelRequirement>,
    abilities: Vec<AbilityRequirement>,
    traits: Vec<TraitRequirement>,
    demands: Vec<Demand>,
    //for a logged in user: how close they are, and how much of that is measured. None for anyone else
    closeness: Option<f64>,
    coverage: Option<f64>,
}

//an occupation with everything it takes, most important first, and its physical demands, most often first. For a
//logged in user, each requirement has their own level and score, and each frequent demand what they've noted it strains
async fn get_occupation(State(state): State<AppState>, user: Option<AuthUser>, Path(id): Path<String>) -> Result<Json<Occupation>, (StatusCode, String)> {
    let person_id = user.map(|u| u.person_id).unwrap_or_default();
    let mut rows = state.graph.execute(query(&format!("
        MATCH (o:Occupation {{id: $id}})
        OPTIONAL MATCH (p:Person {{id: $personId}})
        WITH o, p, {ON}
        RETURN o.id AS id, o.onetSoc AS onet_soc, o.title AS title, o.description AS description,
               coalesce(o.status, 'ready') AS status,
               [part IN $parts WHERE o.status = 'filling' AND o[part + 'At'] IS NULL AND o[part + 'FailedAt'] IS NULL] AS pending,
               [part IN $parts WHERE o[part + 'FailedAt'] IS NOT NULL] AS failed,
               coalesce(o.alternateTitles, []) AS alternate_titles,
               COLLECT {{
                   MATCH (o)-[r:TAKES_KNOWLEDGE]->(b:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
                   OPTIONAL MATCH (p)-[:ENGAGES_TOPIC]->(y:BloomLevel)<-[:HAS_LEVEL]-(t)
                   RETURN {{id: t.id, name: t.name, status: t.status, rank: b.rank, importance: r.importance,
                           yours: y.rank, score: {KNOWLEDGE_SCORE}}} AS k ORDER BY r.importance DESC, t.name
               }} AS knowledge,
               COLLECT {{
                   MATCH (o)-[r:TAKES_SKILL]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
                   OPTIONAL MATCH (p)-[:ACHIEVED]->(y:DreyfusLevel)<-[:HAS_LEVEL]-(s)
                   WITH r, l, s, onSkills, max(y.rank) AS yours
                   RETURN {{id: s.id, name: s.name, status: s.status, rank: l.rank, importance: r.importance,
                           yours: yours, score: {SKILL_SCORE}}} AS k ORDER BY r.importance DESC, s.name
               }} AS skills,
               COLLECT {{
                   MATCH (o)-[r:TAKES_ABILITY]->(a:Ability) WHERE r.importance >= $important AND r.level > 0
                   OPTIONAL MATCH (p)-[y:HAS_ABILITY]->(a)
                   RETURN {{id: a.id, name: a.name, level: r.level, importance: r.importance, yours: y.value,
                           score: {ABILITY_SCORE}}} AS k ORDER BY r.importance DESC, a.name
               }} AS abilities,
               COLLECT {{
                   MATCH (o)-[r:TAKES_TRAIT]->(t:PersonalityTrait) WHERE r.importance >= $important
                   OPTIONAL MATCH (p)-[y:HAS_PERSONALITY_TRAIT]->(t)
                   RETURN {{name: t.name, importance: r.importance, opposite: r.opposite, target: {TRAIT_TARGET},
                           yours: y.value, score: {TRAIT_SCORE}}} AS k ORDER BY r.importance DESC, t.name
               }} AS traits,
               COLLECT {{
                   MATCH (o)-[h:HAS_DEMAND]->(d:WorkDemand)
                   RETURN {{name: d.name, group: d.group, frequency: h.frequency,
                           noted: CASE WHEN p IS NULL OR h.frequency < $frequent THEN [] ELSE COLLECT {{
                               MATCH (d)-[:STRAINS]->(t), (p)-[:HAS_IMPAIRMENT]->(x) WHERE {TOUCHES}
                               RETURN x.name AS noted
                               UNION
                               MATCH (d)-[:STRAINS]->(t), (p)-[:HAS_CONDITION]->(c:Condition)-[:AFFECTS]->(x) WHERE {TOUCHES}
                               RETURN coalesce(c.plainName, c.name) AS noted
                           }} END}} AS k ORDER BY h.frequency DESC, d.name
               }} AS demands,
               p IS NOT NULL AS person
    "))
        .param("id", id.as_str())
        .param("personId", person_id.as_str())
        .param("important", IMPORTANT)
        .param("frequent", FREQUENT)
        .param("parts", PARTS.to_vec())
    ).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    let knowledge: Vec<LevelRequirement> = row.get("knowledge").map_err(internal)?;
    let skills: Vec<LevelRequirement> = row.get("skills").map_err(internal)?;
    let abilities: Vec<AbilityRequirement> = row.get("abilities").map_err(internal)?;
    let traits: Vec<TraitRequirement> = row.get("traits").map_err(internal)?;
    let demands: Vec<Demand> = row.get("demands").map_err(internal)?;
    let person: bool = row.get("person").map_err(internal)?;

    //the same weighted mean the closest list ranks by
    let (closeness, coverage) = if person {
        let scores = knowledge.iter().chain(&skills).map(|r| (r.importance, r.score))
            .chain(abilities.iter().map(|r| (r.importance, r.score)))
            .chain(traits.iter().map(|r| (r.importance, r.score)));
        let (mut total, mut measured, mut points) = (0.0, 0.0, 0.0);
        for (weight, score) in scores {
            total += weight;
            if let Some(score) = score {
                measured += weight;
                points += weight * score;
            }
        }
        (Some(if measured > 0.0 { points / measured } else { 0.0 }), Some(if total > 0.0 { measured / total } else { 0.0 }))
    } else {
        (None, None)
    };

    Ok(Json(Occupation {
        id: row.get("id").map_err(internal)?,
        onet_soc: row.get("onet_soc").map_err(internal)?,
        status: row.get("status").map_err(internal)?,
        pending: row.get("pending").map_err(internal)?,
        failed: row.get("failed").map_err(internal)?,
        title: row.get("title").map_err(internal)?,
        description: row.get("description").map_err(internal)?,
        alternate_titles: row.get("alternate_titles").map_err(internal)?,
        knowledge,
        skills,
        abilities,
        traits,
        demands,
        closeness,
        coverage,
    }))
}
