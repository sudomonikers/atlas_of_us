//everything a person is linked to, as one graph for the Overall view of their profile: them in the middle, their
//personality traits under their domains, the abilities they have a place on under their areas, their conditions and
//impairments, the topics they've placed themselves on and their skills. Between those, a skill links to the traits,
//abilities, topics and other skills its levels up to theirs take, and a condition or impairment to the abilities it can
//affect. Only what the person is linked to is on it
use axum::http::StatusCode;
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::domains::abilities::ABILITY_NEEDS_BODY;

use super::internal;

//a thing on the graph
#[derive(Serialize, Deserialize)]
pub struct GraphNode {
    pub(super) id: String,
    pub(super) label: String,
    pub(super) kind: String, //person, domain, trait, area, ability, condition, impairment, topic or skill
    value: Option<f64>, //where they stand, 0 to 1, on a trait or ability
    rank: Option<i64>, //their level in a topic or skill
}

//a link between two things on the graph
#[derive(Serialize, Deserialize)]
pub struct GraphLink {
    pub(super) from: String,
    pub(super) to: String,
    pub(super) kind: String, //has, takes_trait, takes_ability, takes_topic, takes_skill or affects
    weight: Option<f64>, //how much it matters, 0 to 1, on a skill's requirement
}

#[derive(Serialize)]
pub struct PersonGraph {
    pub(super) nodes: Vec<GraphNode>,
    pub(super) links: Vec<GraphLink>,
}

const NODES: &str = "
    MATCH (p:Person {id: $personId})
    CALL (p) {
        RETURN p.id AS id, p.firstName AS label, 'person' AS kind, null AS value, null AS rank
        UNION
        MATCH (p)-[:HAS_PERSONALITY_TRAIT]->(:PersonalityTrait)<-[:HAS_FACET]-(d:PersonalityDomain)
        RETURN DISTINCT 'domain:' + d.key AS id, d.name AS label, 'domain' AS kind, null AS value, null AS rank
        UNION
        MATCH (p)-[r:HAS_PERSONALITY_TRAIT]->(t:PersonalityTrait)
        RETURN t.id AS id, t.name AS label, 'trait' AS kind, toFloat(r.value) AS value, null AS rank
        UNION
        MATCH (p)-[:HAS_ABILITY]->(a:Ability)
        RETURN DISTINCT 'area:' + a.category AS id, a.category AS label, 'area' AS kind, null AS value, null AS rank
        UNION
        MATCH (p)-[h:HAS_ABILITY]->(a:Ability)
        RETURN a.id AS id, a.name AS label, 'ability' AS kind, toFloat(h.value) AS value, null AS rank
        UNION
        MATCH (p)-[:HAS_CONDITION]->(c:Condition)
        RETURN c.id AS id, coalesce(c.plainName, c.name) AS label, 'condition' AS kind, null AS value, null AS rank
        UNION
        MATCH (p)-[:HAS_IMPAIRMENT]->(t)
        RETURN t.id AS id, t.name AS label, 'impairment' AS kind, null AS value, null AS rank
        UNION
        MATCH (p)-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        RETURN t.id AS id, t.name AS label, 'topic' AS kind, null AS value, max(l.rank) AS rank
        UNION
        MATCH (p)-[:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        RETURN s.id AS id, s.name AS label, 'skill' AS kind, null AS value, max(l.rank) AS rank
    }
    RETURN id, label, kind, value, rank
";

//every link between what the person is linked to. A skill's requirements count up to the level they're at
const LINKS: &str = "
    MATCH (p:Person {id: $personId})
    CALL (p) {
        MATCH (p)-[:HAS_PERSONALITY_TRAIT]->(:PersonalityTrait)<-[:HAS_FACET]-(d:PersonalityDomain)
        RETURN DISTINCT p.id AS from, 'domain:' + d.key AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_PERSONALITY_TRAIT]->(t:PersonalityTrait)<-[:HAS_FACET]-(d:PersonalityDomain)
        RETURN 'domain:' + d.key AS from, t.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_ABILITY]->(a:Ability)
        RETURN DISTINCT p.id AS from, 'area:' + a.category AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_ABILITY]->(a:Ability)
        RETURN 'area:' + a.category AS from, a.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_CONDITION]->(c:Condition)
        RETURN p.id AS from, c.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_IMPAIRMENT]->(t)
        RETURN p.id AS from, t.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        RETURN DISTINCT p.id AS from, t.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)
        RETURN DISTINCT p.id AS from, s.id AS to, 'has' AS kind, null AS weight
        UNION
        MATCH (p)-[:ACHIEVED]->(mine:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_TRAIT]->(t:PersonalityTrait)
        WHERE l.rank <= mine.rank AND (p)-[:HAS_PERSONALITY_TRAIT]->(t)
        RETURN s.id AS from, t.id AS to, 'takes_trait' AS kind, max(r.strength) AS weight
        UNION
        MATCH (p)-[:ACHIEVED]->(mine:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_ABILITY]->(a:Ability)
        WHERE l.rank <= mine.rank AND (p)-[:HAS_ABILITY]->(a)
        RETURN s.id AS from, a.id AS to, 'takes_ability' AS kind, max(r.strength) AS weight
        UNION
        MATCH (p)-[:ACHIEVED]->(mine:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_KNOWLEDGE]->(:BloomLevel)<-[:HAS_LEVEL]-(t:Topic)
        WHERE l.rank <= mine.rank AND (p)-[:ENGAGES_TOPIC]->(:BloomLevel)<-[:HAS_LEVEL]-(t)
        RETURN s.id AS from, t.id AS to, 'takes_topic' AS kind, max(r.strength) AS weight
        UNION
        MATCH (p)-[:ACHIEVED]->(mine:DreyfusLevel)<-[:HAS_LEVEL]-(s:Skill)-[:HAS_LEVEL]->(l:DreyfusLevel)-[r:REQUIRES_SKILL]->(:DreyfusLevel)<-[:HAS_LEVEL]-(o:Skill)
        WHERE l.rank <= mine.rank AND o <> s AND (p)-[:ACHIEVED]->(:DreyfusLevel)<-[:HAS_LEVEL]-(o)
        RETURN s.id AS from, o.id AS to, 'takes_skill' AS kind, max(r.strength) AS weight
        UNION
        MATCH (p)-[:HAS_CONDITION]->(c:Condition)-[:AFFECTS]->(t), (p)-[:HAS_ABILITY]->(a:Ability)
        WHERE {ABILITY_NEEDS_BODY}
        RETURN DISTINCT c.id AS from, a.id AS to, 'affects' AS kind, null AS weight
        UNION
        MATCH (p)-[:HAS_IMPAIRMENT]->(t), (p)-[:HAS_ABILITY]->(a:Ability)
        WHERE {ABILITY_NEEDS_BODY}
        RETURN DISTINCT t.id AS from, a.id AS to, 'affects' AS kind, null AS weight
    }
    RETURN from, to, kind, weight
";

//the graph of everything a person is linked to. Says nothing about who may see it: the caller checks that
pub async fn person_graph(graph: &Graph, person_id: &str) -> Result<PersonGraph, (StatusCode, String)> {
    let mut rows = graph.execute(query(NODES).param("personId", person_id)).await.map_err(internal)?;
    let mut nodes = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        nodes.push(row.to::<GraphNode>().map_err(internal)?);
    }
    drop(rows); //the stream holds its pooled connection until it's dropped, and the next query needs one
    let mut rows = graph.execute(query(&LINKS.replace("{ABILITY_NEEDS_BODY}", ABILITY_NEEDS_BODY)).param("personId", person_id)).await.map_err(internal)?;
    let mut links = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        links.push(row.to::<GraphLink>().map_err(internal)?);
    }
    Ok(PersonGraph { nodes, links })
}
