use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};
use futures::{stream, StreamExt};

use super::{emit_event, AgentStep, StepUtils, BATCH_SIZE};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, CreatedNode, SseEvent};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::models::CreateNodeRequest;
use crate::domains::graph::services;

/// Milestone Generator Step - creates domain-specific Milestone nodes
pub struct MilestoneGeneratorStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl MilestoneGeneratorStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    async fn conceptualize(&self, context: &AgentContext) -> Result<Vec<String>, String> {
        let description = context.description.clone().unwrap_or_default();

        // Build context from existing components
        let context_str = format!(
            "Existing components:\n- Knowledge: {}\n- Skills: {}\n- Traits: {}",
            context.domain_graph.knowledge.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
            context.domain_graph.skills.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
            context.domain_graph.traits.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
        );

        let prompt = PromptTemplates::milestone_concepts(&context.domain_name, &description, &context_str);

        let config = GenerationConfig {
            max_tokens: Some(16384),
            temperature: Some(0.3),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::milestone_designer(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        StepUtils::parse_concept_list(&response)
    }

    async fn generate_properties(
        &self,
        context: &AgentContext,
        concepts: &[String],
    ) -> Result<Vec<MilestoneProperties>, String> {
        if concepts.is_empty() {
            return Ok(Vec::new());
        }

        let llm = self.llm.clone();
        let domain_name = context.domain_name.clone();

        let results: Vec<Result<MilestoneProperties, String>> = stream::iter(concepts.to_vec())
            .map(|concept| {
                let llm = llm.clone();
                let domain_name = domain_name.clone();
                async move {
                    let prompt = PromptTemplates::milestone_properties(
                        &domain_name,
                        &concept,
                        None,
                    );

                    let config = GenerationConfig {
                        max_tokens: Some(1024),
                        temperature: Some(0.3),
                        stop_sequences: None,
                    };

                    let response = llm.generate(
                        SystemPrompts::milestone_designer(),
                        &prompt,
                        &config,
                    ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                    Self::parse_milestone_properties(&response, &concept)
                }
            })
            .buffer_unordered(BATCH_SIZE)
            .collect()
            .await;

        results.into_iter().collect()
    }

    fn parse_milestone_properties(response: &str, concept_name: &str) -> Result<MilestoneProperties, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(MilestoneProperties {
            name: parsed.get("name").and_then(|v| v.as_str()).unwrap_or(concept_name).to_string(),
            description: parsed.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            how_to_achieve: parsed.get("how_to_achieve").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        })
    }

    async fn create_nodes(
        &self,
        properties: &[MilestoneProperties],
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created = Vec::new();

        for props in properties {
            let mut node_props: HashMap<String, Value> = HashMap::new();
            node_props.insert("name".to_string(), json!(props.name));
            node_props.insert("description".to_string(), json!(props.description));
            node_props.insert("how_to_achieve".to_string(), json!(props.how_to_achieve));

            let request = CreateNodeRequest {
                labels: vec!["Milestone".to_string()],
                properties: node_props,
            };

            let result = services::create_node(&self.graph, request, false)
                .await
                .map_err(|e| e.to_string())?;

            created.push(CreatedNode::new(
                props.name.clone(),
                result.element_id,
                "Milestone".to_string(),
            ));
        }

        Ok(created)
    }
}

#[async_trait::async_trait]
impl AgentStep for MilestoneGeneratorStep {
    fn agent_type(&self) -> AgentType {
        AgentType::MilestoneGenerator
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Identifying milestone achievements...".to_string(),
        }).await;

        let concepts = self.conceptualize(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Found {} milestone concepts", concepts.len()),
        }).await;

        let properties = self.generate_properties(context, &concepts).await?;
        let created = self.create_nodes(&properties).await?;

        for node in created {
            emit_event(&self.event_tx, SseEvent::NodeCreated {
                agent: self.agent_type(),
                node_name: node.name.clone(),
                label: "Milestone".to_string(),
                was_reused: node.was_reused,
            }).await;

            context.add_milestone(node);
        }

        Ok(())
    }
}

struct MilestoneProperties {
    name: String,
    description: String,
    how_to_achieve: String,
}
