use async_trait::async_trait;
use neo4rs::{Graph, Query};
use serde::Deserialize;

use crate::handler::ProcessingError;
use crate::messages::{NodeGenerationJob, NodeGenerationResult};
use crate::services::{GenerationConfig, LlmService, SimilarNodeResult};

/// Trait for node processors
#[async_trait]
pub trait NodeProcessor {
    /// Process a node generation job
    async fn process(
        &self,
        job: &NodeGenerationJob,
        graph: &Graph,
    ) -> Result<NodeGenerationResult, ProcessingError>;
}

/// Similarity thresholds for different node types
pub struct SimilarityThresholds {
    pub auto_reuse: f64,  // Above this, auto-reuse existing node
    pub auto_create: f64, // Below this, auto-create new node
}

impl SimilarityThresholds {
    /// Thresholds for Knowledge and Skill nodes
    pub fn standard() -> Self {
        Self {
            auto_reuse: 0.95,
            auto_create: 0.70,
        }
    }

    /// Thresholds for Trait nodes (more likely to reuse)
    pub fn trait_node() -> Self {
        Self {
            auto_reuse: 0.85,
            auto_create: 0.65,
        }
    }
}

/// Decision for how to handle a concept based on similarity
#[derive(Debug, Clone)]
pub enum ConceptDecision {
    /// Reuse an existing node
    UseExisting { element_id: String, name: String },
    /// Create a new node
    CreateNew,
    /// Create a new node that generalizes to an existing node
    CreateAndGeneralize {
        target_id: String,
        target_name: String,
    },
}

/// LLM verification response
#[derive(Debug, Deserialize)]
pub struct VerificationResponse {
    pub decision: String,
    pub existing_node_name: Option<String>,
    pub suggested_target: Option<String>,
    pub reason: Option<String>,
}

/// Determine what to do with a concept based on similarity results
pub async fn decide_concept_action(
    concept_name: &str,
    similar_nodes: &[SimilarNodeResult],
    thresholds: &SimilarityThresholds,
    llm: &LlmService,
    domain_name: &str,
    node_label: &str,
) -> Result<ConceptDecision, ProcessingError> {
    // Check for high similarity - auto reuse
    if let Some(top_match) = similar_nodes.first() {
        if top_match.score >= thresholds.auto_reuse {
            tracing::info!(
                concept = %concept_name,
                match_name = %top_match.name,
                score = top_match.score,
                "Auto-reusing existing node (high similarity)"
            );
            return Ok(ConceptDecision::UseExisting {
                element_id: top_match.id.clone(),
                name: top_match.name.clone(),
            });
        }
    }

    // Check for low similarity - auto create
    let top_score = similar_nodes.first().map(|n| n.score).unwrap_or(0.0);
    if top_score < thresholds.auto_create {
        tracing::info!(
            concept = %concept_name,
            top_score = top_score,
            "Auto-creating new node (low similarity)"
        );
        return Ok(ConceptDecision::CreateNew);
    }

    // Moderate similarity - ask LLM to verify
    tracing::info!(
        concept = %concept_name,
        top_score = top_score,
        "Requesting LLM verification (moderate similarity)"
    );

    let verification =
        verify_with_llm(concept_name, similar_nodes, llm, domain_name, node_label).await?;

    match verification.decision.as_str() {
        "use_existing" => {
            let existing = similar_nodes
                .iter()
                .find(|n| Some(&n.name) == verification.existing_node_name.as_ref())
                .or_else(|| similar_nodes.first());

            if let Some(node) = existing {
                Ok(ConceptDecision::UseExisting {
                    element_id: node.id.clone(),
                    name: node.name.clone(),
                })
            } else {
                Ok(ConceptDecision::CreateNew)
            }
        }
        "create_and_generalize" => {
            // Find the target node to generalize to
            if let Some(target_name) =
                verification.existing_node_name.or(verification.suggested_target)
            {
                if let Some(target) = similar_nodes.iter().find(|n| n.name == target_name) {
                    Ok(ConceptDecision::CreateAndGeneralize {
                        target_id: target.id.clone(),
                        target_name: target.name.clone(),
                    })
                } else {
                    // Target not found, just create new
                    Ok(ConceptDecision::CreateNew)
                }
            } else {
                Ok(ConceptDecision::CreateNew)
            }
        }
        _ => Ok(ConceptDecision::CreateNew),
    }
}

/// Ask LLM to verify similarity match
async fn verify_with_llm(
    concept_name: &str,
    similar_nodes: &[SimilarNodeResult],
    llm: &LlmService,
    domain_name: &str,
    node_label: &str,
) -> Result<VerificationResponse, ProcessingError> {
    let similar_list = similar_nodes
        .iter()
        .map(|n| {
            format!(
                "- {} (score: {:.2}): {}",
                n.name,
                n.score,
                n.description.as_deref().unwrap_or("No description")
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let system_prompt = format!(
        r#"You are an expert at semantic similarity analysis for a knowledge graph.
Your task is to determine if a concept should reuse an existing node, create a new node,
or create a domain-specific node that generalizes to an existing node.

Respond with a JSON object containing:
- "decision": one of "use_existing", "create_new", or "create_and_generalize"
- "existing_node_name": if using existing or generalizing, the name of the existing node
- "reason": brief explanation

Guidelines:
- "use_existing": The concept is semantically equivalent to an existing node
- "create_new": The concept is distinct enough to warrant a new node
- "create_and_generalize": The concept is domain-specific but has a more general equivalent
  (e.g., "Chess Tactics" generalizes to "Tactics")

IMPORTANT: Only respond with valid JSON, no other text."#
    );

    let user_prompt = format!(
        r#"Domain: {}
{} concept: "{}"

Similar existing nodes:
{}

Should this concept reuse an existing node, be created as new, or generalize to an existing node?"#,
        domain_name, node_label, concept_name, similar_list
    );

    let config = GenerationConfig {
        max_tokens: 512,
        temperature: 0.3,
    };

    let response = llm.generate(&system_prompt, &user_prompt, &config).await?;

    // Parse JSON response
    let json_str = extract_json(&response);

    serde_json::from_str(json_str).map_err(|e| {
        ProcessingError::InvalidData(format!(
            "Failed to parse LLM verification response: {}. Response was: {}",
            e, response
        ))
    })
}

/// Determine which level to assign a node to
pub fn determine_level(
    suggested_level: Option<u8>,
    _node_name: &str,
    _domain_levels: &[crate::messages::DomainLevelInfo],
) -> u8 {
    // Use suggested level if provided, otherwise default to middle (level 3)
    suggested_level.unwrap_or(3).clamp(1, 5)
}

// =============================================================================
// SHARED NEO4J OPERATIONS
// =============================================================================

/// Result of creating a node
#[derive(Debug, Clone)]
pub struct CreatedNode {
    pub element_id: String,
    pub name: String,
}

/// Create a relationship from a Domain_Level to a component node
pub async fn create_level_requirement(
    graph: &Graph,
    level_element_id: &str,
    node_element_id: &str,
    relationship_type: &str,
) -> Result<(), ProcessingError> {
    let query_str = format!(
        r#"
        MATCH (level) WHERE elementId(level) = $level_id
        MATCH (node) WHERE elementId(node) = $node_id
        CREATE (level)-[:{}]->(node)
        "#,
        relationship_type
    );

    let query = Query::new(query_str)
        .param("level_id", level_element_id)
        .param("node_id", node_element_id);

    graph
        .run(query)
        .await
        .map_err(|e| ProcessingError::Neo4j(e.to_string()))?;

    Ok(())
}

/// Create a GENERALIZES_TO relationship between nodes
pub async fn create_generalization(
    graph: &Graph,
    source_element_id: &str,
    target_element_id: &str,
) -> Result<(), ProcessingError> {
    let query = Query::new(
        r#"
        MATCH (source) WHERE elementId(source) = $source_id
        MATCH (target) WHERE elementId(target) = $target_id
        CREATE (source)-[:GENERALIZES_TO]->(target)
        "#
        .to_string(),
    )
    .param("source_id", source_element_id)
    .param("target_id", target_element_id);

    graph
        .run(query)
        .await
        .map_err(|e| ProcessingError::Neo4j(e.to_string()))?;

    Ok(())
}

/// Extract JSON from a response that might have markdown code blocks
pub fn extract_json(response: &str) -> &str {
    let trimmed = response.trim();
    if trimmed.starts_with("```json") {
        trimmed
            .trim_start_matches("```json")
            .trim_end_matches("```")
            .trim()
    } else if trimmed.starts_with("```") {
        trimmed
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim()
    } else {
        trimmed
    }
}
