//! Profile domain models and error types.

use serde::Serialize;
use serde_json::Value;

/// Profile service error types
#[derive(Debug)]
pub enum ServiceError {
    DatabaseError(String),
    NotFound(String),
}

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            ServiceError::NotFound(msg) => write!(f, "Not found: {}", msg),
        }
    }
}

impl std::error::Error for ServiceError {}

/// User profile response containing node, relationships, and affiliated nodes
#[derive(Debug, Serialize)]
pub struct UserProfile {
    pub node: ProfileNode,
    pub relationships: Vec<ProfileRelationship>,
    #[serde(rename = "affiliatedNodes")]
    pub affiliated_nodes: Vec<AffiliatedNode>,
}

/// Core profile node data
#[derive(Debug, Serialize)]
pub struct ProfileNode {
    #[serde(rename = "elementId")]
    pub element_id: String,
    pub username: String,
    pub labels: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    /// Additional properties from the node
    #[serde(flatten)]
    pub properties: Value,
}

/// Relationship from profile to affiliated node
#[derive(Debug, Serialize)]
pub struct ProfileRelationship {
    #[serde(rename = "elementId")]
    pub element_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
    #[serde(rename = "startElementId")]
    pub start_element_id: String,
    #[serde(rename = "endElementId")]
    pub end_element_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub properties: Option<Value>,
}

/// Node affiliated with the user profile
#[derive(Debug, Serialize)]
pub struct AffiliatedNode {
    #[serde(rename = "elementId")]
    pub element_id: String,
    pub labels: Vec<String>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "generalizesToElementId")]
    pub generalizes_to_element_id: Option<String>,
    /// Additional properties from the node
    #[serde(flatten)]
    pub properties: Value,
}
