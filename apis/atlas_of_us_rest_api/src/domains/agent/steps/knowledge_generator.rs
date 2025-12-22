use neo4rs::Graph;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use serde_json::{json, Value};

use super::{emit_event, AgentStep, StepUtils, SIMILARITY_THRESHOLD_LOW, SIMILARITY_THRESHOLD_HIGH};
use crate::domains::agent::llm::{GenerationConfig, LlmProvider};
use crate::domains::agent::models::{AgentContext, AgentType, ConceptAction, CreatedNode, SseEvent, VerifiedConcept};
use crate::domains::agent::prompts::{PromptTemplates, SystemPrompts};
use crate::domains::graph::handlers::{
    create_node_internal, create_relationship_internal, find_node_by_name,
    CreateNodeRequest, CreateRelationshipRequest,
};
use crate::common::similarity::{find_similar_by_text, SimilarNodeResult};

/// Knowledge Generator Step - creates Knowledge nodes with multi-pass logic
pub struct KnowledgeGeneratorStep {
    llm: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl KnowledgeGeneratorStep {
    pub fn new(
        llm: Arc<dyn LlmProvider>,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Self {
        Self { llm, graph, event_tx }
    }

    /// Pass 1: Get concept list from LLM
    async fn pass1_conceptualize(&self, context: &AgentContext) -> Result<Vec<String>, String> {
        let description = context.description.clone().unwrap_or_default();
        let prompt = PromptTemplates::knowledge_concepts(&context.domain_name, &description);

        let config = GenerationConfig {
            max_tokens: Some(2048),
            temperature: Some(0.5),
            stop_sequences: None,
        };

        let response = self.llm.generate(
            SystemPrompts::knowledge_expert(),
            &prompt,
            &config,
        ).await.map_err(|e| format!("LLM error: {:?}", e))?;

        StepUtils::parse_concept_list(&response)
    }

    /// Pass 2: Find similar nodes for each concept
    async fn pass2_similarity_search(&self, concepts: &[String]) -> Result<Vec<(String, Vec<SimilarNodeResult>)>, String> {
        let mut results = Vec::new();

        for concept in concepts {
            let similar = find_similar_by_text(&self.graph, concept, Some("Knowledge"), 3)
                .await
                .map_err(|e| format!("Similarity search failed: {}", e))?;

            results.push((concept.clone(), similar));
        }

        Ok(results)
    }

    /// Pass 3: Verify matches with LLM for moderate similarity scores
    async fn pass3_verify_matches(
        &self,
        context: &AgentContext,
        similarity_results: &[(String, Vec<SimilarNodeResult>)],
    ) -> Result<Vec<VerifiedConcept>, String> {
        let mut verified = Vec::new();

        for (concept, similar_nodes) in similarity_results {
            // Emit similarity check event
            let top_score = similar_nodes.first().map(|n| n.score);
            emit_event(&self.event_tx, SseEvent::SimilarityCheck {
                agent: AgentType::KnowledgeGenerator,
                concept: concept.clone(),
                similar_found: similar_nodes.len(),
                top_score,
            }).await;

            // Check if we can decide without LLM
            if let Some(decision) = StepUtils::determine_action_by_score(concept, similar_nodes) {
                let decision_str = match &decision.action {
                    ConceptAction::CreateNew => "create_new",
                    ConceptAction::UseExisting { .. } => "use_existing",
                    ConceptAction::CreateAndGeneralize { .. } => "create_and_generalize",
                };

                emit_event(&self.event_tx, SseEvent::VerificationResult {
                    agent: AgentType::KnowledgeGenerator,
                    concept: concept.clone(),
                    decision: decision_str.to_string(),
                    generalizes_to: None,
                }).await;

                verified.push(decision);
            } else {
                // Need LLM verification
                let prompt = PromptTemplates::verify_similar_knowledge(
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
                    SystemPrompts::knowledge_expert(),
                    &prompt,
                    &config,
                ).await.map_err(|e| format!("LLM error: {:?}", e))?;

                let mut decision = StepUtils::parse_verification_response(&response, concept)?;

                // If create_and_generalize, find the element ID of the existing node
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

                let (decision_str, generalizes_to) = match &decision.action {
                    ConceptAction::CreateNew => ("create_new", None),
                    ConceptAction::UseExisting { .. } => ("use_existing", None),
                    ConceptAction::CreateAndGeneralize { generalizes_to_name, .. } => {
                        ("create_and_generalize", Some(generalizes_to_name.clone()))
                    }
                };

                emit_event(&self.event_tx, SseEvent::VerificationResult {
                    agent: AgentType::KnowledgeGenerator,
                    concept: concept.clone(),
                    decision: decision_str.to_string(),
                    generalizes_to,
                }).await;

                verified.push(decision);
            }
        }

        Ok(verified)
    }

    /// Pass 4: Generate full properties for nodes to create
    async fn pass4_generate_properties(
        &self,
        context: &AgentContext,
        verified: &[VerifiedConcept],
    ) -> Result<Vec<KnowledgeProperties>, String> {
        let mut properties = Vec::new();

        for concept in verified {
            // Skip if using existing node
            if matches!(concept.action, ConceptAction::UseExisting { .. }) {
                continue;
            }

            let generalizes_to = if let ConceptAction::CreateAndGeneralize { generalizes_to_name, .. } = &concept.action {
                Some(generalizes_to_name.as_str())
            } else {
                None
            };

            let prompt = PromptTemplates::knowledge_properties(
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
                SystemPrompts::knowledge_expert(),
                &prompt,
                &config,
            ).await.map_err(|e| format!("LLM error: {:?}", e))?;

            let props = self.parse_knowledge_properties(&response, &concept.name)?;
            properties.push(props);
        }

        Ok(properties)
    }

    /// Parse knowledge properties from LLM response
    fn parse_knowledge_properties(&self, response: &str, concept_name: &str) -> Result<KnowledgeProperties, String> {
        let trimmed = response.trim();

        let start = trimmed.find('{').ok_or("No JSON object found")?;
        let end = trimmed.rfind('}').ok_or("No closing brace found")?;

        if end <= start {
            return Err("Invalid JSON structure".to_string());
        }

        let json_str = &trimmed[start..=end];
        let parsed: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        Ok(KnowledgeProperties {
            name: parsed.get("name")
                .and_then(|v| v.as_str())
                .unwrap_or(concept_name)
                .to_string(),
            description: parsed.get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            how_to_learn: parsed.get("how_to_learn")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            remember_level: parsed.get("remember_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            understand_level: parsed.get("understand_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            apply_level: parsed.get("apply_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            analyze_level: parsed.get("analyze_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            evaluate_level: parsed.get("evaluate_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            create_level: parsed.get("create_level")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        })
    }

    /// Pass 5: Create nodes in database
    async fn pass5_create_nodes(
        &self,
        verified: &[VerifiedConcept],
        properties: &[KnowledgeProperties],
    ) -> Result<Vec<CreatedNode>, String> {
        let mut created = Vec::new();
        let mut props_iter = properties.iter();

        for concept in verified {
            match &concept.action {
                ConceptAction::UseExisting { element_id } => {
                    // Just track the existing node
                    created.push(CreatedNode::reused(
                        concept.name.clone(),
                        element_id.clone(),
                        "Knowledge".to_string(),
                    ));
                }
                ConceptAction::CreateNew | ConceptAction::CreateAndGeneralize { .. } => {
                    // Get the properties for this concept
                    let props = props_iter.next()
                        .ok_or("Missing properties for concept")?;

                    // Build node properties
                    let mut node_props: HashMap<String, Value> = HashMap::new();
                    node_props.insert("name".to_string(), json!(props.name));
                    node_props.insert("description".to_string(), json!(props.description));
                    node_props.insert("how_to_learn".to_string(), json!(props.how_to_learn));
                    node_props.insert("remember_level".to_string(), json!(props.remember_level));
                    node_props.insert("understand_level".to_string(), json!(props.understand_level));
                    node_props.insert("apply_level".to_string(), json!(props.apply_level));
                    node_props.insert("analyze_level".to_string(), json!(props.analyze_level));
                    node_props.insert("evaluate_level".to_string(), json!(props.evaluate_level));
                    node_props.insert("create_level".to_string(), json!(props.create_level));

                    let request = CreateNodeRequest {
                        labels: vec!["Knowledge".to_string()],
                        properties: node_props,
                    };

                    let result = create_node_internal(&self.graph, request).await?;

                    created.push(CreatedNode::new(
                        props.name.clone(),
                        result.element_id,
                        "Knowledge".to_string(),
                    ));
                }
            }
        }

        Ok(created)
    }

    /// Create GENERALIZES_TO relationships
    async fn create_generalization_relationships(
        &self,
        verified: &[VerifiedConcept],
        created: &[CreatedNode],
    ) -> Result<(), String> {
        for concept in verified {
            if let ConceptAction::CreateAndGeneralize { generalizes_to_id, .. } = &concept.action {
                // Find the created node's element ID
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
impl AgentStep for KnowledgeGeneratorStep {
    fn agent_type(&self) -> AgentType {
        AgentType::KnowledgeGenerator
    }

    async fn execute(&self, context: &mut AgentContext) -> Result<(), String> {
        // Pass 1: Get concept list
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Identifying knowledge concepts...".to_string(),
        }).await;

        let concepts = self.pass1_conceptualize(context).await?;

        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: format!("Found {} knowledge concepts", concepts.len()),
        }).await;

        // Pass 2: Similarity search
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Searching for similar existing nodes...".to_string(),
        }).await;

        let similarity_results = self.pass2_similarity_search(&concepts).await?;

        // Pass 3: Verify matches
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Verifying node matches...".to_string(),
        }).await;

        let verified = self.pass3_verify_matches(context, &similarity_results).await?;

        // Pass 4: Generate properties
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Generating knowledge properties...".to_string(),
        }).await;

        let properties = self.pass4_generate_properties(context, &verified).await?;

        // Pass 5: Create nodes
        emit_event(&self.event_tx, SseEvent::StepProgress {
            agent: self.agent_type(),
            message: "Creating nodes in database...".to_string(),
        }).await;

        let created = self.pass5_create_nodes(&verified, &properties).await?;

        // Create GENERALIZES_TO relationships
        self.create_generalization_relationships(&verified, &created).await?;

        // Emit node created events and update context
        for node in created {
            emit_event(&self.event_tx, SseEvent::NodeCreated {
                agent: self.agent_type(),
                node_name: node.name.clone(),
                label: "Knowledge".to_string(),
                was_reused: node.was_reused,
            }).await;

            context.add_knowledge(node);
        }

        Ok(())
    }
}

/// Properties for a Knowledge node
struct KnowledgeProperties {
    name: String,
    description: String,
    how_to_learn: String,
    remember_level: String,
    understand_level: String,
    apply_level: String,
    analyze_level: String,
    evaluate_level: String,
    create_level: String,
}
