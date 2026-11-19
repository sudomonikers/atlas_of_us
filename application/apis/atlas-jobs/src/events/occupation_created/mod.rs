//OccupationCreated: someone added an occupation, and each module works out its part of what the work takes, in its own
//job: Abilities (and the physical demands), Topics (knowledge), Skills and Personality. Each reads the occupations
//O*NET rates that are nearest it by meaning, as references for what work like it takes. When the last part is done
//the occupation is ready, and OccupationFilled is published. See "Where occupations come from" in
//documentation/architecture/occupations.md
pub mod abilities;
pub mod personality;
pub mod skills;
pub mod topics;

use std::{future::Future, time::Instant};

use atlas_shared::{events::Bus, occupations::PARTS};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tracing::Instrument;

use crate::bedrock::BoxError;

#[derive(Deserialize)]
struct Created {
    #[serde(rename = "occupationId")]
    occupation_id: String,
}

//the occupation as a model reads it
#[derive(Deserialize, Serialize)]
pub struct Occupation {
    pub title: String,
    pub description: Option<String>,
}

//how many of the nearest O*NET occupations a model reads as references
const REFERENCES: i64 = 5;

//runs one module's part for the occupation in the event: `work` writes the part and returns how many links it wrote.
//A part is done once, while the occupation is filling, so the event can arrive twice. A failure is marked on the
//occupation, which shows that part couldn't be worked out
pub async fn run<F, Fut>(graph: &Graph, detail: Value, part: &'static str, work: F)
where
    F: FnOnce(Graph, String, Occupation, Vec<String>) -> Fut,
    Fut: Future<Output = Result<usize, BoxError>>,
{
    let created = match serde_json::from_value::<Created>(detail) {
        Ok(created) => created,
        Err(e) => return tracing::error!("unreadable OccupationCreated: {e}"),
    };
    let span = tracing::info_span!("occupation_part", occupation_id = created.occupation_id, part);
    async {
        let started = Instant::now();
        let done: Result<Option<usize>, BoxError> = async {
            let Some(occupation) = load(graph, &created.occupation_id, part).await? else { return Ok(None) };
            let references = nearest(graph, &created.occupation_id).await?;
            let written = work(graph.clone(), created.occupation_id.clone(), occupation, references).await?;
            finish(graph, &created.occupation_id, part).await?;
            Ok(Some(written))
        }.await;
        match &done {
            Ok(Some(written)) => tracing::info!(written, "worked out the part"),
            Ok(None) => tracing::info!("the occupation isn't filling, or the part is already done, so it was left as it is"),
            Err(e) => {
                tracing::error!("working out the part failed: {e}");
                if let Err(e) = fail(graph, &created.occupation_id, part).await {
                    tracing::error!("couldn't mark the part failed: {e}");
                }
            }
        }
        tracing::info!(ok = done.is_ok(), latency_ms = started.elapsed().as_millis() as u64, "finished");
    }.instrument(span).await
}

//the occupation, while it's filling and the part isn't done
async fn load(graph: &Graph, id: &str, part: &str) -> Result<Option<Occupation>, BoxError> {
    let mut rows = graph.execute(query("
        MATCH (o:Occupation {id: $id, status: 'filling'})
        WHERE o[$part + 'At'] IS NULL
        RETURN o.title AS title, o.description AS description
    ").param("id", id).param("part", part)).await?;
    Ok(match rows.next().await? {
        Some(row) => Some(row.to::<Occupation>()?),
        None => None,
    })
}

//the O*NET codes of the occupations O*NET rates nearest the occupation by meaning, nearest first
async fn nearest(graph: &Graph, id: &str) -> Result<Vec<String>, BoxError> {
    let mut rows = graph.execute(query("
        MATCH (o:Occupation {id: $id}) WHERE o.vector IS NOT NULL
        CALL db.index.vector.queryNodes('occupation_vector', $k, o.vector) YIELD node AS r, score
        WHERE r.onetSoc IS NOT NULL
        RETURN r.onetSoc AS soc ORDER BY score DESC LIMIT $limit
    ").param("id", id).param("k", REFERENCES * 2).param("limit", REFERENCES)).await?;
    let mut socs = Vec::new();
    while let Some(row) = rows.next().await? {
        socs.push(row.get("soc")?);
    }
    Ok(socs)
}

//marks the part done. When it was the last, the occupation is ready, which publishes OccupationFilled, or failed when
//another part couldn't be worked out
async fn finish(graph: &Graph, id: &str, part: &str) -> Result<(), BoxError> {
    let mut rows = graph.execute(query("
        MATCH (o:Occupation {id: $id, status: 'filling'})
        SET o[$part + 'At'] = datetime()
        WITH o, all(p IN $parts WHERE o[p + 'At'] IS NOT NULL) AS complete,
             all(p IN $parts WHERE o[p + 'At'] IS NOT NULL OR o[p + 'FailedAt'] IS NOT NULL) AS settled
        SET o.status = CASE WHEN complete THEN 'ready' WHEN settled THEN 'failed' ELSE o.status END
        RETURN complete
    ").param("id", id).param("part", part).param("parts", PARTS.to_vec())).await?;
    let complete = match rows.next().await? {
        Some(row) => row.get::<bool>("complete")?,
        None => false,
    };
    drop(rows);
    if complete {
        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
        let bus: Option<Bus> = crate::events::bus(&config);
        //the occupation is ready without the event, so a failed publish is only logged
        if let Err(e) = atlas_shared::events::publish(&bus, "atlas.occupations", "OccupationFilled", 1, json!({"occupationId": id})).await {
            tracing::error!(occupation_id = id, "{e}");
        }
    }
    Ok(())
}

//marks the part as one that couldn't be worked out. The occupation is failed once nothing is still being worked out
async fn fail(graph: &Graph, id: &str, part: &str) -> Result<(), BoxError> {
    graph.run(query("
        MATCH (o:Occupation {id: $id, status: 'filling'})
        SET o[$part + 'FailedAt'] = datetime()
        WITH o
        WHERE all(p IN $parts WHERE o[p + 'At'] IS NOT NULL OR o[p + 'FailedAt'] IS NOT NULL)
        SET o.status = 'failed'
    ").param("id", id).param("part", part).param("parts", PARTS.to_vec())).await?;
    Ok(())
}

//how many of the existing topics or skills nearest the occupation a model is shown, so it uses the names we have
const NEARBY: i64 = 40;
//how close one has to be to be shown, as the vector index scores it ((1 + cosine) / 2)
const NEARBY_MIN_SCORE: f64 = 0.6;

//the names of the existing topics or skills nearest the occupation by meaning, from the vector index `index`
//(topic_vector or skill_vector), which embeds them the way occupations are embedded. A model names what the work takes
//by these where one fits, so the resolver finds them rather than making a near copy
pub async fn nearby(graph: &Graph, id: &str, index: &str) -> Result<Vec<String>, BoxError> {
    let mut rows = graph.execute(query("
        MATCH (o:Occupation {id: $id}) WHERE o.vector IS NOT NULL
        CALL db.index.vector.queryNodes($index, $k, o.vector) YIELD node, score
        WHERE score >= $min_score
        RETURN node.name AS name ORDER BY score DESC
    ").param("id", id).param("index", index).param("k", NEARBY).param("min_score", NEARBY_MIN_SCORE)).await?;
    let mut names = Vec::new();
    while let Some(row) = rows.next().await? {
        names.push(row.get("name")?);
    }
    Ok(names)
}

//O*NET's 1 to 5 importance, kept from 0 to 1 as the seed keeps it
pub fn importance(rated: f64) -> f64 {
    ((rated.clamp(1.0, 5.0) - 1.0) / 4.0 * 1000.0).round() / 1000.0
}
