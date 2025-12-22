use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

// ========== Error Types ==========

#[derive(Debug)]
pub enum ServiceError {
    DatabaseError(String),
    EmbeddingFailed(String),
    SimilarNodeExists { score: f64, details: String },
    NotFound(String),
    ValidationError(String),
}

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            ServiceError::EmbeddingFailed(msg) => write!(f, "Embedding failed: {}", msg),
            ServiceError::SimilarNodeExists { score, details } => {
                write!(f, "Similar node exists (score: {}): {}", score, details)
            }
            ServiceError::NotFound(msg) => write!(f, "Not found: {}", msg),
            ServiceError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for ServiceError {}

// ========== Query Parameter Types ==========

#[derive(Debug, Deserialize)]
pub struct NodeQueryParams {
    pub labels: Option<String>,
    pub properties: Option<String>,
    pub depth: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct GetNodeWithRelationshipsBySearchTermParams {
    #[serde(rename = "searchTerm")]
    pub search_term: String,
    pub depth: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct GetDomainParams {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchNodesParams {
    pub query: String,
    pub labels: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ValidateDomainNameParams {
    pub name: String,
}

// ========== Node Request/Response Types ==========

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CreateNodeRequest {
    pub labels: Vec<String>,
    pub properties: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CreateNodeResult {
    pub element_id: String,
    pub name: String,
    pub labels: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateNodeRequest {
    #[serde(rename = "targetId")]
    pub target_id: String,
    pub labels: Option<Vec<String>>,
    pub properties: Option<HashMap<String, Value>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NodeData {
    pub element_id: String,
    pub labels: Vec<String>,
    pub properties: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize)]
pub struct NodeWithRelationships {
    pub node: Value,
    pub relationships: Value,
    pub affiliated_nodes: Value,
}

// ========== Relationship Request/Response Types ==========

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CreateRelationshipRequest {
    #[serde(rename = "sourceId")]
    pub source_id: String,
    #[serde(rename = "targetId")]
    pub target_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
    pub properties: Option<HashMap<String, Value>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CreateRelationshipResult {
    pub element_id: String,
    pub relationship_type: String,
    pub source_id: String,
    pub target_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateRelationshipRequest {
    #[serde(rename = "targetId")]
    pub target_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
    pub properties: Option<HashMap<String, Value>>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteRelationshipRequest {
    #[serde(rename = "relationshipElementId")]
    pub relationship_element_id: String,
}

// ========== Domain Request/Response Types ==========

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct NewNodeData {
    pub name: String,
    pub description: String,
    pub how_to_learn: Option<String>,
    pub how_to_develop: Option<String>,
    pub measurement_criteria: Option<String>,
    pub how_to_achieve: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct KnowledgeRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub bloom_level: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SkillRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub dreyfus_level: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TraitRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub min_score: i64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MilestoneRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LevelRequirements {
    pub knowledge: Vec<KnowledgeRequirement>,
    pub skills: Vec<SkillRequirement>,
    pub traits: Vec<TraitRequirement>,
    pub milestones: Vec<MilestoneRequirement>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DomainLevel {
    pub level: i64,
    pub name: String,
    pub description: Option<String>,
    pub points_required: i64,
    pub requirements: LevelRequirements,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DomainInfo {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateDomainRequest {
    pub domain: DomainInfo,
    pub levels: Vec<DomainLevel>,
}

#[derive(Debug, Serialize)]
pub struct CreatedNodeInfo {
    #[serde(rename = "elementId")]
    pub element_id: String,
    pub name: String,
    pub labels: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateDomainResult {
    pub success: bool,
    pub domain_element_id: String,
    pub domain_name: String,
    pub created_nodes: Vec<CreatedNodeInfo>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateDomainRequest {
    #[serde(rename = "domainElementId")]
    pub domain_element_id: String,
    pub domain: DomainInfo,
    pub levels: Vec<DomainLevel>,
    #[serde(rename = "removedNodeElementIds")]
    pub removed_node_element_ids: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdateDomainResult {
    pub success: bool,
    pub domain_element_id: String,
    pub domain_name: String,
    pub created_nodes: Vec<CreatedNodeInfo>,
    pub affected_user_progress_count: i64,
}

#[derive(Debug, Serialize)]
pub struct DomainNameValidation {
    pub available: bool,
    pub existing_domain_element_id: Option<String>,
}
