use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, CreatedNode, SseEvent};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::handlers::{create_node_internal, CreateNodeRequest};

/// Domain Architect Step - creates Domain and Domain_Level nodes
pub struct DomainArchitectStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl DomainArchitectStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    /// Parse domain structure from LLM response
    fn parse_domain_structure(&self, response: &str) -> Result<DomainStructure, String> {
        let trimmed = response.trim();

        // Find the JSON object
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        if end <= start {
            return Err("Invalid JSON structure".to_string());
        }

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Extract domain info
        let domain = parsed.get("domain")
            .ok_or("Missing 'domain' field")?;

        let domain_name = domain.get("name")
            .and_then(|v| v.as_str())
            .ok_or("Missing domain name")?
            .to_string();

        let domain_description = domain.get("description")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        // Extract levels
        let levels_array = parsed.get("levels")
            .and_then(|v| v.as_array())
            .ok_or("Missing 'levels' array")?;

        let mut levels = Vec::new();
        for level_val in levels_array {
            let level_num = level_val.get("level")
                .and_then(|v| v.as_i64())
                .ok_or("Missing level number")?;

            let level_name = level_val.get("name")
                .and_then(|v| v.as_str())
                .ok_or("Missing level name")?
                .to_string();

            let level_desc = level_val.get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            levels.push(LevelInfo {
                level: level_num as i32,
                name: level_name,
                description: level_desc,
            });
        }

        Ok(DomainStructure {
            name: domain_name,
            description: domain_description,
            levels,
        })
    }
}

#[async_trait::async_trait]
impl AgentStep for DomainArchitectStep {
    fn agent_type(&self) -> AgentType {
        AgentType::DomainArchitect
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        // Pass 1: Generate domain structure via LLM
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Generating domain structure...".to_string(),
        }).await;

        let description = context.description.clone().unwrap_or_default();
        let prompt = PromptTemplates::domain_structure(&context.domain_name, &description);

        let config = GenerationConfig {
            max_tokens: Some(4096),
            temperature: Some(0.3),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::domain_architect(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        let structure = self.parse_domain_structure(&response)?;

        // Pass 2: Create Domain node
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating domain node...".to_string(),
        }).await;

        let mut domain_props: HashMap<String, Value> = HashMap::new();
        domain_props.insert("name".to_string(), json!(structure.name));
        domain_props.insert("description".to_string(), json!(structure.description));

        let domain_request = CreateNodeRequest {
            labels: vec!["Domain".to_string()],
            properties: domain_props,
        };

        let domain_result = create_node_internal(&self.graph, domain_request).await?;

        let domain_node = CreatedNode::new(
            structure.name.clone(),
            domain_result.element_id.clone(),
            "Domain".to_string(),
        );

        emit_event(&self.event_tx, SseEvent::NodeCreated {
            agent: self.agent_type(),
            node_name: domain_node.name.clone(),
            label: "Domain".to_string(),
            was_reused: false,
        }).await;

        context.set_domain(domain_node);

        // Pass 3: Create Domain_Level nodes
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Creating {} domain levels...", structure.levels.len()),
        }).await;

        for level_info in &structure.levels {
            let mut level_props: HashMap<String, Value> = HashMap::new();
            level_props.insert("name".to_string(), json!(level_info.name));
            level_props.insert("description".to_string(), json!(level_info.description));
            level_props.insert("level".to_string(), json!(level_info.level));
            level_props.insert("total_points_required".to_string(), json!(level_info.level * 100));

            let level_request = CreateNodeRequest {
                labels: vec!["Domain_Level".to_string()],
                properties: level_props,
            };

            let level_result = create_node_internal(&self.graph, level_request).await?;

            // Create HAS_DOMAIN_LEVEL relationship
            let rel_request = crate::domains::graph::handlers::CreateRelationshipRequest {
                source_id: domain_result.element_id.clone(),
                target_id: level_result.element_id.clone(),
                relationship_type: "HAS_DOMAIN_LEVEL".to_string(),
                properties: None,
            };

            crate::domains::graph::handlers::create_relationship_internal(&self.graph, rel_request).await?;

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

/// Internal structure for parsed domain info
struct DomainStructure {
    name: String,
    description: String,
    levels: Vec<LevelInfo>,
}

struct LevelInfo {
    level: i32,
    name: String,
    description: String,
}
