use neo4rs::Graph;
use std::collections::HashMap;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep};
use crate::domains::agent::models::{AgentContext, AgentType, CreatedNode, SseEvent};
use crate::domains::graph::models::{CreateNodeRequest, CreateRelationshipRequest};
use crate::domains::graph::services;
use crate::common::sqs::{queue_image_generation, is_queue_configured, ImageGenJob};

/// Domain Architect Step - creates Domain and Domain_Level nodes with fixed structure
///
/// This step:
/// 1. Creates a Domain node with the given name and description
/// 2. Queues async image generation for domain avatar (processed by Lambda)
/// 3. Creates 5 Domain_Level nodes (Novice, Developing, Competent, Advanced, Master)
pub struct DomainArchitectStep {
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl DomainArchitectStep {
    pub fn new(
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { graph, event_tx }
    }

    /// Queue async avatar generation for the domain
    async fn queue_avatar_generation(&self, domain_name: &str, element_id: &str) {
        if !is_queue_configured() {
            tracing::info!("IMAGE_GEN_QUEUE_URL not set, skipping avatar generation");
            return;
        }

        // Sanitize domain name for S3 key
        let sanitized_name = domain_name
            .to_lowercase()
            .replace(' ', "_")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect::<String>();

        let job = ImageGenJob::new(
            domain_name.to_string(),
            element_id.to_string(),
            format!(
                "A beautiful, artistic icon representing the domain of '{}'. \
                 Clean, modern design suitable for an app avatar. \
                 Minimalist style with vibrant colors on a simple background. \
                 No text or words.",
                domain_name
            ),
            format!("domains/{}/avatar.png", sanitized_name),
        );

        match queue_image_generation(job).await {
            Ok(()) => {
                emit_event(&self.event_tx, SseEvent::StepProgress {
                    agent: AgentType::DomainArchitect,
                    message: "Domain avatar queued for generation".to_string(),
                }).await;
            }
            Err(e) => {
                tracing::warn!("Failed to queue avatar generation: {}", e);
            }
        }
    }

    /// Get the fixed 5-level structure for any domain
    fn get_level_structure(domain_name: &str) -> Vec<LevelInfo> {
        vec![
            LevelInfo {
                level: 1,
                name: format!("{} Novice", domain_name),
                description: format!("Beginning your journey in {}", domain_name),
                total_points_required: 100,
            },
            LevelInfo {
                level: 2,
                name: format!("{} Developing", domain_name),
                description: format!("Building foundational skills in {}", domain_name),
                total_points_required: 200,
            },
            LevelInfo {
                level: 3,
                name: format!("{} Competent", domain_name),
                description: format!("Demonstrating solid competence in {}", domain_name),
                total_points_required: 400,
            },
            LevelInfo {
                level: 4,
                name: format!("{} Advanced", domain_name),
                description: format!("Achieving advanced mastery in {}", domain_name),
                total_points_required: 700,
            },
            LevelInfo {
                level: 5,
                name: format!("{} Master", domain_name),
                description: format!("Expert-level mastery of {}", domain_name),
                total_points_required: 1000,
            },
        ]
    }
}

#[async_trait::async_trait]
impl AgentStep for DomainArchitectStep {
    fn agent_type(&self) -> AgentType {
        AgentType::DomainArchitect
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        let domain_name = context.domain_name.clone();
        let description = context.description.clone().unwrap_or_default();

        // Step 1: Create Domain node
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating domain node...".to_string(),
        }).await;

        let mut domain_props: HashMap<String, Value> = HashMap::new();
        domain_props.insert("name".to_string(), json!(domain_name));
        domain_props.insert("description".to_string(), json!(description));

        let domain_request = CreateNodeRequest {
            labels: vec!["Domain".to_string()],
            properties: domain_props,
        };

        let domain_result = services::create_node(&self.graph, domain_request, false)
            .await
            .map_err(|e| e.to_string())?;

        let domain_node = CreatedNode::new(
            domain_name.clone(),
            domain_result.element_id.clone(),
            "Domain".to_string(),
        );

        emit_event(&self.event_tx, SseEvent::NodeCreated {
            agent: self.agent_type(),
            node_name: domain_node.name.clone(),
            label: "Domain".to_string(),
            was_reused: false,
        }).await;

        // Step 2: Queue async avatar generation (non-blocking)
        self.queue_avatar_generation(&domain_name, &domain_result.element_id).await;

        context.set_domain(domain_node);

        // Step 3: Create 5 Domain_Level nodes with fixed structure
        let levels = Self::get_level_structure(&domain_name);

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Creating {} domain levels...", levels.len()),
        }).await;

        for level_info in &levels {
            let mut level_props: HashMap<String, Value> = HashMap::new();
            level_props.insert("name".to_string(), json!(level_info.name));
            level_props.insert("description".to_string(), json!(level_info.description));
            level_props.insert("level".to_string(), json!(level_info.level));
            level_props.insert("total_points_required".to_string(), json!(level_info.total_points_required));

            let level_request = CreateNodeRequest {
                labels: vec!["Domain_Level".to_string()],
                properties: level_props,
            };

            let level_result = services::create_node(&self.graph, level_request, false)
                .await
                .map_err(|e| e.to_string())?;

            // Create HAS_DOMAIN_LEVEL relationship
            let rel_request = CreateRelationshipRequest {
                source_id: domain_result.element_id.clone(),
                target_id: level_result.element_id.clone(),
                relationship_type: "HAS_DOMAIN_LEVEL".to_string(),
                properties: None,
            };

            services::create_relationship(&self.graph, rel_request)
                .await
                .map_err(|e| e.to_string())?;

            let level_node = CreatedNode::new(
                level_info.name.clone(),
                level_result.element_id,
                "Domain_Level".to_string(),
            );

            emit_event(&self.event_tx, SseEvent::NodeCreated {
                agent: self.agent_type(),
                node_name: level_node.name.clone(),
                label: "Domain_Level".to_string(),
                was_reused: false,
            }).await;

            context.add_domain_level(level_node);
        }

        Ok(())
    }
}

/// Internal structure for level info
struct LevelInfo {
    level: i32,
    name: String,
    description: String,
    total_points_required: i32,
}
