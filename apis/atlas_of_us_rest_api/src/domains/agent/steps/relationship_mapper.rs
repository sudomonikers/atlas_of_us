use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::Value;

use super::{emit_event, AgentStep};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, SseEvent};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::handlers::{create_relationship_internal, CreateRelationshipRequest};

/// Relationship Mapper Step - creates REQUIRES_* relationships and level assignments
pub struct RelationshipMapperStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl RelationshipMapperStep {
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
        for level in &context.created_nodes.domain_levels {
            ctx.push_str(&format!("- {} (ID: {})\n", level.name, level.element_id));
        }

        ctx.push_str("\nKnowledge Nodes:\n");
        for node in &context.created_nodes.knowledge {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nSkill Nodes:\n");
        for node in &context.created_nodes.skills {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nTrait Nodes:\n");
        for node in &context.created_nodes.traits {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx.push_str("\nMilestone Nodes:\n");
        for node in &context.created_nodes.milestones {
            ctx.push_str(&format!("- {} (ID: {})\n", node.name, node.element_id));
        }

        ctx
    }

    /// Pass 1: Analyze prerequisites
    async fn pass1_prerequisite_analysis(&self, context: &AgentContext) -> Result<Vec<PrerequisiteRelationship>, String> {
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
                    target_id: target_id.unwrap(),
                    relationship_type: rel_type.to_string(),
                });
            }
        }

        Ok(relationships)
    }

    /// Pass 2: Assign components to levels
    async fn pass2_level_assignment(&self, context: &AgentContext) -> Result<Vec<LevelAssignment>, String> {
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
            let level_id = context.created_nodes.domain_levels
                .iter()
                .find(|l| l.name.contains(&format!(" {}", match level {
                    1 => "Novice",
                    2 => "Developing",
                    3 => "Competent",
                    4 => "Advanced",
                    5 => "Master",
                    _ => "",
                })))
                .or_else(|| context.created_nodes.domain_levels.get((level - 1) as usize))
                .map(|l| l.element_id.clone());

            if level_id.is_none() {
                continue;
            }

            level_assignments.push(LevelAssignment {
                level_id: level_id.unwrap(),
                component_id: component_id.unwrap(),
                component_type: component_type.to_string(),
                proficiency,
            });
        }

        Ok(level_assignments)
    }

    fn find_element_id(&self, context: &AgentContext, name: &str, node_type: &str) -> Option<String> {
        match node_type {
            "Knowledge" => context.created_nodes.knowledge.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Skill" => context.created_nodes.skills.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Trait" => context.created_nodes.traits.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            "Milestone" => context.created_nodes.milestones.iter()
                .find(|n| n.name == name)
                .map(|n| n.element_id.clone()),
            _ => None,
        }
    }

    /// Pass 3: Create relationships in database
    async fn pass3_create_relationships(
        &self,
        prerequisites: &[PrerequisiteRelationship],
        level_assignments: &[LevelAssignment],
    ) -> Result<usize, String> {
        let mut count = 0;

        // Create prerequisite relationships
        for prereq in prerequisites {
            let request = CreateRelationshipRequest {
                source_id: prereq.source_id.clone(),
                target_id: prereq.target_id.clone(),
                relationship_type: prereq.relationship_type.clone(),
                properties: None,
            };

            if create_relationship_internal(&self.graph, request).await.is_ok() {
                count += 1;
            }
        }

        // Create level requirement relationships
        for assignment in level_assignments {
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

            if create_relationship_internal(&self.graph, request).await.is_ok() {
                count += 1;
            }
        }

        Ok(count)
    }
}

#[async_trait::async_trait]
impl AgentStep for RelationshipMapperStep {
    fn agent_type(&self) -> AgentType {
        AgentType::RelationshipMapper
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Analyzing component prerequisites...".to_string(),
        }).await;

        let prerequisites = self.pass1_prerequisite_analysis(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Identified {} prerequisite relationships", prerequisites.len()),
        }).await;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Assigning components to domain levels...".to_string(),
        }).await;

        let level_assignments = self.pass2_level_assignment(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Created {} level assignments", level_assignments.len()),
        }).await;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating relationships in database...".to_string(),
        }).await;

        let count = self.pass3_create_relationships(&prerequisites, &level_assignments).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Created {} relationships", count),
        }).await;

        Ok(())
    }
}

struct PrerequisiteRelationship {
    source_id: String,
    target_id: String,
    relationship_type: String,
}

struct LevelAssignment {
    level_id: String,
    component_id: String,
    component_type: String,
    proficiency: Option<String>,
}
