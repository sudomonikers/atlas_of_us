use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep, StepUtils};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, ConceptAction, CreatedNode, SseEvent, VerifiedConcept};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::models::CreateNodeRequest;
use crate::domains::graph::services;
use crate::common::similarity::{find_similar_nodes, FindSimilarNodesRequest};

/// Trait Generator Step - creates Trait nodes
/// Note: Traits are generic (shared across domains) so we prefer reusing existing ones
pub struct TraitGeneratorStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl TraitGeneratorStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    async fn pass1_conceptualize(&self, context: &AgentContext) -> Result<Vec<String>, String> {
        let description = context.description.clone().unwrap_or_default();
        let prompt = PromptTemplates::trait_concepts(&context.domain_name, &description);

        let config = GenerationConfig {
            max_tokens: Some(1024),
            temperature: Some(0.5),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::trait_analyst(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        StepUtils::parse_concept_list(&response)
    }

    async fn pass2_similarity_search(&self, concepts: &[String]) -> Result<Vec<(String, Vec<crate::common::similarity::SimilarNodeResult>)>, String> {
        let mut results = Vec::new();

        for concept in concepts {
            let similar = find_similar_nodes(&self.graph, FindSimilarNodesRequest {
                text: Some(concept.clone()),
                label: Some("Trait".to_string()),
                limit: Some(3),
                ..Default::default()
            })
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
                agent: AgentType::TraitGenerator,
                concept: concept.clone(),
                similar_found: similar_nodes.len(),
                top_score,
            }).await;

            // For traits, we use a slightly lower threshold since they're generic
            // and we want to maximize reuse
            if similar_nodes.is_empty() || similar_nodes[0].score < 0.65 {
                verified.push(VerifiedConcept::create_new(concept));
            } else if similar_nodes[0].score >= 0.85 {
                // High match - auto-use existing
                verified.push(VerifiedConcept::use_existing(concept, &similar_nodes[0].id));
            } else {
                // Ask LLM to verify
                let prompt = PromptTemplates::verify_similar_trait(
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
                    SystemPrompts::trait_analyst(),
                    &prompt,
                    &config,
                ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                // For traits, we only support use_existing or create_new
                let decision = self.parse_trait_verification(&response, concept, similar_nodes)?;
                verified.push(decision);
            }
        }

        Ok(verified)
    }

    fn parse_trait_verification(
        &self,
        response: &str,
        concept: &str,
        similar_nodes: &[crate::common::similarity::SimilarNodeResult],
    ) -> Result<VerifiedConcept, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let decision = parsed.get("decision")
            .and_then(|v| v.as_str())
            .ok_or("Missing decision field")?;

        match decision {
            "use_existing" => {
                let node_name = parsed.get("existing_node_name")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.is_empty() && *s != "null");

                if let Some(name) = node_name {
                    // Find the element ID
                    let existing_id = similar_nodes.iter()
                        .find(|n| n.name == name)
                        .map(|n| n.id.clone())
                        .unwrap_or_else(|| similar_nodes[0].id.clone());

                    Ok(VerifiedConcept::use_existing(concept, &existing_id))
                } else {
                    // Fallback to first match
                    Ok(VerifiedConcept::use_existing(concept, &similar_nodes[0].id))
                }
            }
            _ => Ok(VerifiedConcept::create_new(concept)),
        }
    }

    async fn pass4_generate_properties(
        &self,
        verified: &[VerifiedConcept],
    ) -> Result<Vec<TraitProperties>, String> {
        let mut properties = Vec::new();

        for concept in verified {
            if matches!(concept.action, ConceptAction::UseExisting { .. }) {
                continue;
            }

            let prompt = PromptTemplates::trait_properties(&concept.name);

            let config = GenerationConfig {
                max_tokens: Some(1024),
                temperature: Some(0.3),
                stop_sequences: None,
            };

            let response = self.llm.generate(
                SystemPrompts::trait_analyst(),
                &prompt,
                &config,
            ).await.map_err(|e| format!("LLM error: {:?}", e))?;

            let props = self.parse_trait_properties(&response, &concept.name)?;
            properties.push(props);
        }

        Ok(properties)
    }

    fn parse_trait_properties(&self, response: &str, concept_name: &str) -> Result<TraitProperties, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(TraitProperties {
            name: parsed.get("name").and_then(|v| v.as_str()).unwrap_or(concept_name).to_string(),
            description: parsed.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            measurement_criteria: parsed.get("measurement_criteria").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        })
    }

    async fn pass5_create_nodes(
        &self,
        verified: &[VerifiedConcept],
        properties: &[TraitProperties],
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created = Vec::new();
        let mut props_iter = properties.iter();

        for concept in verified {
            match &concept.action {
                ConceptAction::UseExisting { element_id } => {
                    created.push(CreatedNode::reused(
                        concept.name.clone(),
                        element_id.clone(),
                        "Trait".to_string(),
                    ));
                }
                ConceptAction::CreateNew => {
                    let props = props_iter.next().ok_or("Missing properties")?;

                    let mut node_props: HashMap<String, Value> = HashMap::new();
                    node_props.insert("name".to_string(), json!(props.name));
                    node_props.insert("description".to_string(), json!(props.description));
                    node_props.insert("measurement_criteria".to_string(), json!(props.measurement_criteria));

                    let request = CreateNodeRequest {
                        labels: vec!["Trait".to_string()],
                        properties: node_props,
                    };

                    let result = services::create_node(&self.graph, request, false)
                        .await
                        .map_err(|e| e.to_string())?;

                    created.push(CreatedNode::new(
                        props.name.clone(),
                        result.element_id,
                        "Trait".to_string(),
                    ));
                }
                _ => {} // Traits don't use CreateAndGeneralize
            }
        }

        Ok(created)
    }
}

#[async_trait::async_trait]
impl AgentStep for TraitGeneratorStep {
    fn agent_type(&self) -> AgentType {
        AgentType::TraitGenerator
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Identifying relevant traits...".to_string(),
        }).await;

        let concepts = self.pass1_conceptualize(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Found {} trait concepts", concepts.len()),
        }).await;

        let similarity_results = self.pass2_similarity_search(&concepts).await?;
        let verified = self.pass3_verify_matches(context, &similarity_results).await?;
        let properties = self.pass4_generate_properties(&verified).await?;
        let created = self.pass5_create_nodes(&verified, &properties).await?;

        for node in created {
            emit_event(&self.event_tx, SseEvent::NodeCreated {
                agent: self.agent_type(),
                node_name: node.name.clone(),
                label: "Trait".to_string(),
                was_reused: node.was_reused,
            }).await;

            context.add_trait(node);
        }

        Ok(())
    }
}

struct TraitProperties {
    name: String,
    description: String,
    measurement_criteria: String,
}
