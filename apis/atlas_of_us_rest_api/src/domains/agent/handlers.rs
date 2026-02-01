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

use super::llm::{ProviderType, GenerationConfig, create_provider};
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
    let orchestrator = match AgentOrchestrator::new(ProviderType::Claude, graph, tx) {
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

// =============================================================================
// ASYNC QUEUE-BASED DOMAIN GENERATION
// =============================================================================

use std::collections::HashMap;
use crate::common::sqs::{
    queue_image_generation, queue_node_generation, is_queue_configured, is_node_queue_configured,
    ImageGenJob, NodeGenerationJob, NodeType, DomainLevelInfo,
};
use crate::domains::graph::models::{CreateNodeRequest, CreateRelationshipRequest};
use crate::domains::graph::services;

/// Response for async domain generation
#[derive(serde::Serialize)]
pub struct AsyncGenerationResponse {
    pub generation_id: String,
    pub domain_element_id: String,
    pub domain_name: String,
    pub total_nodes: u32,
    pub message: String,
}

/// POST /api/secure/agent/generate-domain-async
///
/// Initiates async domain generation via SQS queue.
/// Returns immediately with a generation ID.
/// Nodes are processed in parallel by Lambda workers.
pub async fn generate_domain_async(
    State(graph): State<Graph>,
    Json(request): Json<GenerateDomainRequest>,
) -> Result<Json<AsyncGenerationResponse>, (StatusCode, Json<Value>)> {
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

    // Check if queue is configured
    if !is_node_queue_configured() {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "Domain node queue not configured",
                "details": "DOMAIN_NODE_QUEUE_URL environment variable not set"
            })),
        ));
    }

    tracing::info!("Starting async domain generation for: {}", request.domain_name);

    // Generate a unique generation ID
    let generation_id = format!(
        "gen-{}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0),
        request.domain_name.chars().take(10).collect::<String>()
    );

    // Step 1: Create Domain + Levels
    let (domain_element_id, domain_levels) = create_domain_and_levels(
        &graph,
        &request.domain_name,
        request.description.as_deref(),
    )
    .await
    .map_err(|e| {
        tracing::error!("Failed to create domain: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "error": "Failed to create domain",
                "details": e.to_string()
            })),
        )
    })?;

    // Step 2: Queue image generation (same as before)
    if is_queue_configured() {
        let sanitized_name = request
            .domain_name
            .to_lowercase()
            .replace(' ', "_")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect::<String>();

        let job = ImageGenJob::new(
            request.domain_name.clone(),
            domain_element_id.clone(),
            format!(
                "A beautiful, artistic icon representing the domain of '{}'. \
                 Clean, modern design suitable for an app avatar. \
                 Minimalist style with vibrant colors on a simple background. \
                 No text or words.",
                request.domain_name
            ),
            format!("domains/{}/avatar.png", sanitized_name),
        );

        if let Err(e) = queue_image_generation(job).await {
            tracing::warn!("Failed to queue avatar generation: {}", e);
        }
    }

    // Step 3: Conceptualize all nodes via LLM
    let concepts = conceptualize_all_nodes(
        &request.domain_name,
        request.description.as_deref(),
    )
    .await
    .map_err(|e| {
        tracing::error!("Failed to conceptualize nodes: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "error": "Failed to conceptualize nodes",
                "details": e.to_string()
            })),
        )
    })?;

    let total_nodes = (concepts.knowledge.len()
        + concepts.skills.len()
        + concepts.traits.len()
        + concepts.milestones.len()) as u32;

    tracing::info!(
        "Conceptualized {} nodes ({} knowledge, {} skills, {} traits, {} milestones)",
        total_nodes,
        concepts.knowledge.len(),
        concepts.skills.len(),
        concepts.traits.len(),
        concepts.milestones.len()
    );

    // Step 4: Queue all node generation jobs
    let mut sequence = 0u32;

    // Queue knowledge nodes
    for concept in &concepts.knowledge {
        let job = NodeGenerationJob::new(
            generation_id.clone(),
            sequence,
            total_nodes,
            NodeType::Knowledge,
            concept.name.clone(),
            request.domain_name.clone(),
            request.description.clone(),
            domain_element_id.clone(),
            domain_levels.clone(),
            concept.suggested_level,
        );

        if let Err(e) = queue_node_generation(job).await {
            tracing::error!("Failed to queue knowledge node: {}", e);
        }
        sequence += 1;
    }

    // Queue skill nodes
    for concept in &concepts.skills {
        let job = NodeGenerationJob::new(
            generation_id.clone(),
            sequence,
            total_nodes,
            NodeType::Skill,
            concept.name.clone(),
            request.domain_name.clone(),
            request.description.clone(),
            domain_element_id.clone(),
            domain_levels.clone(),
            concept.suggested_level,
        );

        if let Err(e) = queue_node_generation(job).await {
            tracing::error!("Failed to queue skill node: {}", e);
        }
        sequence += 1;
    }

    // Queue trait nodes
    for concept in &concepts.traits {
        let job = NodeGenerationJob::new(
            generation_id.clone(),
            sequence,
            total_nodes,
            NodeType::Trait,
            concept.name.clone(),
            request.domain_name.clone(),
            request.description.clone(),
            domain_element_id.clone(),
            domain_levels.clone(),
            concept.suggested_level,
        );

        if let Err(e) = queue_node_generation(job).await {
            tracing::error!("Failed to queue trait node: {}", e);
        }
        sequence += 1;
    }

    // Queue milestone nodes
    for concept in &concepts.milestones {
        let job = NodeGenerationJob::new(
            generation_id.clone(),
            sequence,
            total_nodes,
            NodeType::Milestone,
            concept.name.clone(),
            request.domain_name.clone(),
            request.description.clone(),
            domain_element_id.clone(),
            domain_levels.clone(),
            concept.suggested_level,
        );

        if let Err(e) = queue_node_generation(job).await {
            tracing::error!("Failed to queue milestone node: {}", e);
        }
        sequence += 1;
    }

    tracing::info!(
        "Queued {} node generation jobs for domain '{}'",
        sequence,
        request.domain_name
    );

    Ok(Json(AsyncGenerationResponse {
        generation_id,
        domain_element_id,
        domain_name: request.domain_name,
        total_nodes,
        message: format!("Domain created. {} nodes queued for generation.", total_nodes),
    }))
}

/// Create Domain node and 5 Domain_Level nodes
async fn create_domain_and_levels(
    graph: &Graph,
    domain_name: &str,
    description: Option<&str>,
) -> Result<(String, Vec<DomainLevelInfo>), Box<dyn std::error::Error + Send + Sync>> {
    // Create Domain node
    let mut domain_props: HashMap<String, serde_json::Value> = HashMap::new();
    domain_props.insert("name".to_string(), json!(domain_name));
    domain_props.insert("description".to_string(), json!(description.unwrap_or("")));

    let domain_request = CreateNodeRequest {
        labels: vec!["Domain".to_string()],
        properties: domain_props,
    };

    let domain_result = services::create_node(graph, domain_request, false).await?;

    // Create 5 Domain_Level nodes
    let levels = vec![
        (1, "Novice", 100),
        (2, "Developing", 200),
        (3, "Competent", 400),
        (4, "Advanced", 700),
        (5, "Master", 1000),
    ];

    let mut domain_levels = Vec::new();

    for (level, suffix, points) in &levels {
        let level_name = format!("{} {}", domain_name, suffix);

        let mut level_props: HashMap<String, serde_json::Value> = HashMap::new();
        level_props.insert("name".to_string(), json!(level_name));
        level_props.insert(
            "description".to_string(),
            json!(format!("{} level in {}", suffix, domain_name)),
        );
        level_props.insert("level".to_string(), json!(level));
        level_props.insert("total_points_required".to_string(), json!(points));

        let level_request = CreateNodeRequest {
            labels: vec!["Domain_Level".to_string()],
            properties: level_props,
        };

        let level_result = services::create_node(graph, level_request, false).await?;

        // Create HAS_DOMAIN_LEVEL relationship
        let rel_request = CreateRelationshipRequest {
            source_id: domain_result.element_id.clone(),
            target_id: level_result.element_id.clone(),
            relationship_type: "HAS_DOMAIN_LEVEL".to_string(),
            properties: None,
        };

        services::create_relationship(graph, rel_request).await?;

        domain_levels.push(DomainLevelInfo {
            level: *level as u8,
            name: level_name,
            element_id: level_result.element_id,
        });
    }

    Ok((domain_result.element_id, domain_levels))
}

/// Conceptualized node with name and suggested level
#[derive(Debug, Clone)]
struct ConceptualizedNode {
    name: String,
    suggested_level: Option<u8>,
}

/// All conceptualized nodes for a domain
#[derive(Debug)]
struct ConceptualizedDomain {
    knowledge: Vec<ConceptualizedNode>,
    skills: Vec<ConceptualizedNode>,
    traits: Vec<ConceptualizedNode>,
    milestones: Vec<ConceptualizedNode>,
}

/// Use LLM to conceptualize all nodes for a domain
async fn conceptualize_all_nodes(
    domain_name: &str,
    description: Option<&str>,
) -> Result<ConceptualizedDomain, Box<dyn std::error::Error + Send + Sync>> {
    let provider = create_provider(ProviderType::Claude)
        .map_err(|e| format!("LLM not configured: {}", e))?;

    let system_prompt = r#"You are an expert at designing learning domains for a personal development knowledge graph.
Given a domain name and optional description, generate a comprehensive list of:
1. Knowledge concepts (things to learn)
2. Skills (abilities to develop)
3. Traits (characteristics to cultivate)
4. Milestones (achievements to reach)

For each item, provide a suggested level (1-5) where:
1 = Novice, 2 = Developing, 3 = Competent, 4 = Advanced, 5 = Master

Respond with a JSON object:
{
  "knowledge": [{"name": "...", "level": 1-5}, ...],
  "skills": [{"name": "...", "level": 1-5}, ...],
  "traits": [{"name": "...", "level": 1-5}, ...],
  "milestones": [{"name": "...", "level": 1-5}, ...]
}

Guidelines:
- Generate 5-10 items per category
- Prefix domain-specific items with the domain name
- Items should be atomic (no "and" combinations)
- Distribute items across all 5 levels

IMPORTANT: Only respond with valid JSON, no other text."#;

    let description_context = description
        .map(|d| format!("\nDescription: {}", d))
        .unwrap_or_default();

    let user_prompt = format!(
        "Generate all nodes for the domain: {}{}",
        domain_name, description_context
    );

    let config = GenerationConfig {
        max_tokens: Some(4096),
        temperature: Some(0.7),
        stop_sequences: None,
    };

    let response = provider.generate(system_prompt, &user_prompt, &config).await
        .map_err(|e| format!("LLM generation failed: {}", e))?;

    // Parse JSON response
    let json_str = extract_json(&response);

    #[derive(serde::Deserialize)]
    struct ConceptItem {
        name: String,
        level: Option<u8>,
    }

    #[derive(serde::Deserialize)]
    struct ConceptsResponse {
        knowledge: Vec<ConceptItem>,
        skills: Vec<ConceptItem>,
        traits: Vec<ConceptItem>,
        milestones: Vec<ConceptItem>,
    }

    let concepts: ConceptsResponse = serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse concepts: {}. Response: {}", e, response))?;

    Ok(ConceptualizedDomain {
        knowledge: concepts
            .knowledge
            .into_iter()
            .map(|c| ConceptualizedNode {
                name: c.name,
                suggested_level: c.level,
            })
            .collect(),
        skills: concepts
            .skills
            .into_iter()
            .map(|c| ConceptualizedNode {
                name: c.name,
                suggested_level: c.level,
            })
            .collect(),
        traits: concepts
            .traits
            .into_iter()
            .map(|c| ConceptualizedNode {
                name: c.name,
                suggested_level: c.level,
            })
            .collect(),
        milestones: concepts
            .milestones
            .into_iter()
            .map(|c| ConceptualizedNode {
                name: c.name,
                suggested_level: c.level,
            })
            .collect(),
    })
}

/// Extract JSON from a response that might have markdown code blocks
fn extract_json(response: &str) -> &str {
    let trimmed = response.trim();
    if trimmed.starts_with("```json") {
        trimmed
            .trim_start_matches("```json")
            .trim_end_matches("```")
            .trim()
    } else if trimmed.starts_with("```") {
        trimmed
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim()
    } else {
        trimmed
    }
}
