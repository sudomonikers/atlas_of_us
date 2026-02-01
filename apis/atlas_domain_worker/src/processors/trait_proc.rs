use async_trait::async_trait;
use neo4rs::{Graph, Query};
use serde::Deserialize;

use crate::handler::ProcessingError;
use crate::messages::{NodeGenerationJob, NodeGenerationResult};
use crate::services::{find_similar_by_text, generate_embedding, GenerationConfig, LlmService};

use super::common::{
    create_level_requirement, decide_concept_action, determine_level, extract_json,
    ConceptDecision, CreatedNode, NodeProcessor, SimilarityThresholds,
};

/// Properties for a Trait node
#[derive(Debug, Deserialize)]
struct TraitProperties {
    name: String,
    description: String,
    measurement_criteria: String,
}

/// Processor for Trait nodes
/// Traits are simpler than Knowledge/Skill - no generalization support
pub struct TraitProcessor<'a> {
    llm_service: &'a LlmService,
}

impl<'a> TraitProcessor<'a> {
    pub fn new(llm_service: &'a LlmService) -> Self {
        Self { llm_service }
    }

    /// Generate properties for a trait node
    async fn generate_properties(
        &self,
        node_name: &str,
        domain_name: &str,
        domain_description: Option<&str>,
    ) -> Result<TraitProperties, ProcessingError> {
        let system_prompt = r#"You are an expert at creating trait nodes for a personal development knowledge graph.
Generate properties for a Trait node (personality characteristic or behavioral tendency).

Respond with a JSON object containing:
- "name": the trait name
- "description": 1-2 sentence description of this trait
- "measurement_criteria": how to measure or assess this trait (specific, observable behaviors)

IMPORTANT: Only respond with valid JSON, no other text."#;

        let description_context = domain_description
            .map(|d| format!("\nDomain description: {}", d))
            .unwrap_or_default();

        let user_prompt = format!(
            "Generate Trait node properties for:\nDomain: {}{}\nTrait: {}",
            domain_name, description_context, node_name
        );

        let config = GenerationConfig {
            max_tokens: 1024,
            temperature: 0.7,
        };

        let response = self
            .llm_service
            .generate(system_prompt, &user_prompt, &config)
            .await?;

        let json_str = extract_json(&response);
        serde_json::from_str(json_str).map_err(|e| {
            ProcessingError::InvalidData(format!(
                "Failed to parse trait properties: {}. Response: {}",
                e, response
            ))
        })
    }

    /// Create a Trait node in Neo4j
    async fn create_node(
        &self,
        graph: &Graph,
        props: &TraitProperties,
    ) -> Result<CreatedNode, ProcessingError> {
        let embedding = generate_embedding(&props.name)
            .await
            .map_err(|e| ProcessingError::Embedding(e.to_string()))?;

        let query = Query::new(
            r#"
            CREATE (n:Trait {
                name: $name,
                description: $description,
                measurement_criteria: $measurement_criteria,
                embedding: $embedding
            })
            RETURN elementId(n) as element_id, n.name as name
            "#
            .to_string(),
        )
        .param("name", props.name.clone())
        .param("description", props.description.clone())
        .param("measurement_criteria", props.measurement_criteria.clone())
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
impl<'a> NodeProcessor for TraitProcessor<'a> {
    async fn process(
        &self,
        job: &NodeGenerationJob,
        graph: &Graph,
    ) -> Result<NodeGenerationResult, ProcessingError> {
        tracing::info!(
            job_id = %job.job_id,
            node_name = %job.node_name,
            "Processing Trait node"
        );

        // Step 1: Find similar nodes
        let similar_nodes = find_similar_by_text(graph, &job.node_name, Some("Trait"), 3)
            .await
            .map_err(|e| ProcessingError::Similarity(e.to_string()))?;

        // Step 2: Decide what to do (traits use different thresholds, more likely to reuse)
        let thresholds = SimilarityThresholds::trait_node();
        let decision = decide_concept_action(
            &job.node_name,
            &similar_nodes,
            &thresholds,
            self.llm_service,
            &job.domain_name,
            "Trait",
        )
        .await?;

        // Step 3: Execute decision (no generalization for traits)
        let (element_id, was_reused) = match decision {
            ConceptDecision::UseExisting { element_id, name } => {
                tracing::info!(
                    job_id = %job.job_id,
                    reused_node = %name,
                    "Reusing existing Trait node"
                );
                (element_id, true)
            }
            ConceptDecision::CreateNew | ConceptDecision::CreateAndGeneralize { .. } => {
                // For traits, we don't do generalization - just create new
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
                    "Created new Trait node"
                );

                (created.element_id, false)
            }
        };

        // Step 4: Assign to level
        let level = determine_level(job.suggested_level, &job.node_name, &job.domain_levels);
        if let Some(level_info) = job.domain_levels.iter().find(|l| l.level == level) {
            create_level_requirement(graph, &level_info.element_id, &element_id, "REQUIRES_TRAIT")
                .await?;

            tracing::info!(
                job_id = %job.job_id,
                level = level,
                level_name = %level_info.name,
                "Assigned Trait node to level"
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
