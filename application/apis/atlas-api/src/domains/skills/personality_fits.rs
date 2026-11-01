//how well a person's personality suits skills: the skills that come naturally to them, and the ones they got good at
//against the pull of their personality. A skill's fit compares their score on each trait its levels take with where the
//level pulls, weighted by how much the trait matters
use axum::{Json, Router, extract::State, http::StatusCode, routing::get};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

use super::{SkillRef, internal};

pub fn router() -> Router<AppState> {
    Router::new().route("/personality-fits", get(personality_fits))
}

//a trait a skill's levels take, where the level pulls on it, and the person's score on it, 0 to 1
#[derive(Serialize, Deserialize)]
pub struct FitTrait {
    name: String,
    level: f64,
    yours: f64,
}

//a skill and how well the person's personality suits it, 0 to 1, with the traits that say the most about that
#[derive(Serialize, Deserialize)]
pub struct Fit {
    skill: SkillRef,
    fit: f64,
    traits: Vec<FitTrait>,
}

#[derive(Serialize)]
pub struct Fits {
    measured: bool, //whether the person has any trait scores yet
    natural: Vec<Fit>, //ready skills they haven't added that suit them best, best first
    against: Vec<Fit>, //skills they're at Competent or above in that suit them least, least first
}

//how many natural fits come at once, and how many skills against the grain
const NATURAL: i64 = 8;
const AGAINST: i64 = 3;
//a skill is against the grain below this fit
const AGAINST_THE_GRAIN: f64 = 0.7;

//the fit of each skill `s` from its trait requirements `r` on the person `p`'s traits `t`, as `fit`, with `measured`,
//the requirements they have a score for. Each trait's requirement comes from the highest level that names it. A skill
//is only scored when the traits measured carry most of the weight
const FIT: &str = "
    WITH p, s, t, r ORDER BY l.rank DESC
    WITH p, s, t, head(collect(r)) AS r
    OPTIONAL MATCH (p)-[y:HAS_PERSONALITY_TRAIT]->(t)
    WITH s, sum(r.strength) AS total, collect(CASE WHEN y IS NULL THEN null ELSE
        {name: t.name, level: r.level, yours: y.value, weight: r.strength, match: 1 - abs(y.value - r.level)} END) AS measured
    WITH s, total, measured, reduce(w = 0.0, m IN measured | w + m.weight) AS weight
    WHERE size(measured) >= 2 AND weight >= 0.6 * total
    WITH s, measured, reduce(f = 0.0, m IN measured | f + m.weight * m.match) / weight AS fit
";

async fn personality_fits(State(state): State<AppState>, user: AuthUser) -> Result<Json<Fits>, (StatusCode, String)> {
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN EXISTS { (p)-[:HAS_PERSONALITY_TRAIT]->() } AS measured
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let measured: bool = match rows.next().await.map_err(internal)? {
        Some(row) => row.get("measured").map_err(internal)?,
        None => false,
    };
    drop(rows);
    if !measured {
        return Ok(Json(Fits { measured, natural: Vec::new(), against: Vec::new() }));
    }

    //the traits that suit them best for a natural fit, and the ones that pull against them most for the grain
    let natural = query(&format!("
        MATCH (p:Person {{id: $personId}})
        MATCH (s:Skill {{status: 'ready'}})-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_TRAIT]->(t:PersonalityTrait)
        WHERE NOT EXISTS {{ (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s) }} AND NOT EXISTS {{ (p)-[:DOES_NOT_HAVE]->(s) }}
        {FIT}
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, fit,
               COLLECT {{ UNWIND measured AS m RETURN {{name: m.name, level: m.level, yours: m.yours}} ORDER BY m.weight * m.match DESC LIMIT 3 }} AS traits
        ORDER BY fit DESC, s.name
        LIMIT $limit
    ")).param("personId", user.person_id.as_str()).param("limit", NATURAL);
    let against = query(&format!("
        MATCH (p:Person {{id: $personId}})-[:ACHIEVED]->(at:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        WHERE at.rank >= 3
        MATCH (s)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_TRAIT]->(t:PersonalityTrait)
        WHERE l.rank <= at.rank
        {FIT}
        WHERE fit < $below
        RETURN {{id: s.id, name: s.name, status: s.status}} AS skill, fit,
               COLLECT {{ UNWIND measured AS m RETURN {{name: m.name, level: m.level, yours: m.yours}} ORDER BY m.weight * (1 - m.match) DESC LIMIT 3 }} AS traits
        ORDER BY fit, s.name
        LIMIT $limit
    ")).param("personId", user.person_id.as_str()).param("below", AGAINST_THE_GRAIN).param("limit", AGAINST);

    let mut found = Vec::new();
    for q in [natural, against] {
        let mut rows = state.graph.execute(q).await.map_err(internal)?;
        let mut fits = Vec::new();
        while let Some(row) = rows.next().await.map_err(internal)? {
            fits.push(row.to::<Fit>().map_err(internal)?);
        }
        found.push(fits);
    }
    let against = found.pop().unwrap_or_default();
    let natural = found.pop().unwrap_or_default();
    Ok(Json(Fits { measured, natural, against }))
}
