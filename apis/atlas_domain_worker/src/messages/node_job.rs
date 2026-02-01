use serde::{Deserialize, Serialize};

/// The type of node being generated
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Knowledge,
    Skill,
    Trait,
    Milestone,
}

impl NodeType {
    /// Get the Neo4j label for this node type
    pub fn label(&self) -> &'static str {
        match self {
            NodeType::Knowledge => "Knowledge",
            NodeType::Skill => "Skill",
            NodeType::Trait => "Trait",
            NodeType::Milestone => "Milestone",
        }
    }

    /// Get the relationship type for connecting to a domain level
    pub fn level_relationship(&self) -> &'static str {
        match self {
            NodeType::Knowledge => "REQUIRES_KNOWLEDGE",
            NodeType::Skill => "REQUIRES_SKILL",
            NodeType::Trait => "REQUIRES_TRAIT",
            NodeType::Milestone => "REQUIRES_MILESTONE",
        }
    }
}

/// Information about a domain level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainLevelInfo {
    /// Level number (1-5)
    pub level: u8,
    /// Level name (e.g., "Novice", "Master")
    pub name: String,
    /// Neo4j element ID
    pub element_id: String,
}

/// Job message for generating a single node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeGenerationJob {
    /// Unique job ID
    pub job_id: String,
    /// Parent generation session ID (groups all nodes for a domain)
    pub generation_id: String,
    /// Order for progress tracking
    pub sequence_number: u32,
    /// Total nodes in this generation
    pub total_nodes: u32,

    /// Type of node to generate
    pub node_type: NodeType,
    /// Name of the node (from conceptualization)
    pub node_name: String,

    /// Domain name
    pub domain_name: String,
    /// Optional domain description
    pub domain_description: Option<String>,
    /// Neo4j element ID of the domain node
    pub domain_element_id: String,
    /// All 5 domain levels with their element IDs
    pub domain_levels: Vec<DomainLevelInfo>,

    /// Suggested level (1-5) from conceptualization
    pub suggested_level: Option<u8>,
    /// ISO 8601 timestamp when job was created
    pub created_at: String,
    /// Number of times this job has been retried
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
        Self {
            job_id: uuid::Uuid::new_v4().to_string(),
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
            created_at: chrono::Utc::now().to_rfc3339(),
            retry_count: 0,
        }
    }

    /// Get the domain level info for the suggested level
    pub fn get_suggested_level_info(&self) -> Option<&DomainLevelInfo> {
        self.suggested_level.and_then(|level| {
            self.domain_levels.iter().find(|l| l.level == level)
        })
    }
}

/// Result of processing a node generation job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeGenerationResult {
    /// The job that was processed
    pub job_id: String,
    /// The generated node's element ID (if created)
    pub element_id: Option<String>,
    /// Whether the node was reused from an existing node
    pub was_reused: bool,
    /// The element ID of the reused node (if was_reused is true)
    pub reused_node_id: Option<String>,
    /// The level the node was assigned to
    pub assigned_level: Option<u8>,
    /// Number of prerequisite relationships created
    pub prerequisites_created: u32,
    /// Error message if processing failed
    pub error: Option<String>,
}

impl NodeGenerationResult {
    pub fn success(
        job_id: String,
        element_id: String,
        was_reused: bool,
        assigned_level: Option<u8>,
        prerequisites_created: u32,
    ) -> Self {
        Self {
            job_id,
            element_id: Some(element_id.clone()),
            was_reused,
            reused_node_id: if was_reused { Some(element_id) } else { None },
            assigned_level,
            prerequisites_created,
            error: None,
        }
    }

    pub fn reused(job_id: String, existing_node_id: String, assigned_level: Option<u8>) -> Self {
        Self {
            job_id,
            element_id: Some(existing_node_id.clone()),
            was_reused: true,
            reused_node_id: Some(existing_node_id),
            assigned_level,
            prerequisites_created: 0,
            error: None,
        }
    }

    pub fn failure(job_id: String, error: String) -> Self {
        Self {
            job_id,
            element_id: None,
            was_reused: false,
            reused_node_id: None,
            assigned_level: None,
            prerequisites_created: 0,
            error: Some(error),
        }
    }
}
