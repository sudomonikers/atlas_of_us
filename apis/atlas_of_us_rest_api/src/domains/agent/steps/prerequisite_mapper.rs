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

    /// Build context string for a specific component type
    /// Includes the source components and all potential target components
    fn build_context_for_type(&self, context: &AgentContext, source_type: &str) -> String {
        let mut ctx = format!("Domain: {}\n\n", context.domain_name);

        // Source components (the ones we're finding prerequisites for)
        ctx.push_str(&format!("{} Nodes (find prerequisites for these):\n", source_type));
        let source_nodes: Vec<_> = match source_type {
            "Knowledge" => context.domain_graph.knowledge.iter().collect(),
            "Skill" => context.domain_graph.skills.iter().collect(),
            "Trait" => context.domain_graph.traits.iter().collect(),
            "Milestone" => context.domain_graph.milestones.iter().collect(),
            _ => vec![],
        };
        for node in source_nodes {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        // All potential target components
        ctx.push_str("\nAvailable Knowledge Nodes:\n");
        for node in &context.domain_graph.knowledge {
            ctx.push_str(&format!("- {}\n", node.name));
        }

        ctx.push_str("\nAvailable Skill Nodes:\n");
        for node in &context.domain_graph.skills {
            ctx.push_str(&format!("- {}\n", node.name));
        }

        ctx.push_str("\nAvailable Trait Nodes:\n");
        for node in &context.domain_graph.traits {
            ctx.push_str(&format!("- {}\n", node.name));
        }

        ctx.push_str("\nAvailable Milestone Nodes:\n");
        for node in &context.domain_graph.milestones {
            ctx.push_str(&format!("- {}\n", node.name));
        }

        ctx
    }

    /// Analyze prerequisites for a specific component type
    async fn analyze_prerequisites_for_type(
        &self,
        context: &AgentContext,
        source_type: &str,
    ) -> Result<Vec<PrerequisiteRelationship>, String> {
        let ctx = self.build_context_for_type(context, source_type);
        let prompt = PromptTemplates::prerequisite_analysis(&context.domain_name, &ctx);

        let config = GenerationConfig {
            max_tokens: Some(16384),
            temperature: Some(0.3),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::relationship_architect(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        self.parse_prerequisites(&response, context, source_type)
    }

    /// Analyze all prerequisites (by source type to avoid token limits)
    async fn analyze_prerequisites(&self, context: &AgentContext) -> Result<Vec<PrerequisiteRelationship>, String> {
        let mut all_prerequisites = Vec::new();

        for source_type in &["Skill", "Milestone"] {
            // Skills typically require Knowledge, Milestones require Skills/Knowledge
            // Knowledge and Traits typically don't have prerequisites
            emit_event(&self.event_tx, SseEvent::StepProgress {
                agent: AgentType::PrerequisiteMapper,
                message: format!("Analyzing {} prerequisites...", source_type),
            }).await;

            let prerequisites = self.analyze_prerequisites_for_type(context, source_type).await?;
            all_prerequisites.extend(prerequisites);
        }

        Ok(all_prerequisites)
    }

    fn parse_prerequisites(&self, response: &str, context: &AgentContext, source_type: &str) -> Result<Vec<PrerequisiteRelationship>, String> {
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

            // Use the known source_type instead of reading from JSON
            let source_id = self.find_element_id(context, component_name, source_type);
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
        // analyze_prerequisites now emits progress events per source type
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
