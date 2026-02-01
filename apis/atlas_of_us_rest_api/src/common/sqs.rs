use aws_config::BehaviorVersion;
use aws_sdk_sqs::Client;
use serde::{Deserialize, Serialize};
use std::env;

/// Job message for async image generation
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageGenJob {
    pub domain_name: String,
    pub element_id: String,
    pub prompt: String,
    pub s3_key: String,
    pub created_at: String,
}

impl ImageGenJob {
    /// Create a new image generation job for a domain
    pub fn new(domain_name: String, element_id: String, prompt: String, s3_key: String) -> Self {
        Self {
            domain_name,
            element_id,
            prompt,
            s3_key,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs().to_string())
                .unwrap_or_else(|_| "0".to_string()),
        }
    }
}

/// Queue an image generation job to SQS
///
/// Returns Ok(()) if the message was sent successfully, or an error if:
/// - IMAGE_GEN_QUEUE_URL environment variable is not set
/// - Failed to send the message to SQS
pub async fn queue_image_generation(job: ImageGenJob) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let queue_url = env::var("IMAGE_GEN_QUEUE_URL")
        .map_err(|_| "IMAGE_GEN_QUEUE_URL environment variable not set")?;

    let region = env::var("AWS_REGION").unwrap_or_else(|_| "us-east-2".to_string());
    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(aws_config::Region::new(region))
        .load()
        .await;

    let client = Client::new(&config);

    let message_body = serde_json::to_string(&job)
        .map_err(|e| format!("Failed to serialize job: {}", e))?;

    tracing::info!(
        domain = %job.domain_name,
        element_id = %job.element_id,
        "Queueing image generation job"
    );

    client
        .send_message()
        .queue_url(&queue_url)
        .message_body(&message_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send message to SQS: {:?}", e))?;

    tracing::info!(
        domain = %job.domain_name,
        "Image generation job queued successfully"
    );

    Ok(())
}

/// Check if image generation queue is configured
pub fn is_queue_configured() -> bool {
    env::var("IMAGE_GEN_QUEUE_URL").is_ok()
}

// =============================================================================
// DOMAIN NODE GENERATION QUEUE
// =============================================================================

/// The type of node being generated
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Knowledge,
    Skill,
    Trait,
    Milestone,
}

/// Information about a domain level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainLevelInfo {
    pub level: u8,
    pub name: String,
    pub element_id: String,
}

/// Job message for generating a single node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeGenerationJob {
    pub job_id: String,
    pub generation_id: String,
    pub sequence_number: u32,
    pub total_nodes: u32,
    pub node_type: NodeType,
    pub node_name: String,
    pub domain_name: String,
    pub domain_description: Option<String>,
    pub domain_element_id: String,
    pub domain_levels: Vec<DomainLevelInfo>,
    pub suggested_level: Option<u8>,
    pub created_at: String,
    pub retry_count: u32,
}

impl NodeGenerationJob {
    /// Create a new node generation job
    pub fn new(
        generation_id: String,
        sequence_number: u32,
        total_nodes: u32,
        node_type: NodeType,
        node_name: String,
        domain_name: String,
        domain_description: Option<String>,
        domain_element_id: String,
        domain_levels: Vec<DomainLevelInfo>,
        suggested_level: Option<u8>,
    ) -> Self {
        use std::time::{SystemTime, UNIX_EPOCH};

        // Generate a simple unique ID using timestamp + random suffix
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let job_id = format!("job-{}-{}", timestamp, sequence_number);

        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs().to_string())
            .unwrap_or_else(|_| "0".to_string());

        Self {
            job_id,
            generation_id,
            sequence_number,
            total_nodes,
            node_type,
            node_name,
            domain_name,
            domain_description,
            domain_element_id,
            domain_levels,
            suggested_level,
            created_at,
            retry_count: 0,
        }
    }
}

/// Queue a node generation job to SQS
pub async fn queue_node_generation(
    job: NodeGenerationJob,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let queue_url = env::var("DOMAIN_NODE_QUEUE_URL")
        .map_err(|_| "DOMAIN_NODE_QUEUE_URL environment variable not set")?;

    let region = env::var("AWS_REGION").unwrap_or_else(|_| "us-east-2".to_string());
    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(aws_config::Region::new(region))
        .load()
        .await;

    let client = Client::new(&config);

    let message_body =
        serde_json::to_string(&job).map_err(|e| format!("Failed to serialize job: {}", e))?;

    tracing::info!(
        job_id = %job.job_id,
        generation_id = %job.generation_id,
        node_type = ?job.node_type,
        node_name = %job.node_name,
        "Queueing node generation job"
    );

    client
        .send_message()
        .queue_url(&queue_url)
        .message_body(&message_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send message to SQS: {:?}", e))?;

    tracing::info!(
        job_id = %job.job_id,
        "Node generation job queued successfully"
    );

    Ok(())
}

/// Check if domain node queue is configured
pub fn is_node_queue_configured() -> bool {
    env::var("DOMAIN_NODE_QUEUE_URL").is_ok()
}
