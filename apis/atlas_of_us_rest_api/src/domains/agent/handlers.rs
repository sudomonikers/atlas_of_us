use axum::{
    extract::State,
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    Json,
};
use futures::stream::Stream;
use neo4rs::Graph;
use serde_json::{json, Value};
use std::convert::Infallible;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tokio_stream::StreamExt;
use validator::Validate;

use super::llm::{create_provider, ProviderType};
use super::models::{GenerateDomainRequest, SseEvent};
use super::orchestrator::AgentOrchestrator;

/// POST /api/secure/agent/generate-domain
///
/// Initiates domain generation and returns an SSE stream of progress events.
///
/// The stream emits events as each agent completes:
/// - `started` - Workflow initiated
/// - `agent_started` - Agent began execution
/// - `step_progress` - Progress update during agent execution
/// - `similarity_check` - Similarity search performed
/// - `verification_result` - LLM verification decision
/// - `node_created` - Node created in database
/// - `agent_completed` - Agent finished successfully
/// - `agent_failed` - Agent failed (workflow will stop)
/// - `completed` - All agents finished
/// - `failed` - Workflow failed
pub async fn generate_domain_sse(
    State(graph): State<Graph>,
    Json(request): Json<GenerateDomainRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<Value>)> {
    // Validate request
    if let Err(e) = request.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Validation failed",
                "details": e.to_string()
            })),
        ));
    }

    tracing::info!("Starting domain generation for: {}", request.domain_name);

    // Create event channel with buffer
    let (tx, rx) = mpsc::channel::<SseEvent>(64);

    // Create orchestrator with graph connection
    let orchestrator = match AgentOrchestrator::new(ProviderType::LlamaCpp, graph, tx) {
        Ok(o) => o,
        Err(e) => {
            tracing::error!("Failed to initialize orchestrator: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Failed to initialize agent orchestrator",
                    "details": e
                })),
            ));
        }
    };

    let domain_name = request.domain_name.clone();
    let description = request.description.clone();

    // Spawn the generation task in the background
    tokio::spawn(async move {
        match orchestrator.generate_domain(domain_name, description).await {
            Ok(result) => {
                tracing::info!(
                    "Domain generation completed. Created {} nodes ({} reused) in {}ms",
                    result.domain_graph.count_created(),
                    result.domain_graph.count_reused(),
                    result.statistics.generation_time_ms
                );
            }
            Err(e) => {
                tracing::error!("Domain generation failed: {}", e);
            }
        }
    });

    // Convert receiver to SSE stream
    let stream = create_sse_stream(rx);

    Ok(Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    ))
}

/// Convert mpsc receiver to an SSE event stream
fn create_sse_stream(
    rx: mpsc::Receiver<SseEvent>,
) -> impl Stream<Item = Result<Event, Infallible>> {
    ReceiverStream::new(rx).map(|event| {
        let json_data = serde_json::to_string(&event).unwrap_or_else(|e| {
            tracing::error!("Failed to serialize SSE event: {}", e);
            json!({"type": "error", "message": "Serialization failed"}).to_string()
        });

        Ok(Event::default().data(json_data))
    })
}
