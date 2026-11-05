//the anatomy: every part of the body, from FMA, to explore on the 3D body and learn about, each with the wholes it
//belongs to and the parts it's made of, the kinds it is, the functions, conditions, measurements and impairments that
//relate to it, the skills that rely on what it lets you do, and the topics to learn more about it in. See "Learning about the body" in documentation/architecture/physical.md
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::internal;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/anatomy", get(anatomy))
        .route("/anatomy/{id}", get(part))
}

fn not_found() -> (StatusCode, String) {
    (StatusCode::NOT_FOUND, "That body part doesn't exist.".to_string())
}

//a part as the 3D body and the search need it
#[derive(Serialize, Deserialize)]
pub struct PartSummary {
    id: String,
    fma_id: String,
    name: String,
    synonyms: Vec<String>,
    wholes: Vec<String>, //the ids of the parts it belongs to
    drawn: bool,         //whether the 3D body has a model of it
}

//every part of the body
async fn anatomy(State(state): State<AppState>, _user: AuthUser) -> Result<Json<Vec<PartSummary>>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:BodyPart)
        RETURN p.id AS id, p.fmaId AS fma_id, p.name AS name, coalesce(p.synonyms, []) AS synonyms,
               COLLECT { MATCH (p)-[:SUBPART_OF]->(w:BodyPart) RETURN w.id } AS wholes,
               size(coalesce(p.elements, [])) > 0 AS drawn
        ORDER BY toLower(p.name)
    ")).await.map_err(internal)?;
    let mut parts = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        parts.push(row.to::<PartSummary>().map_err(internal)?);
    }
    Ok(Json(parts))
}

//another part, as a link
#[derive(Serialize, Deserialize)]
pub struct PartRef {
    id: String,
    name: String,
}

//how far up and down the anatomy a part's related data is gathered from
const DEPTH: i64 = 8;
//FMA's whole body, which everything is part of, so it passes nothing on to its parts
const HUMAN_BODY: &str = "FMA20394";

//a function the part carries out, with the abilities it underlies. `through` is the part that carries it out when it's
//one the part belongs to or is made of
#[derive(Serialize, Deserialize)]
pub struct Served {
    id: String,
    name: String,
    description: Option<String>,
    abilities: Vec<String>,
    through: Option<String>,
}

//a condition that affects the part, the parts it belongs to or is made of, or the functions it carries out. `through`
//names that part or function when it isn't this part
#[derive(Serialize, Deserialize)]
pub struct Affecting {
    id: String,
    name: String,
    description: Option<String>,
    through: Option<String>,
}

//a measurement of the part, of a part it belongs to or is made of, or of a function it carries out
#[derive(Serialize, Deserialize)]
pub struct Measuring {
    id: String,
    name: String,
    through: Option<String>,
}

//one of the logged in user's impairments, in the part, a part it belongs to or is made of, or a function it carries out
#[derive(Serialize, Deserialize)]
pub struct Impaired {
    id: String, //the function or part it's in
    name: String,
    extent: String,
    through: Option<String>,
}

//a topic to learn more about the part in, from the part, a part it belongs to or a part it's made of, which `through`
//names when it isn't this part
#[derive(Serialize, Deserialize)]
pub struct Covering {
    id: String,
    name: String,
    status: String,
    through: Option<String>,
}

//a skill with a level that takes an ability the part's functions underlie, and whether it's one of the logged in user's,
//one they're on or have a goal in
#[derive(Serialize, Deserialize)]
pub struct Relying {
    id: String,
    name: String,
    abilities: Vec<String>, //the part's abilities it takes
    yours: bool,
}

//how many of the skills that rely on a part come with it
const SKILLS: i64 = 12;

#[derive(Serialize, Deserialize)]
pub struct Part {
    id: String,
    fma_id: String,
    name: String,
    definition: Option<String>,
    synonyms: Vec<String>,
    elements: Vec<String>, //the meshes of the 3D body it's drawn with
    wholes: Vec<PartRef>,  //the parts it belongs to
    parts: Vec<PartRef>,   //the parts it's made of
    kinds: Vec<PartRef>,   //the kinds of part it is
    subtypes: Vec<PartRef>, //the more specific kinds of it
    functions: Vec<Served>,
    conditions: Vec<Affecting>,
    measurements: Vec<Measuring>,
    impairments: Vec<Impaired>,
    skills: Vec<Relying>, //the user's own first, then the ones that rely on it most
    skills_total: i64,
    topics: Vec<Covering>,
}

//a part of the body and everything to learn about it. What's linked to the parts it belongs to (above) and is made of
//(below) counts for it too, as does what's linked to the functions those carry out: the left lung carries out
//respiration because the lung does, and asthma affects it. Each list puts what's linked to the part itself first, then
//what comes from above, below and through functions. The skills that rely on it are the ones whose levels take the
//abilities its functions underlie
async fn part(State(state): State<AppState>, user: AuthUser, Path(id): Path<String>) -> Result<Json<Part>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:BodyPart {{id: $id}})
        WITH p,
             COLLECT {{ MATCH (p)-[:SUBPART_OF|PART_SUBTYPE_OF*1..{DEPTH}]->(a:BodyPart) WHERE a.fmaId <> $root RETURN DISTINCT a }} AS above,
             COLLECT {{ MATCH (d:BodyPart)-[:SUBPART_OF|PART_SUBTYPE_OF*1..{DEPTH}]->(p) RETURN DISTINCT d }} AS below
        WITH p, above, below, [p] + above + below AS related
        WITH p, above, below, related,
             COLLECT {{ UNWIND related AS r MATCH (r)-[:SERVES]->(f:BodyFunction) RETURN DISTINCT f }} AS functions
        WITH p, above, below, related, functions, related + functions AS linked,
             COLLECT {{ UNWIND functions AS f MATCH (f)-[:UNDERLIES]->(a:Ability) RETURN DISTINCT a }} AS abilities
        MATCH (me:Person {{id: $personId}})
        RETURN p.id AS id, p.fmaId AS fma_id, p.name AS name, p.definition AS definition,
               coalesce(p.synonyms, []) AS synonyms, coalesce(p.elements, []) AS elements,
               COLLECT {{ MATCH (p)-[:SUBPART_OF]->(o:BodyPart) RETURN {{id: o.id, name: o.name}} ORDER BY o.name }} AS wholes,
               COLLECT {{ MATCH (o:BodyPart)-[:SUBPART_OF]->(p) RETURN {{id: o.id, name: o.name}} ORDER BY o.name }} AS parts,
               COLLECT {{ MATCH (p)-[:PART_SUBTYPE_OF]->(o:BodyPart) RETURN {{id: o.id, name: o.name}} ORDER BY o.name }} AS kinds,
               COLLECT {{ MATCH (o:BodyPart)-[:PART_SUBTYPE_OF]->(p) RETURN {{id: o.id, name: o.name}} ORDER BY o.name }} AS subtypes,
               COLLECT {{
                   UNWIND functions AS f
                   WITH f, COLLECT {{ UNWIND related AS r MATCH (r)-[:SERVES]->(f) RETURN r
                                      ORDER BY CASE WHEN r = p THEN 0 WHEN r IN above THEN 1 ELSE 2 END, r.name }}[0] AS by
                   RETURN {{
                       id: f.id, name: f.name, description: f.description,
                       abilities: COLLECT {{ MATCH (f)-[:UNDERLIES]->(a:Ability) RETURN a.name ORDER BY a.name }},
                       through: CASE WHEN by = p THEN null ELSE by.name END
                   }} ORDER BY CASE WHEN by = p THEN 0 WHEN by IN above THEN 1 ELSE 2 END, f.code
               }} AS functions,
               COLLECT {{
                   UNWIND linked AS t
                   MATCH (c:Condition)-[:AFFECTS]->(t)
                   WITH c, t, CASE WHEN t = p THEN 0 WHEN t IN above THEN 1 WHEN t:BodyFunction THEN 3 ELSE 2 END AS rank
                   ORDER BY rank, t.name
                   WITH c, collect(t)[0] AS t, min(rank) AS rank
                   RETURN {{id: c.id, name: c.name, description: c.description, through: CASE WHEN t = p THEN null ELSE t.name END}}
                   ORDER BY rank, toLower(c.name)
               }} AS conditions,
               COLLECT {{
                   UNWIND linked AS t
                   MATCH (m:PhysicalMeasurement)-[:MEASURES]->(t)
                   WITH m, t, CASE WHEN t = p THEN 0 WHEN t IN above THEN 1 WHEN t:BodyFunction THEN 3 ELSE 2 END AS rank
                   ORDER BY rank, t.name
                   WITH m, collect(t)[0] AS t, min(rank) AS rank
                   RETURN {{id: m.id, name: m.name, through: CASE WHEN t = p THEN null ELSE t.name END}}
                   ORDER BY rank, m.name
               }} AS measurements,
               COLLECT {{
                   UNWIND linked AS t
                   MATCH (:Person {{id: $personId}})-[i:HAS_IMPAIRMENT]->(t)
                   WITH t, i, CASE WHEN t = p THEN 0 WHEN t IN above THEN 1 WHEN t:BodyFunction THEN 3 ELSE 2 END AS rank
                   RETURN {{id: t.id, name: t.name, extent: i.extent, through: CASE WHEN t = p THEN null ELSE t.name END}}
                   ORDER BY rank, t.name
               }} AS impairments,
               COLLECT {{
                   UNWIND abilities AS a
                   MATCH (s:Skill)-[:HAS_LEVEL]->(:DreyfusLevel)-[r:REQUIRES_ABILITY]->(a)
                   WITH s, a, max(r.strength) AS strength ORDER BY strength DESC
                   WITH s, collect(a.name) AS names, max(strength) AS strength,
                        EXISTS {{ (me)-[:ACHIEVED|WANTS_TO_REACH]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s) }} AS yours
                   RETURN {{id: s.id, name: s.name, abilities: names, yours: yours}}
                   ORDER BY yours DESC, strength DESC, s.name
                   LIMIT $skills
               }} AS skills,
               COUNT {{
                   UNWIND abilities AS a
                   MATCH (s:Skill)-[:HAS_LEVEL]->(:DreyfusLevel)-[:REQUIRES_ABILITY]->(a)
                   RETURN DISTINCT s
               }} AS skills_total,
               COLLECT {{
                   UNWIND related AS r
                   MATCH (t:Topic)-[:COVERS]->(r)
                   WITH t, r, CASE WHEN r = p THEN 0 WHEN r IN above THEN 1 ELSE 2 END AS rank
                   ORDER BY rank, r.name
                   WITH t, collect(r)[0] AS r, min(rank) AS rank
                   RETURN {{id: t.id, name: t.name, status: t.status, through: CASE WHEN r = p THEN null ELSE r.name END}}
                   ORDER BY rank, t.name
               }} AS topics
    "))
        .param("id", id)
        .param("root", HUMAN_BODY)
        .param("skills", SKILLS)
        .param("personId", user.person_id.as_str())
    ).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?.ok_or_else(not_found)?;
    Ok(Json(row.to::<Part>().map_err(internal)?))
}
