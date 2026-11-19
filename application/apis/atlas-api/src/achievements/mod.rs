//achievements: the noteworthy things a person did, such as an award, a certification or a result they can point to,
//each an Achievement they HAS_ACHIEVEMENT that DEMONSTRATES the skills and topics it shows. Importing a resume adds
//them (resume/), and their profile shows them. See documentation/data_model/achievements/achievements.md
use axum::http::StatusCode;
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

//a skill or topic an achievement demonstrates
#[derive(Serialize, Deserialize)]
pub struct Demonstrated {
    pub id: String,
    pub name: String,
    pub kind: String, //skill or topic
}

//one of someone's achievements, with what it demonstrates
#[derive(Serialize, Deserialize)]
pub struct PersonAchievement {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub year: Option<i64>,
    pub demonstrates: Vec<Demonstrated>, //skills first, then topics, each by name
}

//someone's achievements, the most recent first, with the ones without a year after
pub async fn person_achievements(graph: &Graph, person_id: &str) -> Result<Vec<PersonAchievement>, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (:Person {id: $personId})-[:HAS_ACHIEVEMENT]->(a:Achievement)
        RETURN a.id AS id, a.title AS title, a.description AS description, a.year AS year,
               COLLECT {
                   MATCH (a)-[:DEMONSTRATES]->(n) WHERE n:Skill OR n:Topic
                   WITH n, CASE WHEN n:Skill THEN 'skill' ELSE 'topic' END AS kind
                   RETURN {id: n.id, name: n.name, kind: kind} ORDER BY kind, n.name
               } AS demonstrates
        ORDER BY a.year IS NULL, a.year DESC, a.createdAt DESC
    ").param("personId", person_id)).await.map_err(internal)?;
    let mut achievements = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        achievements.push(row.to::<PersonAchievement>().map_err(internal)?);
    }
    Ok(achievements)
}

//adds an achievement to the person, demonstrating the skills and topics with these ids. One with the same title, in
//any case, is the same achievement, so adding it again adds its links rather than a second one. `source` is where it
//came from, such as resume
pub async fn add(graph: &Graph, person_id: &str, source: &str, title: &str, description: &str, year: Option<i64>, skill_ids: &[String], topic_ids: &[String]) -> Result<(), neo4rs::Error> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (p)-[:HAS_ACHIEVEMENT]->(old:Achievement) WHERE toLower(old.title) = toLower($title)
        RETURN head(collect(old.id)) AS id
    ").param("personId", person_id).param("title", title)).await?;
    let existing: Option<String> = match rows.next().await? {
        Some(row) => row.get("id").unwrap_or(None),
        None => return Ok(()),
    };
    drop(rows);
    graph.run(query("
        MATCH (p:Person {id: $personId})
        CALL (p) {
            WITH p WHERE $id IS NULL
            CREATE (p)-[:HAS_ACHIEVEMENT]->(a:Achievement {id: randomUUID(), title: $title, source: $source, createdAt: datetime()})
            RETURN a
            UNION
            WITH p WHERE $id IS NOT NULL
            MATCH (p)-[:HAS_ACHIEVEMENT]->(a:Achievement {id: $id})
            RETURN a
        }
        SET a.description = $description, a.year = coalesce($year, a.year)
        WITH a
        CALL (a) {
            UNWIND $skillIds AS id
            MATCH (s:Skill {id: id})
            MERGE (a)-[:DEMONSTRATES]->(s)
        }
        CALL (a) {
            UNWIND $topicIds AS id
            MATCH (t:Topic {id: id})
            MERGE (a)-[:DEMONSTRATES]->(t)
        }
    ")
        .param("personId", person_id)
        .param("id", existing)
        .param("source", source)
        .param("title", title)
        .param("description", description)
        .param("year", year)
        .param("skillIds", skill_ids.to_vec())
        .param("topicIds", topic_ids.to_vec())
    ).await
}

//the person's achievements from `source`, such as resume, as their ids and titles
pub async fn titles(graph: &Graph, person_id: &str, source: Option<&str>) -> Result<Vec<(String, String)>, neo4rs::Error> {
    let mut rows = graph.execute(query("
        MATCH (:Person {id: $personId})-[:HAS_ACHIEVEMENT]->(a:Achievement)
        WHERE $source IS NULL OR a.source = $source
        RETURN a.id AS id, a.title AS title ORDER BY a.title
    ").param("personId", person_id).param("source", source)).await?;
    let mut titles = Vec::new();
    while let Some(row) = rows.next().await? {
        titles.push((row.get("id")?, row.get("title")?));
    }
    Ok(titles)
}
