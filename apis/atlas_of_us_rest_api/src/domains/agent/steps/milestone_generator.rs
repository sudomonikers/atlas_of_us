use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep, StepUtils};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, ConceptAction, CreatedNode, SseEvent, VerifiedConcept};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::handlers::{
    create_node_internal, create_relationship_internal,
    CreateNodeRequest, CreateRelationshipRequest,
};
use crate::common::similarity::find_similar_by_text;

/// Milestone Generator Step - creates Milestone nodes with multi-pass logic
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

    async fn pass1_conceptualize(&self, context: &AgentContext) -> Result<Vec<String>, String> {
        let description = context.description.clone().unwrap_or_default();

        // Build context from existing components
        let context_str = format!(
            "Existing components:\n- Knowledge: {}\n- Skills: {}\n- Traits: {}",
            context.created_nodes.knowledge.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
            context.created_nodes.skills.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
            context.created_nodes.traits.iter().map(|n| n.name.as_str()).collect::<Vec<_>>().join(", "),
        );

        let prompt = PromptTemplates::milestone_concepts(&context.domain_name, &description, &context_str);

        let config = GenerationConfig {
            max_tokens: Some(2048),
            temperature: Some(0.5),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::milestone_designer(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        StepUtils::parse_concept_list(&response)
    }

    async fn pass2_similarity_search(&self, concepts: &[String]) -> Result<Vec<(String, Vec<crate::common::similarity::SimilarNodeResult>)>, String> {
        let mut results = Vec::new();

        for concept in concepts {
            let similar = find_similar_by_text(&self.graph, concept, Some("Milestone"), 3)
                .await
                .map_err(|e| format!("Similarity search failed: {}", e))?;

            results.push((concept.clone(), similar));
        }

        Ok(results)
    }

    async fn pass3_verify_matches(
        &self,
        context: &AgentContext,
        similarity_results: &[(String, Vec<crate::common::similarity::SimilarNodeResult>)],
    ) -> Result<Vec<VerifiedConcept>, String> {
        let mut verified = Vec::new();

        for (concept, similar_nodes) in similarity_results {
            let top_score = similar_nodes.first().map(|n| n.score);
            emit_event(&self.event_tx, SseEvent::SimilarityCheck {
                agent: AgentType::MilestoneGenerator,
                concept: concept.clone(),
                similar_found: similar_nodes.len(),
                top_score,
            }).await;

            if let Some(decision) = StepUtils::determine_action_by_score(concept, similar_nodes) {
                verified.push(decision);
            } else {
                let prompt = PromptTemplates::verify_similar_milestone(
                    concept,
                    &context.domain_name,
                    similar_nodes,
                );

                let config = GenerationConfig {
                    max_tokens: Some(512),
                    temperature: Some(0.2),
                    stop_sequences: None,
                };

                let response = self.llm.generate(
                    SystemPrompts::milestone_designer(),
                    &prompt,
                    &config,
                ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                let mut decision = StepUtils::parse_verification_response(&response, concept)?;

                if let ConceptAction::CreateAndGeneralize { generalizes_to_name, .. } = &decision.action {
                    let existing_id = similar_nodes.iter()
                        .find(|n| n.name == *generalizes_to_name)
                        .map(|n| n.id.clone())
                        .unwrap_or_default();

                    decision = VerifiedConcept::create_and_generalize(
                        concept,
                        &existing_id,
                        generalizes_to_name,
                    );
                }

                verified.push(decision);
            }
        }

        Ok(verified)
    }

    async fn pass4_generate_properties(
        &self,
        context: &AgentContext,
        verified: &[VerifiedConcept],
    ) -> Result<Vec<MilestoneProperties>, String> {
        let mut properties = Vec::new();

        for concept in verified {
            if matches!(concept.action, ConceptAction::UseExisting { .. }) {
                continue;
            }

            let generalizes_to = if let ConceptAction::CreateAndGeneralize { generalizes_to_name, .. } = &concept.action {
                Some(generalizes_to_name.as_str())
            } else {
                None
            };

            let prompt = PromptTemplates::milestone_properties(
                &context.domain_name,
                &concept.name,
                generalizes_to,
            );

            let config = GenerationConfig {
                max_tokens: Some(1024),
                temperature: Some(0.3),
                stop_sequences: None,
            };

            let response = self.llm.generate(
                SystemPrompts::milestone_designer(),
                &prompt,
                &config,
            ).await.map_err(|e| format!("LLM error: {:?}", e))?;

            let props = self.parse_milestone_properties(&response, &concept.name)?;
            properties.push(props);
        }

        Ok(properties)
    }

    fn parse_milestone_properties(&self, response: &str, concept_name: &str) -> Result<MilestoneProperties, String> {
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

    async fn pass5_create_nodes(
        &self,
        verified: &[VerifiedConcept],
        properties: &[MilestoneProperties],
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created = Vec::new();
        let mut props_iter = properties.iter();

        for concept in verified {
            match &concept.action {
                ConceptAction::UseExisting { element_id } => {
                    created.push(CreatedNode::reused(
                        concept.name.clone(),
                        element_id.clone(),
                        "Milestone".to_string(),
                    ));
                }
                ConceptAction::CreateNew | ConceptAction::CreateAndGeneralize { .. } => {
                    let props = props_iter.next().ok_or("Missing properties")?;

                    let mut node_props: HashMap<String, Value> = HashMap::new();
                    node_props.insert("name".to_string(), json!(props.name));
                    node_props.insert("description".to_string(), json!(props.description));
                    node_props.insert("how_to_achieve".to_string(), json!(props.how_to_achieve));

                    let request = CreateNodeRequest {
                        labels: vec!["Milestone".to_string()],
                        properties: node_props,
                    };

                    let result = create_node_internal(&self.graph, request).await?;

                    created.push(CreatedNode::new(
                        props.name.clone(),
                        result.element_id,
                        "Milestone".to_string(),
                    ));
                }
            }
        }

        Ok(created)
    }

    async fn create_generalization_relationships(
        &self,
        verified: &[VerifiedConcept],
        created: &[CreatedNode],
    ) -> Result<(), String> {
        for concept in verified {
            if let ConceptAction::CreateAndGeneralize { generalizes_to_id, .. } = &concept.action {
                let source = created.iter()
                    .find(|n| n.name == concept.name)
                    .ok_or_else(|| format!("Node not found: {}", concept.name))?;

                let rel_request = CreateRelationshipRequest {
                    source_id: source.element_id.clone(),
                    target_id: generalizes_to_id.clone(),
                    relationship_type: "GENERALIZES_TO".to_string(),
                    properties: None,
                };

                create_relationship_internal(&self.graph, rel_request).await?;
            }
        }

        Ok(())
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

        let concepts = self.pass1_conceptualize(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Found {} milestone concepts", concepts.len()),
        }).await;

        let similarity_results = self.pass2_similarity_search(&concepts).await?;
        let verified = self.pass3_verify_matches(context, &similarity_results).await?;
        let properties = self.pass4_generate_properties(context, &verified).await?;
        let created = self.pass5_create_nodes(&verified, &properties).await?;

        self.create_generalization_relationships(&verified, &created).await?;

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
