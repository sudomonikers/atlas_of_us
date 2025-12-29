pub mod domain_architect;
pub mod knowledge_generator;
pub mod skill_generator;
pub mod trait_generator;
pub mod milestone_generator;
pub mod level_distributor;
pub mod prerequisite_mapper;

pub use domain_architect::DomainArchitectStep;
pub use knowledge_generator::KnowledgeGeneratorStep;
pub use skill_generator::SkillGeneratorStep;
pub use trait_generator::TraitGeneratorStep;
pub use milestone_generator::MilestoneGeneratorStep;
pub use level_distributor::LevelDistributorStep;
pub use prerequisite_mapper::PrerequisiteMapperStep;

use tokio::sync::mpsc;

use super::models::{AgentContext, AgentType, SseEvent, VerifiedConcept};
use crate::common::similarity::SimilarNodeResult;

/// Threshold for triggering LLM verification
pub const SIMILARITY_THRESHOLD_LOW: f64 = 0.70;
/// Threshold for auto-linking without LLM
pub const SIMILARITY_THRESHOLD_HIGH: f64 = 0.95;

/// Shared step utilities
pub struct StepUtils;

impl StepUtils {
    /// Parse a JSON array of strings from LLM response
    pub fn parse_concept_list(response: &str) -> Result<Vec<String>, String> {
        // Try to extract JSON array from response
        let trimmed = response.trim();

        // Find the JSON array in the response
        let start = trimmed.find('[').ok_or("No JSON array found in response")?;
        let end = trimmed.rfind(']').ok_or("No closing bracket found")?;

        if end <= start {
            return Err("Invalid JSON array structure".to_string());
        }

        let json_str = &trimmed[start..=end];

        serde_json::from_str::<Vec<String>>(json_str)
            .map_err(|e| format!("Failed to parse JSON array: {}", e))
    }

    /// Parse verification decision from LLM response
    pub fn parse_verification_response(response: &str, concept: &str) -> Result<VerifiedConcept, String> {
        let trimmed = response.trim();

        // Find the JSON object in the response
        let start = trimmed.find('{').ok_or("No JSON object found in response")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        if end <= start {
            return Err("Invalid JSON object structure".to_string());
        }

        let json_str = &trimmed[start..=end];

        let parsed: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let decision = parsed.get("decision")
            .and_then(|v| v.as_str())
            .ok_or("Missing 'decision' field")?;

        let existing_node = parsed.get("existing_node_name")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty() && *s != "null");

        // New field: suggested_target for LLM-suggested generalizations not in the list
        let suggested_target = parsed.get("suggested_target")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty() && *s != "null");

        match decision {
            "use_existing" => {
                let node_name = existing_node.ok_or("Missing existing_node_name for use_existing")?;
                Ok(VerifiedConcept::use_existing(concept, node_name))
            }
            "create_new" => {
                Ok(VerifiedConcept::create_new(concept))
            }
            "create_and_generalize" => {
                // Prefer suggested_target if provided, otherwise use existing_node_name
                let target_name = suggested_target
                    .or(existing_node)
                    .ok_or("Missing target for create_and_generalize (need existing_node_name or suggested_target)")?;
                // ID will be resolved later; needs_creation will be determined by caller
                Ok(VerifiedConcept::create_and_generalize(concept, "", target_name, false))
            }
            _ => Err(format!("Unknown decision: {}", decision))
        }
    }

    /// Determine action based on similarity score
    pub fn determine_action_by_score(
        concept: &str,
        similar_nodes: &[SimilarNodeResult],
    ) -> Option<VerifiedConcept> {
        if similar_nodes.is_empty() {
            return Some(VerifiedConcept::create_new(concept));
        }

        let top_score = similar_nodes[0].score;

        if top_score < SIMILARITY_THRESHOLD_LOW {
            // No good match - create new
            Some(VerifiedConcept::create_new(concept))
        } else if top_score >= SIMILARITY_THRESHOLD_HIGH {
            // Very high match - auto-use existing
            Some(VerifiedConcept::use_existing(concept, &similar_nodes[0].id))
        } else {
            // Moderate match - need LLM verification
            None
        }
    }
}

/// Trait for step implementations
#[async_trait::async_trait]
pub trait AgentStep {
    /// Get the agent type for this step
    fn agent_type(&self) -> AgentType;

    /// Execute the step
    async fn execute(&self, context: &mut AgentContext) -> Result<(), String>;
}

/// Helper to send SSE events
pub async fn emit_event(tx: &mpsc::Sender<SseEvent>, event: SseEvent) {
    if let Err(e) = tx.send(event).await {
        tracing::warn!("Failed to send SSE event: {}", e);
    }
}
