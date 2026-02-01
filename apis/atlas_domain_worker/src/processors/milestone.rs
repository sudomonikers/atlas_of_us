use async_trait::async_trait;
use neo4rs::{Graph, Query};
use serde::Deserialize;

use crate::handler::ProcessingError;
use crate::messages::{NodeGenerationJob, NodeGenerationResult};
use crate::services::{generate_embedding, GenerationConfig, LlmService};

use super::common::{
    create_level_requirement, determine_level, extract_json, CreatedNode, NodeProcessor,
};

/// Properties for a Milestone node
#[derive(Debug, Deserialize)]
struct MilestoneProperties {
    name: String,
    description: String,
    how_to_achieve: String,
}

/// Processor for Milestone nodes
/// Milestones are unique to each domain - no similarity checking
pub struct MilestoneProcessor<'a> {
    llm_service: &'a LlmService,
}

impl<'a> MilestoneProcessor<'a> {
    pub fn new(llm_service: &'a LlmService) -> Self {
        Self { llm_service }
    }

    /// Generate properties for a milestone node
    async fn generate_properties(
        &self,
        node_name: &str,
        domain_name: &str,
        domain_description: Option<&str>,
    ) -> Result<MilestoneProperties, ProcessingError> {
        let system_prompt = r#"You are an expert at creating milestone nodes for a personal development knowledge graph.
Generate properties for a Milestone node (an achievement or accomplishment in the domain).

Respond with a JSON object containing:
- "name": the milestone name
- "description": 1-2 sentence description of this milestone achievement
- "how_to_achieve": practical steps to achieve this milestone

IMPORTANT: Only respond with valid JSON, no other text."#;

        let description_context = domain_description
            .map(|d| format!("\nDomain description: {}", d))
            .unwrap_or_default();

        let user_prompt = format!(
            "Generate Milestone node properties for:\nDomain: {}{}\nMilestone: {}",
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
                "Failed to parse milestone properties: {}. Response: {}",
                e, response
            ))
        })
    }

    /// Create a Milestone node in Neo4j
    async fn create_node(
        &self,
        graph: &Graph,
        props: &MilestoneProperties,
    ) -> Result<CreatedNode, ProcessingError> {
        let embedding = generate_embedding(&props.name)
            .await
            .map_err(|e| ProcessingError::Embedding(e.to_string()))?;

        let query = Query::new(
            r#"
            CREATE (n:Milestone {
                name: $name,
                description: $description,
                how_to_achieve: $how_to_achieve,
                embedding: $embedding
            })
            RETURN elementId(n) as element_id, n.name as name
            "#
            .to_string(),
        )
        .param("name", props.name.clone())
        .param("description", props.description.clone())
        .param("how_to_achieve", props.how_to_achieve.clone())
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
impl<'a> NodeProcessor for MilestoneProcessor<'a> {
    async fn process(
        &self,
        job: &NodeGenerationJob,
        graph: &Graph,
    ) -> Result<NodeGenerationResult, ProcessingError> {
        tracing::info!(
            job_id = %job.job_id,
            node_name = %job.node_name,
            "Processing Milestone node"
        );

        // Milestones are always created new - no similarity checking
        // (they're unique achievements for each domain)

        // Step 1: Generate properties
        let props = self
            .generate_properties(
                &job.node_name,
                &job.domain_name,
                job.domain_description.as_deref(),
            )
            .await?;

        // Step 2: Create the node
        let created = self.create_node(graph, &props).await?;

        tracing::info!(
            job_id = %job.job_id,
            element_id = %created.element_id,
            "Created new Milestone node"
        );

        // Step 3: Assign to level
        let level = determine_level(job.suggested_level, &job.node_name, &job.domain_levels);
        if let Some(level_info) = job.domain_levels.iter().find(|l| l.level == level) {
            create_level_requirement(
                graph,
                &level_info.element_id,
                &created.element_id,
                "REQUIRES_MILESTONE",
            )
            .await?;

            tracing::info!(
                job_id = %job.job_id,
                level = level,
                level_name = %level_info.name,
                "Assigned Milestone node to level"
            );
        }

        Ok(NodeGenerationResult::success(
            job.job_id.clone(),
            created.element_id,
            false, // Milestones are never reused
            Some(level),
            0,
        ))
    }
}
