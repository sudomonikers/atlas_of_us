use neo4rs::{Graph, Query as Neo4jQuery};
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::common::neo4j_utils::json_value_to_bolt_type;

use crate::domains::graph::models::{
    CreateRelationshipRequest, CreateRelationshipResult, ServiceError,
};

/// Create a relationship between two nodes (uses MERGE for idempotency)
pub async fn create_relationship(
    graph: &Graph,
    request: CreateRelationshipRequest,
) -> Result<CreateRelationshipResult, ServiceError> {
    let properties = request.properties.clone().unwrap_or_default();
    let set_clauses: Vec<String> = properties
        .keys()
        .map(|key| format!("r.{} = ${}", key, key))
        .collect();

    let query_string = if set_clauses.is_empty() {
        format!(
            r#"
            MATCH (source), (target)
            WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
            MERGE (source)-[r:{}]->(target)
            RETURN elementId(r) AS elementId
            "#,
            request.relationship_type
        )
    } else {
        format!(
            r#"
            MATCH (source), (target)
            WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
            MERGE (source)-[r:{}]->(target)
            SET {}
            RETURN elementId(r) AS elementId
            "#,
            request.relationship_type,
            set_clauses.join(", ")
        )
    };

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("sourceId", request.source_id.clone());
    query = query.param("targetId", request.target_id.clone());

    for (key, value) in properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();

                Ok(CreateRelationshipResult {
                    element_id,
                    relationship_type: request.relationship_type,
                    source_id: request.source_id,
                    target_id: request.target_id,
                })
            } else {
                Err(ServiceError::DatabaseError(
                    "Failed to get element ID after relationship creation".to_string(),
                ))
            }
        }
        Err(e) => {
            tracing::error!("Error creating relationship: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Update a relationship's type and/or properties
pub async fn update_relationship(
    graph: &Graph,
    target_id: &str,
    relationship_type: &str,
    properties: Option<HashMap<String, Value>>,
) -> Result<Vec<Value>, ServiceError> {
    let props = properties.unwrap_or_default();
    let set_clauses: Vec<String> = props
        .keys()
        .map(|key| format!("r.{} = ${}", key, key))
        .collect();

    let query_string = if !relationship_type.is_empty() {
        // If type needs to be updated, create new relationship and delete old one
        if set_clauses.is_empty() {
            format!(
                r#"
                MATCH (source)-[r]->(target)
                WHERE elementId(r) = $targetId
                CREATE (source)-[newR:{}]->(target)
                DELETE r
                RETURN newR AS r
                "#,
                relationship_type
            )
        } else {
            format!(
                r#"
                MATCH (source)-[r]->(target)
                WHERE elementId(r) = $targetId
                CREATE (source)-[newR:{}]->(target)
                SET {}
                DELETE r
                RETURN newR AS r
                "#,
                relationship_type,
                set_clauses.join(", ").replace("r.", "newR.")
            )
        }
    } else {
        // Just update properties
        if set_clauses.is_empty() {
            r#"
            MATCH ()-[r]->()
            WHERE elementId(r) = $targetId
            RETURN r
            "#
            .to_string()
        } else {
            format!(
                r#"
                MATCH ()-[r]->()
                WHERE elementId(r) = $targetId
                SET {}
                RETURN r
                "#,
                set_clauses.join(", ")
            )
        }
    };

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("targetId", target_id);

    for (key, value) in props {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut relationships = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let relationship: Value = row.get("r").unwrap_or(json!({}));
                relationships.push(relationship);
            }

            Ok(relationships)
        }
        Err(e) => {
            tracing::error!("Error updating relationship: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Delete a relationship by element ID
pub async fn delete_relationship(graph: &Graph, element_id: &str) -> Result<i64, ServiceError> {
    let query_string = r#"
        MATCH ()-[r]->()
        WHERE elementId(r) = $relId
        DELETE r
        RETURN count(r) AS deleted
    "#;

    let mut query = Neo4jQuery::new(query_string.to_string());
    query = query.param("relId", element_id);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let deleted: i64 = row.get("deleted").unwrap_or(0);
                Ok(deleted)
            } else {
                Ok(0)
            }
        }
        Err(e) => {
            tracing::error!("Error deleting relationship: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}
