//the Atlas event bus (infrastructure/events.tf). The api and atlas-jobs publish what happened to a sub-graph after
//writing it, and every job that reacts has its own rule and queue into atlas-jobs. Events are thin: they name the nodes
//it happened to, and consumers read the graph for the rest
use aws_sdk_eventbridge::{error::DisplayErrorContext, types::PutEventsRequestEntry};
use serde_json::{Map, Value, json};

use crate::BoxError;

#[derive(Clone)]
pub struct Bus {
    client: aws_sdk_eventbridge::Client,
    name: String,
}

impl Bus {
    pub fn new(config: &aws_config::SdkConfig, name: String) -> Self {
        Bus { client: aws_sdk_eventbridge::Client::new(config), name }
    }
}

//sends one event. `detail` holds the ids of the nodes it happened to, and every event gets an eventId, its schemaVersion
//and when it occurred on top. Without a bus (EVENT_BUS_NAME isn't set) the event is logged instead
pub async fn publish(bus: &Option<Bus>, source: &str, detail_type: &str, schema_version: u32, detail: Value) -> Result<(), BoxError> {
    let mut body = Map::from_iter([
        ("eventId".to_string(), json!(uuid::Uuid::new_v4().to_string())),
        ("schemaVersion".to_string(), json!(schema_version)),
        ("occurredAt".to_string(), json!(chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true))),
    ]);
    if let Value::Object(fields) = detail {
        body.extend(fields);
    }
    let detail = Value::Object(body).to_string();
    let Some(bus) = bus else {
        tracing::info!("EVENT_BUS_NAME isn't set, so this event wasn't published: {source} {detail_type} {detail}");
        return Ok(());
    };
    let entry = PutEventsRequestEntry::builder()
        .event_bus_name(&bus.name)
        .source(source)
        .detail_type(detail_type)
        .detail(detail)
        .build();
    let sent = bus.client.put_events().entries(entry).send().await.map_err(|e| DisplayErrorContext(e).to_string())?;
    //the call succeeds even when the bus turns the entry down, and says so per entry
    if sent.failed_entry_count() > 0 {
        let reason = sent.entries().first().and_then(|e| e.error_message()).unwrap_or("unknown");
        return Err(format!("{detail_type} wasn't published: {reason}").into());
    }
    Ok(())
}
