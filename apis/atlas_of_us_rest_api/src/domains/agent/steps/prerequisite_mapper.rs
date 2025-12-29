use neo4rs::Graph;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::Value;

use super::{emit_event, AgentStep};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, PrerequisiteLink, SseEvent};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::models::CreateRelationshipRequest;
use crate::domains::graph::services;

/// Prerequisite Mapper Step - creates REQUIRES_* relationships between components
/// e.g., Skill -> Knowledge, Milestone -> Skill
pub struct PrerequisiteMapperStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl PrerequisiteMapperStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    /// Build context string for LLM
    fn build_context(&self, context: &AgentContext) -> String {
        let mut ctx = format!("Domain: {}\n\n", context.domain_name);

        ctx.push_str("Domain Levels:\n");
        for level in &context.domain_graph.domain_levels {
            ctx.push_str(&format!("- {} (ID: {})\n", level.name, level.element_id));
        }

        ctx.push_str("\nKnowledge Nodes:\n");
        for node in &context.domain_graph.knowledge {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nSkill Nodes:\n");
        for node in &context.domain_graph.skills {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nTrait Nodes:\n");
        for node in &context.domain_graph.traits {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nMilestone Nodes:\n");
        for node in &context.domain_graph.milestones {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx
    }

    /// Analyze prerequisites between components
    async fn analyze_prerequisites(&self, context: &AgentContext) -> Result<Vec<PrerequisiteRelationship>, String> {
        let ctx = self.build_context(context);
        let prompt = PromptTemplates::prerequisite_analysis(&context.domain_name, &ctx);

        let config = GenerationConfig {
            max_tokens: Some(4096),
            temperature: Some(0.3),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::relationship_architect(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        self.parse_prerequisites(&response, context)
    }

    fn parse_prerequisites(&self, response: &str, context: &AgentContext) -> Result<Vec<PrerequisiteRelationship>, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let prerequisites = parsed.get("prerequisites")
            .and_then(|v| v.as_array())
            .ok_or("Missing prerequisites array")?;

        let mut relationships = Vec::new();

        for prereq in prerequisites {
            let component_name = prereq.get("component")
                .and_then(|v| v.as_str())
                .ok_or("Missing component name")?;

            let component_type = prereq.get("component_type")
                .and_then(|v| v.as_str())
                .ok_or("Missing component type")?;

            // Find the component element ID
            let source_id = self.find_element_id(context, component_name, component_type);
            if source_id.is_none() {
                continue;
            }

            let empty_vec = Vec::new();
            let requires = prereq.get("requires")
                .and_then(|v| v.as_array())
                .unwrap_or(&empty_vec);

            for req in requires {
                let req_name = req.get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                let req_type = req.get("type")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                let target_id = self.find_element_id(context, req_name, req_type);
                if target_id.is_none() {
                    continue;
                }

                let rel_type = match req_type {
                    "Knowledge" => "REQUIRES_KNOWLEDGE",
                    "Skill" => "REQUIRES_SKILL",
                    "Trait" => "REQUIRES_TRAIT",
                    "Milestone" => "REQUIRES_MILESTONE",
                    _ => continue,
                };

                relationships.push(PrerequisiteRelationship {
                    source_id: source_id.clone().unwrap(),
                    source_name: component_name.to_string(),
                    target_id: target_id.unwrap(),
                    target_name: req_name.to_string(),
                    relationship_type: rel_type.to_string(),
                });
            }
        }

        Ok(relationships)
    }

    fn find_element_id(&self, context: &AgentContext, name: &str, node_type: &str) -> Option<String> {
        match node_type {
            "Knowledge" => context.domain_graph.knowledge.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Skill" => context.domain_graph.skills.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Trait" => context.domain_graph.traits.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Milestone" => context.domain_graph.milestones.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            _ => None,
        }
    }

    /// Create prerequisite relationships in database
    async fn create_prerequisite_relationships(
        &self,
        prerequisites: &[PrerequisiteRelationship],
        context: &mut AgentContext,
    ) -> Result<usize, String> {
        let mut count = 0;

        for prereq in prerequisites {
            let request = CreateRelationshipRequest {
                source_id: prereq.source_id.clone(),
                target_id: prereq.target_id.clone(),
                relationship_type: prereq.relationship_type.clone(),
                properties: None,
            };

            if services::create_relationship(&self.graph, request).await.is_ok() {
                count += 1;

                // Track relationship in context
                context.add_prerequisite(PrerequisiteLink {
                    source_id: prereq.source_id.clone(),
                    source_name: prereq.source_name.clone(),
                    target_id: prereq.target_id.clone(),
                    target_name: prereq.target_name.clone(),
                    relationship_type: prereq.relationship_type.clone(),
                });
            }
        }

        Ok(count)
    }
}

#[async_trait::async_trait]
impl AgentStep for PrerequisiteMapperStep {
    fn agent_type(&self) -> AgentType {
        AgentType::PrerequisiteMapper
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Analyzing component prerequisites...".to_string(),
        }).await;

        let prerequisites = self.analyze_prerequisites(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Identified {} prerequisite relationships", prerequisites.len()),
        }).await;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating prerequisite relationships in database...".to_string(),
        }).await;

        let count = self.create_prerequisite_relationships(&prerequisites, context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Created {} prerequisite relationships", count),
        }).await;

        Ok(())
    }
}

struct PrerequisiteRelationship {
    source_id: String,
    source_name: String,
    target_id: String,
    target_name: String,
    relationship_type: String,
}
