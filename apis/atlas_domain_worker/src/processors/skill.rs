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

/// Properties for a Skill node
#[derive(Debug, Deserialize)]
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

/// Processor for Skill nodes
pub struct SkillProcessor<'a> {
    llm_service: &'a LlmService,
}

impl<'a> SkillProcessor<'a> {
    pub fn new(llm_service: &'a LlmService) -> Self {
        Self { llm_service }
    }

    /// Generate properties for a skill node
    async fn generate_properties(
        &self,
        node_name: &str,
        domain_name: &str,
        domain_description: Option<&str>,
    ) -> Result<SkillProperties, ProcessingError> {
        let system_prompt = r#"You are an expert at creating skill nodes for a personal development knowledge graph.
Generate comprehensive properties for a Skill node following the Dreyfus Model of skill acquisition.

Respond with a JSON object containing:
- "name": the skill name
- "description": 1-2 sentence description of this skill
- "how_to_develop": practical guidance on how to develop this skill
- "novice_level": what a Novice can do (follows rules rigidly, no context)
- "advanced_beginner_level": what an Advanced Beginner can do (recognizes aspects, still rule-based)
- "competent_level": what someone Competent can do (deliberate planning, handles complexity)
- "proficient_level": what someone Proficient can do (holistic view, knows what's important)
- "expert_level": what an Expert can do (intuitive, sees what's possible)

IMPORTANT: Only respond with valid JSON, no other text."#;

        let description_context = domain_description
            .map(|d| format!("\nDomain description: {}", d))
            .unwrap_or_default();

        let user_prompt = format!(
            "Generate Skill node properties for:\nDomain: {}{}\nSkill: {}",
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
                "Failed to parse skill properties: {}. Response: {}",
                e, response
            ))
        })
    }

    /// Create a Skill node in Neo4j
    async fn create_node(
        &self,
        graph: &Graph,
        props: &SkillProperties,
    ) -> Result<CreatedNode, ProcessingError> {
        let embedding = generate_embedding(&props.name)
            .await
            .map_err(|e| ProcessingError::Embedding(e.to_string()))?;

        let query = Query::new(
            r#"
            CREATE (n:Skill {
                name: $name,
                description: $description,
                how_to_develop: $how_to_develop,
                novice_level: $novice_level,
                advanced_beginner_level: $advanced_beginner_level,
                competent_level: $competent_level,
                proficient_level: $proficient_level,
                expert_level: $expert_level,
                embedding: $embedding
            })
            RETURN elementId(n) as element_id, n.name as name
            "#
            .to_string(),
        )
        .param("name", props.name.clone())
        .param("description", props.description.clone())
        .param("how_to_develop", props.how_to_develop.clone())
        .param("novice_level", props.novice_level.clone())
        .param("advanced_beginner_level", props.advanced_beginner_level.clone())
        .param("competent_level", props.competent_level.clone())
        .param("proficient_level", props.proficient_level.clone())
        .param("expert_level", props.expert_level.clone())
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
impl<'a> NodeProcessor for SkillProcessor<'a> {
    async fn process(
        &self,
        job: &NodeGenerationJob,
        graph: &Graph,
    ) -> Result<NodeGenerationResult, ProcessingError> {
        tracing::info!(
            job_id = %job.job_id,
            node_name = %job.node_name,
            "Processing Skill node"
        );

        // Step 1: Find similar nodes
        let similar_nodes = find_similar_by_text(graph, &job.node_name, Some("Skill"), 3)
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
            "Skill",
        )
        .await?;

        // Step 3: Execute decision
        let (element_id, was_reused) = match decision {
            ConceptDecision::UseExisting { element_id, name } => {
                tracing::info!(
                    job_id = %job.job_id,
                    reused_node = %name,
                    "Reusing existing Skill node"
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
                    "Created new Skill node"
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

                create_generalization(graph, &created.element_id, &target_id).await?;

                tracing::info!(
                    job_id = %job.job_id,
                    element_id = %created.element_id,
                    generalizes_to = %target_name,
                    "Created Skill node with generalization"
                );

                (created.element_id, false)
            }
        };

        // Step 4: Assign to level
        let level = determine_level(job.suggested_level, &job.node_name, &job.domain_levels);
        if let Some(level_info) = job.domain_levels.iter().find(|l| l.level == level) {
            create_level_requirement(graph, &level_info.element_id, &element_id, "REQUIRES_SKILL")
                .await?;

            tracing::info!(
                job_id = %job.job_id,
                level = level,
                level_name = %level_info.name,
                "Assigned Skill node to level"
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
