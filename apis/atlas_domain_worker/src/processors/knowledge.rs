use async_trait::async_trait;
use neo4rs::{Graph, Query};
use serde::Deserialize;

use crate::handler::ProcessingError;
use crate::messages::{NodeGenerationJob, NodeGenerationResult};
use crate::services::{find_similar_by_text, generate_embedding, GenerationConfig, LlmService};

use super::common::{
    create_generalization, create_level_requirement, decide_concept_action, determine_level,
    extract_json, ConceptDecision, CreatedNode, NodeProcessor, SimilarityThresholds,
};

/// Properties for a Knowledge node
#[derive(Debug, Deserialize)]
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

/// Processor for Knowledge nodes
pub struct KnowledgeProcessor<'a> {
    llm_service: &'a LlmService,
}

impl<'a> KnowledgeProcessor<'a> {
    pub fn new(llm_service: &'a LlmService) -> Self {
        Self { llm_service }
    }

    /// Generate properties for a knowledge node
    async fn generate_properties(
        &self,
        node_name: &str,
        domain_name: &str,
        domain_description: Option<&str>,
    ) -> Result<KnowledgeProperties, ProcessingError> {
        let system_prompt = r#"You are an expert at creating knowledge nodes for a personal development knowledge graph.
Generate comprehensive properties for a Knowledge node following Bloom's Taxonomy levels.

Respond with a JSON object containing:
- "name": the knowledge concept name
- "description": 1-2 sentence description of this knowledge
- "how_to_learn": practical guidance on how to learn this knowledge
- "remember_level": what someone at Remember level can do (recall facts, definitions)
- "understand_level": what someone at Understand level can do (explain, summarize)
- "apply_level": what someone at Apply level can do (use knowledge in situations)
- "analyze_level": what someone at Analyze level can do (break down, compare)
- "evaluate_level": what someone at Evaluate level can do (judge, critique)
- "create_level": what someone at Create level can do (design, construct new things)

IMPORTANT: Only respond with valid JSON, no other text."#;

        let description_context = domain_description
            .map(|d| format!("\nDomain description: {}", d))
            .unwrap_or_default();

        let user_prompt = format!(
            "Generate Knowledge node properties for:\nDomain: {}{}\nKnowledge concept: {}",
            domain_name, description_context, node_name
        );

        let config = GenerationConfig {
            max_tokens: 2048,
            temperature: 0.7,
        };

        let response = self
            .llm_service
            .generate(system_prompt, &user_prompt, &config)
            .await?;

        let json_str = extract_json(&response);
        serde_json::from_str(json_str).map_err(|e| {
            ProcessingError::InvalidData(format!(
                "Failed to parse knowledge properties: {}. Response: {}",
                e, response
            ))
        })
    }

    /// Create a Knowledge node in Neo4j
    async fn create_node(
        &self,
        graph: &Graph,
        props: &KnowledgeProperties,
    ) -> Result<CreatedNode, ProcessingError> {
        let embedding = generate_embedding(&props.name)
            .await
            .map_err(|e| ProcessingError::Embedding(e.to_string()))?;

        let query = Query::new(
            r#"
            CREATE (n:Knowledge {
                name: $name,
                description: $description,
                how_to_learn: $how_to_learn,
                remember_level: $remember_level,
                understand_level: $understand_level,
                apply_level: $apply_level,
                analyze_level: $analyze_level,
                evaluate_level: $evaluate_level,
                create_level: $create_level,
                embedding: $embedding
            })
            RETURN elementId(n) as element_id, n.name as name
            "#
            .to_string(),
        )
        .param("name", props.name.clone())
        .param("description", props.description.clone())
        .param("how_to_learn", props.how_to_learn.clone())
        .param("remember_level", props.remember_level.clone())
        .param("understand_level", props.understand_level.clone())
        .param("apply_level", props.apply_level.clone())
        .param("analyze_level", props.analyze_level.clone())
        .param("evaluate_level", props.evaluate_level.clone())
        .param("create_level", props.create_level.clone())
        .param("embedding", embedding);

        let mut result = graph
            .execute(query)
            .await
            .map_err(|e| ProcessingError::Neo4j(e.to_string()))?;

        if let Some(row) = result
            .next()
            .await
            .map_err(|e| ProcessingError::Neo4j(e.to_string()))?
        {
            Ok(CreatedNode {
                element_id: row.get("element_id").unwrap_or_default(),
                name: row.get("name").unwrap_or_default(),
            })
        } else {
            Err(ProcessingError::Neo4j("No result returned".to_string()))
        }
    }
}

#[async_trait]
impl<'a> NodeProcessor for KnowledgeProcessor<'a> {
    async fn process(
        &self,
        job: &NodeGenerationJob,
        graph: &Graph,
    ) -> Result<NodeGenerationResult, ProcessingError> {
        tracing::info!(
            job_id = %job.job_id,
            node_name = %job.node_name,
            "Processing Knowledge node"
        );

        // Step 1: Find similar nodes
        let similar_nodes = find_similar_by_text(graph, &job.node_name, Some("Knowledge"), 3)
            .await
            .map_err(|e| ProcessingError::Similarity(e.to_string()))?;

        // Step 2: Decide what to do
        let thresholds = SimilarityThresholds::standard();
        let decision = decide_concept_action(
            &job.node_name,
            &similar_nodes,
            &thresholds,
            self.llm_service,
            &job.domain_name,
            "Knowledge",
        )
        .await?;

        // Step 3: Execute decision
        let (element_id, was_reused) = match decision {
            ConceptDecision::UseExisting { element_id, name } => {
                tracing::info!(
                    job_id = %job.job_id,
                    reused_node = %name,
                    "Reusing existing Knowledge node"
                );
                (element_id, true)
            }
            ConceptDecision::CreateNew => {
                let props = self
                    .generate_properties(
                        &job.node_name,
                        &job.domain_name,
                        job.domain_description.as_deref(),
                    )
                    .await?;

                let created = self.create_node(graph, &props).await?;

                tracing::info!(
                    job_id = %job.job_id,
                    element_id = %created.element_id,
                    "Created new Knowledge node"
                );

                (created.element_id, false)
            }
            ConceptDecision::CreateAndGeneralize {
                target_id,
                target_name,
            } => {
                let props = self
                    .generate_properties(
                        &job.node_name,
                        &job.domain_name,
                        job.domain_description.as_deref(),
                    )
                    .await?;

                let created = self.create_node(graph, &props).await?;

                // Create GENERALIZES_TO relationship
                create_generalization(graph, &created.element_id, &target_id).await?;

                tracing::info!(
                    job_id = %job.job_id,
                    element_id = %created.element_id,
                    generalizes_to = %target_name,
                    "Created Knowledge node with generalization"
                );

                (created.element_id, false)
            }
        };

        // Step 4: Assign to level
        let level = determine_level(job.suggested_level, &job.node_name, &job.domain_levels);
        if let Some(level_info) = job.domain_levels.iter().find(|l| l.level == level) {
            create_level_requirement(
                graph,
                &level_info.element_id,
                &element_id,
                "REQUIRES_KNOWLEDGE",
            )
            .await?;

            tracing::info!(
                job_id = %job.job_id,
                level = level,
                level_name = %level_info.name,
                "Assigned Knowledge node to level"
            );
        }

        Ok(NodeGenerationResult::success(
            job.job_id.clone(),
            element_id,
            was_reused,
            Some(level),
            0,
        ))
    }
}
