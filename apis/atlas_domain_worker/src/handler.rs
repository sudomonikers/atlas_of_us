use aws_lambda_events::event::sqs::SqsEvent;
use lambda_runtime::{Error, LambdaEvent};
use neo4rs::Graph;

use crate::config::Config;
use crate::messages::{NodeGenerationJob, NodeGenerationResult, NodeType};
use crate::processors::{
    KnowledgeProcessor, MilestoneProcessor, NodeProcessor, SkillProcessor, TraitProcessor,
};
use crate::services::LlmService;

/// Handle an SQS event containing node generation jobs
pub async fn handle_sqs_event(
    event: LambdaEvent<SqsEvent>,
    config: &Config,
) -> Result<(), Error> {
    let records = event.payload.records;

    if records.is_empty() {
        tracing::info!("No records to process");
        return Ok(());
    }

    tracing::info!("Processing {} SQS records", records.len());

    // Initialize services
    let graph = create_graph_connection(config).await?;

    // LLM service (requires API key)
    let llm_service = config
        .anthropic_api_key
        .as_ref()
        .map(|key| LlmService::new(key.clone()));

    // Process each record
    for record in records {
        let body = match &record.body {
            Some(body) => body,
            None => {
                tracing::warn!("Empty message body, skipping");
                continue;
            }
        };

        let job: NodeGenerationJob = match serde_json::from_str(body) {
            Ok(job) => job,
            Err(e) => {
                tracing::error!("Failed to parse job message: {}", e);
                // Don't retry malformed messages - let them go to DLQ
                continue;
            }
        };

        tracing::info!(
            job_id = %job.job_id,
            generation_id = %job.generation_id,
            node_type = ?job.node_type,
            node_name = %job.node_name,
            "Processing node generation job"
        );

        let result = process_job(&job, &graph, llm_service.as_ref()).await;

        match result {
            Ok(gen_result) => {
                tracing::info!(
                    job_id = %job.job_id,
                    element_id = ?gen_result.element_id,
                    was_reused = gen_result.was_reused,
                    assigned_level = ?gen_result.assigned_level,
                    "Node generation completed successfully"
                );
            }
            Err(e) => {
                tracing::error!(
                    job_id = %job.job_id,
                    error = %e,
                    "Node generation failed"
                );

                // Check if error is retryable
                if is_retryable_error(&e) {
                    // Return error to trigger SQS retry
                    return Err(format!("Retryable error: {}", e).into());
                }
                // Non-retryable errors are logged but don't fail the Lambda
                // The message will eventually go to DLQ after max retries
            }
        }
    }

    Ok(())
}

/// Process a single node generation job
async fn process_job(
    job: &NodeGenerationJob,
    graph: &Graph,
    llm_service: Option<&LlmService>,
) -> Result<NodeGenerationResult, ProcessingError> {
    // Require LLM service for property generation
    let llm = llm_service.ok_or_else(|| {
        ProcessingError::Configuration(
            "LLM service not configured (missing ANTHROPIC_API_KEY)".to_string(),
        )
    })?;

    match job.node_type {
        NodeType::Knowledge => {
            let processor = KnowledgeProcessor::new(llm);
            processor.process(job, graph).await
        }
        NodeType::Skill => {
            let processor = SkillProcessor::new(llm);
            processor.process(job, graph).await
        }
        NodeType::Trait => {
            let processor = TraitProcessor::new(llm);
            processor.process(job, graph).await
        }
        NodeType::Milestone => {
            let processor = MilestoneProcessor::new(llm);
            processor.process(job, graph).await
        }
    }
}

/// Create a Neo4j graph connection
async fn create_graph_connection(config: &Config) -> Result<Graph, Error> {
    let graph = Graph::new(
        &config.neo4j_uri,
        &config.neo4j_user,
        &config.neo4j_password,
    )
    .map_err(|e| format!("Failed to connect to Neo4j: {}", e))?;

    tracing::info!("Connected to Neo4j");
    Ok(graph)
}

/// Check if an error is retryable
fn is_retryable_error(error: &ProcessingError) -> bool {
    matches!(
        error,
        ProcessingError::Neo4j(_) | ProcessingError::Embedding(_) | ProcessingError::Llm(_)
    )
}

#[derive(Debug, thiserror::Error)]
pub enum ProcessingError {
    #[error("Neo4j error: {0}")]
    Neo4j(String),
    #[error("Embedding error: {0}")]
    Embedding(String),
    #[error("LLM error: {0}")]
    Llm(String),
    #[error("Similarity error: {0}")]
    Similarity(String),
    #[error("Configuration error: {0}")]
    Configuration(String),
    #[error("Invalid data: {0}")]
    InvalidData(String),
}

impl From<crate::services::EmbeddingError> for ProcessingError {
    fn from(e: crate::services::EmbeddingError) -> Self {
        ProcessingError::Embedding(e.to_string())
    }
}

impl From<crate::services::LlmError> for ProcessingError {
    fn from(e: crate::services::LlmError) -> Self {
        ProcessingError::Llm(e.to_string())
    }
}

impl From<crate::services::SimilarityError> for ProcessingError {
    fn from(e: crate::services::SimilarityError) -> Self {
        ProcessingError::Similarity(e.to_string())
    }
}
