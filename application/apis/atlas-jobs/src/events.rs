//the Atlas event bus (infrastructure/events.tf). Every module publishes what happened to its sub-graph, and each module
//that reacts has its own rule and queue into this worker. Events are thin: they name the nodes it happened to, and
//consumers read the graph for the rest
use std::env;

use aws_sdk_eventbridge::{error::DisplayErrorContext, types::PutEventsRequestEntry};
use neo4rs::Graph;
use serde::Deserialize;
use serde_json::{Map, Value, json};

use crate::{personality_scoring::BoxError, skill_fill};

//an event as it arrives on a queue: the bus's envelope, with what the publisher sent in `detail`
#[derive(Deserialize)]
pub struct Event {
    source: String,
    #[serde(rename = "detail-type")]
    detail_type: String,
    detail: Value,
}

//handlers are picked by detail-type. Events can arrive more than once, so every handler is safe to run twice. Handlers
//handle their own failures, so a bad event is logged and never retried
pub async fn handle(graph: &Graph, body: &str) {
    let event = match serde_json::from_str::<Event>(body) {
        Ok(event) => event,
        Err(e) => return tracing::error!("unreadable event: {e}"),
    };
    match event.detail_type.as_str() {
        "SkillFillRequested" => skill_fill::run(graph, event.detail).await,
        other => tracing::warn!(source = event.source, detail_type = other, detail = %event.detail, "no handler for event"),
    }
}

//publishes to the bus, called after the graph write it describes
pub struct Bus {
    client: aws_sdk_eventbridge::Client,
    name: String,
}

impl Bus {
    pub async fn new() -> Result<Self, BoxError> {
        let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
        Ok(Bus { client: aws_sdk_eventbridge::Client::new(&config), name: env::var("EVENT_BUS_NAME")? })
    }

    //sends one event. `detail` holds the ids of the nodes it happened to, and every event gets an eventId, its
    //schemaVersion and when it occurred on top
    pub async fn publish(&self, source: &str, detail_type: &str, schema_version: u32, detail: Value) -> Result<(), BoxError> {
        let mut body = Map::from_iter([
            ("eventId".to_string(), json!(uuid::Uuid::new_v4().to_string())),
            ("schemaVersion".to_string(), json!(schema_version)),
            ("occurredAt".to_string(), json!(chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true))),
        ]);
        if let Value::Object(fields) = detail {
            body.extend(fields);
        }
        let entry = PutEventsRequestEntry::builder()
            .event_bus_name(&self.name)
            .source(source)
            .detail_type(detail_type)
            .detail(Value::Object(body).to_string())
            .build();
        let sent = self.client.put_events().entries(entry).send().await.map_err(|e| DisplayErrorContext(e).to_string())?;
        //the call succeeds even when the bus turns the entry down, and says so per entry
        if sent.failed_entry_count() > 0 {
            let reason = sent.entries().first().and_then(|e| e.error_message()).unwrap_or("unknown");
            return Err(format!("{detail_type} wasn't published: {reason}").into());
        }
        Ok(())
    }
}
