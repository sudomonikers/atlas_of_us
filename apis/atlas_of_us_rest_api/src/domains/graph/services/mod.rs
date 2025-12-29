//! Graph service operations split into logical modules.
//!
//! This module provides all graph-related database operations:
//! - `node`: Node creation, lookup, and updates
//! - `relationship`: Relationship CRUD operations
//! - `search`: Text and similarity-based search
//! - `domain`: Domain management (levels, requirements)

pub mod domain;
pub mod node;
pub mod relationship;
pub mod search;

// Re-export all public functions for backward compatibility
// This allows existing code to continue using `services::function_name()`
pub use domain::{create_domain, get_domain, update_domain, validate_domain_name};
pub use node::{
    create_node, find_node_by_name, get_nodes_by_search_term, get_nodes_with_relationships,
    node_with_relationships_query_fragment, update_node,
};
pub use relationship::{create_relationship, delete_relationship, update_relationship};
pub use search::{find_similar_nodes, search_nodes};
