use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::Value;

use super::{emit_event, AgentStep};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, LevelRequirement, SseEvent};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::models::CreateRelationshipRequest;
use crate::domains::graph::services;

/// Level Distributor Step - assigns components to domain levels
/// Creates Domain_Level -> Component REQUIRES_* relationships
pub struct LevelDistributorStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl LevelDistributorStep {
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

    /// Analyze and assign components to levels
    async fn analyze_level_assignments(&self, context: &AgentContext) -> Result<Vec<LevelAssignment>, String> {
        let ctx = self.build_context(context);
        let prompt = PromptTemplates::level_assignment(&context.domain_name, &ctx);

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

        self.parse_level_assignments(&response, context)
    }

    fn parse_level_assignments(&self, response: &str, context: &AgentContext) -> Result<Vec<LevelAssignment>, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let assignments = parsed.get("level_assignments")
            .and_then(|v| v.as_array())
            .ok_or("Missing level_assignments array")?;

        let mut level_assignments = Vec::new();

        for assignment in assignments {
            let component_name = assignment.get("component")
                .and_then(|v| v.as_str())
                .ok_or("Missing component name")?;

            let component_type = assignment.get("component_type")
                .and_then(|v| v.as_str())
                .ok_or("Missing component type")?;

            let level = assignment.get("level")
                .and_then(|v| v.as_i64())
                .ok_or("Missing level")?;

            let proficiency = assignment.get("proficiency")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            // Find component element ID
            let component_id = self.find_element_id(context, component_name, component_type);
            if component_id.is_none() {
                continue;
            }

            // Find level element ID
            let level_id = context.domain_graph.domain_levels
                .iter()
                .find(|l| l.name.contains(&format!(" {}", match level {
                    1 => "Novice",
                    2 => "Developing",
                    3 => "Competent",
                    4 => "Advanced",
                    5 => "Master",
                    _ => "",
                })))
                .or_else(|| context.domain_graph.domain_levels.get((level - 1) as usize))
                .map(|l| l.element_id.clone());

            if level_id.is_none() {
                continue;
            }

            level_assignments.push(LevelAssignment {
                level_id: level_id.unwrap(),
                component_id: component_id.unwrap(),
                component_name: component_name.to_string(),
                component_type: component_type.to_string(),
                proficiency,
            });
        }

        Ok(level_assignments)
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

    /// Create level requirement relationships in database
    async fn create_level_relationships(
        &self,
        assignments: &[LevelAssignment],
        context: &mut AgentContext,
    ) -> Result<usize, String> {
        let mut count = 0;

        for assignment in assignments {
            let rel_type = match assignment.component_type.as_str() {
                "Knowledge" => "REQUIRES_KNOWLEDGE",
                "Skill" => "REQUIRES_SKILL",
                "Trait" => "REQUIRES_TRAIT",
                "Milestone" => "REQUIRES_MILESTONE",
                _ => continue,
            };

            let mut props: HashMap<String, Value> = HashMap::new();
            if let Some(ref prof) = assignment.proficiency {
                match assignment.component_type.as_str() {
                    "Knowledge" => {
                        props.insert("bloom_level".to_string(), serde_json::json!(prof));
                    }
                    "Skill" => {
                        props.insert("dreyfus_level".to_string(), serde_json::json!(prof));
                    }
                    "Trait" => {
                        if let Ok(score) = prof.parse::<i64>() {
                            props.insert("min_score".to_string(), serde_json::json!(score));
                        }
                    }
                    _ => {}
                }
            }

            let request = CreateRelationshipRequest {
                source_id: assignment.level_id.clone(),
                target_id: assignment.component_id.clone(),
                relationship_type: rel_type.to_string(),
                properties: if props.is_empty() { None } else { Some(props) },
            };

            if services::create_relationship(&self.graph, request).await.is_ok() {
                count += 1;

                // Track relationship in context
                context.add_level_requirement(LevelRequirement {
                    level_id: assignment.level_id.clone(),
                    component_id: assignment.component_id.clone(),
                    component_name: assignment.component_name.clone(),
                    component_type: assignment.component_type.clone(),
                    proficiency: assignment.proficiency.clone(),
                });
            }
        }

        Ok(count)
    }
}

#[async_trait::async_trait]
impl AgentStep for LevelDistributorStep {
    fn agent_type(&self) -> AgentType {
        AgentType::LevelDistributor
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Assigning components to domain levels...".to_string(),
        }).await;

        let level_assignments = self.analyze_level_assignments(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Identified {} level assignments", level_assignments.len()),
        }).await;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating level relationships in database...".to_string(),
        }).await;

        let count = self.create_level_relationships(&level_assignments, context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Created {} level relationships", count),
        }).await;

        Ok(())
    }
}

struct LevelAssignment {
    level_id: String,
    component_id: String,
    component_name: String,
    component_type: String,
    proficiency: Option<String>,
}
