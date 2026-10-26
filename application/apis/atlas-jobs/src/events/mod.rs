//the Atlas event bus (infrastructure/events.tf). Every module publishes what happened to its sub-graph, and each module
//that reacts has its own rule and queue into this worker. Events are thin: they name the nodes it happened to, and
//consumers read the graph for the rest
use std::env;

use atlas_shared::events::Bus;
use neo4rs::Graph;
use serde::Deserialize;
use serde_json::Value;

//one folder per event, and in it one file per module that reacts to it, matching the queue <event>-<module>
mod skill_fill_requested;
mod skill_filled;

//an event as it arrives on a queue: the bus's envelope, with what the publisher sent in `detail`
#[derive(Deserialize)]
pub struct Event {
    source: String,
    #[serde(rename = "detail-type")]
    detail_type: String,
    detail: Value,
}

//every job that reacts to an event has its own queue, named <event>-<module> (infrastructure/events.tf), so the queue
//picks the handler. Events can arrive more than once, so every handler is safe to run twice. Handlers handle their own
//failures, so a bad event is logged and never retried
pub async fn handle(graph: &Graph, queue: &str, body: &str) {
    let event = match serde_json::from_str::<Event>(body) {
        Ok(event) => event,
        Err(e) => return tracing::error!("unreadable event: {e}"),
    };
    match queue {
        "SkillFillRequested-Skills" => skill_fill_requested::skills::run(graph, event.detail).await,
        "SkillFilled-Skills" => skill_filled::skills::run(graph, event.detail).await,
        "SkillFilled-Personality" => skill_filled::personality::run(graph, event.detail).await,
        _ => tracing::warn!(queue, source = event.source, detail_type = event.detail_type, detail = %event.detail, "no handler for queue"),
    }
}

//the bus handlers publish to, after the graph write each event describes. Without EVENT_BUS_NAME events are logged instead
pub fn bus(config: &aws_config::SdkConfig) -> Option<Bus> {
    env::var("EVENT_BUS_NAME").ok().map(|name| Bus::new(config, name))
}
