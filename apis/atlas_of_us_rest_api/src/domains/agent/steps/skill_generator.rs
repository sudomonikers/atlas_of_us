use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep, StepUtils};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, ConceptAction, CreatedNode, GeneralizationLink, SseEvent, VerifiedConcept};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::models::{CreateNodeRequest, CreateRelationshipRequest};
use crate::domains::graph::services;
use crate::common::similarity::{find_similar_nodes, FindSimilarNodesRequest};

/// Skill Generator Step - creates Skill nodes with multi-pass logic
pub struct SkillGeneratorStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl SkillGeneratorStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    async fn pass1_conceptualize(&self, context: &AgentContext) -> Result<Vec<String>, String> {
        let description = context.description.clone().unwrap_or_default();
        let existing_knowledge: Vec<String> = context.domain_graph.knowledge
            .iter()
            .map(|n| n.name.clone())
            .collect();

        let prompt = PromptTemplates::skill_concepts(&context.domain_name, &description, &existing_knowledge);

        let config = GenerationConfig {
            max_tokens: Some(2048),
            temperature: Some(0.5),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::skill_expert(),
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
                label: Some("Skill".to_string()),
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
                agent: AgentType::SkillGenerator,
                concept: concept.clone(),
                similar_found: similar_nodes.len(),
                top_score,
            }).await;

            if let Some(decision) = StepUtils::determine_action_by_score(concept, similar_nodes) {
                verified.push(decision);
            } else {
                let prompt = PromptTemplates::verify_similar_skill(
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
                    SystemPrompts::skill_expert(),
                    &prompt,
                    &config,
                ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                let mut decision = StepUtils::parse_verification_response(&response, concept)?;

                // If create_and_generalize, resolve the target node ID
                if let ConceptAction::CreateAndGeneralize { generalizes_to_name, .. } = &decision.action {
                    let target_name = generalizes_to_name.clone();

                    // 1. Check if target is in the similar_nodes from current search
                    if let Some(node) = similar_nodes.iter().find(|n| n.name == target_name) {
                        decision = VerifiedConcept::create_and_generalize(
                            concept,
                            &node.id,
                            &target_name,
                            false,
                        );
                    } else {
                        // 2. Search DB for the target node by name
                        let search_results = find_similar_nodes(&self.graph, FindSimilarNodesRequest {
                            text: Some(target_name.clone()),
                            label: Some("Skill".to_string()),
                            limit: Some(1),
                            ..Default::default()
                        })
                        .await
                        .map_err(|e| format!("Similarity search failed: {}", e))?;

                        // Check for exact name match or very high similarity
                        if let Some(found) = search_results.first().filter(|n| n.score >= 0.95 || n.name == target_name) {
                            decision = VerifiedConcept::create_and_generalize(
                                concept,
                                &found.id,
                                &target_name,
                                false,
                            );
                        } else {
                            // 3. Target doesn't exist - mark for creation
                            decision = VerifiedConcept::create_and_generalize(
                                concept,
                                "",
                                &target_name,
                                true,
                            );
                        }
                    }
                }

                verified.push(decision);
            }
        }

        Ok(verified)
    }

    /// Pass 4: Create missing generalization target nodes
    async fn pass4_create_missing_targets(
        &self,
        verified: &mut Vec<VerifiedConcept>,
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created_targets = Vec::new();

        for concept in verified.iter_mut() {
            if let ConceptAction::CreateAndGeneralize {
                generalizes_to_name,
                needs_creation: true,
                ..
            } = &concept.action
            {
                let target_name = generalizes_to_name.clone();

                // Generate properties for the generic target node
                let prompt = PromptTemplates::generic_skill_properties(&target_name);

                let config = GenerationConfig {
                    max_tokens: Some(2048),
                    temperature: Some(0.3),
                    stop_sequences: None,
                };

                let response = self.llm.generate(
                    SystemPrompts::skill_expert(),
                    &prompt,
                    &config,
                ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                let props = self.parse_skill_properties(&response, &target_name)?;

                // Build node properties
                let mut node_props: HashMap<String, Value> = HashMap::new();
                node_props.insert("name".to_string(), json!(props.name));
                node_props.insert("description".to_string(), json!(props.description));
                node_props.insert("how_to_develop".to_string(), json!(props.how_to_develop));
                node_props.insert("novice_level".to_string(), json!(props.novice_level));
                node_props.insert("advanced_beginner_level".to_string(), json!(props.advanced_beginner_level));
                node_props.insert("competent_level".to_string(), json!(props.competent_level));
                node_props.insert("proficient_level".to_string(), json!(props.proficient_level));
                node_props.insert("expert_level".to_string(), json!(props.expert_level));

                let request = CreateNodeRequest {
                    labels: vec!["Skill".to_string()],
                    properties: node_props,
                };

                let result = services::create_node(&self.graph, request, false)
                    .await
                    .map_err(|e| e.to_string())?;

                // Update the concept with the new target ID
                concept.action = ConceptAction::CreateAndGeneralize {
                    generalizes_to_id: result.element_id.clone(),
                    generalizes_to_name: target_name.clone(),
                    needs_creation: false,
                };

                created_targets.push(CreatedNode::new(
                    target_name,
                    result.element_id,
                    "Skill".to_string(),
                ));
            }
        }

        Ok(created_targets)
    }

    /// Pass 5: Generate full properties for nodes to create
    async fn pass5_generate_properties(
        &self,
        context: &AgentContext,
        verified: &[VerifiedConcept],
    ) -> Result<Vec<SkillProperties>, String> {
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

            let prompt = PromptTemplates::skill_properties(
                &context.domain_name,
                &concept.name,
                generalizes_to,
            );

            let config = GenerationConfig {
                max_tokens: Some(2048),
                temperature: Some(0.3),
                stop_sequences: None,
            };

            let response = self.llm.generate(
                SystemPrompts::skill_expert(),
                &prompt,
                &config,
            ).await.map_err(|e| format!("LLM error: {:?}", e))?;

            let props = self.parse_skill_properties(&response, &concept.name)?;
            properties.push(props);
        }

        Ok(properties)
    }

    fn parse_skill_properties(&self, response: &str, concept_name: &str) -> Result<SkillProperties, String> {
        let trimmed = response.trim();
        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(SkillProperties {
            name: parsed.get("name").and_then(|v| v.as_str()).unwrap_or(concept_name).to_string(),
            description: parsed.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            how_to_develop: parsed.get("how_to_develop").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            novice_level: parsed.get("novice_level").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            advanced_beginner_level: parsed.get("advanced_beginner_level").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            competent_level: parsed.get("competent_level").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            proficient_level: parsed.get("proficient_level").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            expert_level: parsed.get("expert_level").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        })
    }

    /// Pass 6: Create nodes in database
    async fn pass6_create_nodes(
        &self,
        verified: &[VerifiedConcept],
        properties: &[SkillProperties],
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created = Vec::new();
        let mut props_iter = properties.iter();

        for concept in verified {
            match &concept.action {
                ConceptAction::UseExisting { element_id } => {
                    created.push(CreatedNode::reused(
                        concept.name.clone(),
                        element_id.clone(),
                        "Skill".to_string(),
                    ));
                }
                ConceptAction::CreateNew | ConceptAction::CreateAndGeneralize { .. } => {
                    let props = props_iter.next().ok_or("Missing properties")?;

                    let mut node_props: HashMap<String, Value> = HashMap::new();
                    node_props.insert("name".to_string(), json!(props.name));
                    node_props.insert("description".to_string(), json!(props.description));
                    node_props.insert("how_to_develop".to_string(), json!(props.how_to_develop));
                    node_props.insert("novice_level".to_string(), json!(props.novice_level));
                    node_props.insert("advanced_beginner_level".to_string(), json!(props.advanced_beginner_level));
                    node_props.insert("competent_level".to_string(), json!(props.competent_level));
                    node_props.insert("proficient_level".to_string(), json!(props.proficient_level));
                    node_props.insert("expert_level".to_string(), json!(props.expert_level));

                    let request = CreateNodeRequest {
                        labels: vec!["Skill".to_string()],
                        properties: node_props,
                    };

                    let result = services::create_node(&self.graph, request, false)
                        .await
                        .map_err(|e| e.to_string())?;

                    created.push(CreatedNode::new(
                        props.name.clone(),
                        result.element_id,
                        "Skill".to_string(),
                    ));
                }
            }
        }

        Ok(created)
    }

    /// Pass 7: Create GENERALIZES_TO relationships
    async fn pass7_create_generalization_relationships(
        &self,
        verified: &[VerifiedConcept],
        created: &[CreatedNode],
        context: &mut AgentContext,
    ) -> Result<(), String> {
        for concept in verified {
            if let ConceptAction::CreateAndGeneralize { generalizes_to_id, generalizes_to_name, .. } = &concept.action {
                let source = created.iter()
                    .find(|n| n.name == concept.name)
                    .ok_or_else(|| format!("Node not found: {}", concept.name))?;

                let rel_request = CreateRelationshipRequest {
                    source_id: source.element_id.clone(),
                    target_id: generalizes_to_id.clone(),
                    relationship_type: "GENERALIZES_TO".to_string(),
                    properties: None,
                };

                if services::create_relationship(&self.graph, rel_request).await.is_ok() {
                    // Track generalization in context
                    context.add_generalization(GeneralizationLink {
                        specific_id: source.element_id.clone(),
                        specific_name: source.name.clone(),
                        general_id: generalizes_to_id.clone(),
                        general_name: generalizes_to_name.clone(),
                        node_type: "Skill".to_string(),
                    });
                }
            }
        }

        Ok(())
    }
}

#[async_trait::async_trait]
impl AgentStep for SkillGeneratorStep {
    fn agent_type(&self) -> AgentType {
        AgentType::SkillGenerator
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        // Pass 1: Get concept list
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Identifying skill concepts...".to_string(),
        }).await;

        let concepts = self.pass1_conceptualize(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Found {} skill concepts", concepts.len()),
        }).await;

        // Pass 2: Similarity search
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Searching for similar existing nodes...".to_string(),
        }).await;

        let similarity_results = self.pass2_similarity_search(&concepts).await?;

        // Pass 3: Verify matches and resolve target IDs
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Verifying node matches...".to_string(),
        }).await;

        let mut verified = self.pass3_verify_matches(context, &similarity_results).await?;

        // Pass 4: Create missing generalization targets
        let targets_to_create = verified.iter()
            .filter(|c| matches!(&c.action, ConceptAction::CreateAndGeneralize { needs_creation: true, .. }))
            .count();

        if targets_to_create > 0 {
            emit_event(&self.event_tx, SseEvent::StepProgress {
                agent: self.agent_type(),
                message: format!("Creating {} missing generalization targets...", targets_to_create),
            }).await;

            let created_targets = self.pass4_create_missing_targets(&mut verified).await?;

            // Emit events for created target nodes
            for node in &created_targets {
                emit_event(&self.event_tx, SseEvent::NodeCreated {
                    agent: self.agent_type(),
                    node_name: node.name.clone(),
                    label: "Skill".to_string(),
                    was_reused: false,
                }).await;

                context.add_skill(node.clone());
            }
        }

        // Pass 5: Generate properties for source nodes
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Generating skill properties...".to_string(),
        }).await;

        let properties = self.pass5_generate_properties(context, &verified).await?;

        // Pass 6: Create source nodes
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating nodes in database...".to_string(),
        }).await;

        let created = self.pass6_create_nodes(&verified, &properties).await?;

        // Pass 7: Create GENERALIZES_TO relationships
        self.pass7_create_generalization_relationships(&verified, &created, context).await?;

        // Emit node created events and update context
        for node in created {
            emit_event(&self.event_tx, SseEvent::NodeCreated {
                agent: self.agent_type(),
                node_name: node.name.clone(),
                label: "Skill".to_string(),
                was_reused: node.was_reused,
            }).await;

            context.add_skill(node);
        }

        Ok(())
    }
}

struct SkillProperties {
    name: String,
    description: String,
    how_to_develop: String,
    novice_level: String,
    advanced_beginner_level: String,
    competent_level: String,
    proficient_level: String,
    expert_level: String,
}
