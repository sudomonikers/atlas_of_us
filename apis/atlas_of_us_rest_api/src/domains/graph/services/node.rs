use neo4rs::{Graph, Query as Neo4jQuery};
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::common::{
    embedding::generate_embedding,
    neo4j_utils::{json_value_to_bolt_type, map_bolt4_to_bolt5},
    similarity::{find_similar_nodes as similarity_find_similar_nodes, FindSimilarNodesRequest},
};

use crate::domains::graph::models::{
    CreateNodeRequest, CreateNodeResult, NodeWithRelationships, ServiceError,
};

/// Returns the Cypher fragment for collecting node metadata with relationships
pub fn node_with_relationships_query_fragment(depth: i32) -> String {
    format!(
        r#"
        OPTIONAL MATCH (node)-[r*1..{}]->(m)
        UNWIND coalesce(r, [null]) AS unwound_relationships
        UNWIND coalesce(m, [null]) AS unwound_affiliates
        WITH
            {{
                id: id(node),
                elementId: elementId(node),
                labels: labels(node),
                props: properties(node)
            }} AS nodeWithMeta,
            collect(distinct case when unwound_relationships is not null then {{
                id: id(unwound_relationships),
                elementId: elementId(unwound_relationships),
                startId: id(startNode(unwound_relationships)),
                startElementId: elementId(startNode(unwound_relationships)),
                endId: id(endNode(unwound_relationships)),
                endElementId: elementId(endNode(unwound_relationships)),
                type: type(unwound_relationships),
                props: properties(unwound_relationships)
            }} else null end) AS relationshipsWithMeta,
            collect(distinct case when unwound_affiliates is not null then {{
                id: id(unwound_affiliates),
                elementId: elementId(unwound_affiliates),
                labels: labels(unwound_affiliates),
                props: properties(unwound_affiliates)
            }} else null end) AS affiliatedNodesWithMeta
        RETURN
            nodeWithMeta AS node,
            relationshipsWithMeta AS relationships,
            affiliatedNodesWithMeta AS affiliatedNodes
        "#,
        depth
    )
}

/// Create a node with optional similarity check
/// When `check_similarity` is true, returns error if a similar node exists (score > 0.7)
pub async fn create_node(
    graph: &Graph,
    request: CreateNodeRequest,
    check_similarity: bool,
) -> Result<CreateNodeResult, ServiceError> {
    // Generate embedding from name + description
    let name = request
        .properties
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let description = request
        .properties
        .get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let text_to_embed = format!("{}: {}", name, description);

    let embedding = generate_embedding(&text_to_embed)
        .await
        .map_err(|e| ServiceError::EmbeddingFailed(e.to_string()))?;

    // Check for similar nodes if requested
    if check_similarity {
        let similarity_request = FindSimilarNodesRequest {
            node_id: None,
            embedding: Some(embedding.clone()),
            text: None,
            label: None,
            limit: Some(1),
        };

        match similarity_find_similar_nodes(graph, similarity_request).await {
            Ok(similar_nodes) => {
                if !similar_nodes.is_empty() && similar_nodes[0].score > 0.7 {
                    return Err(ServiceError::SimilarNodeExists {
                        score: similar_nodes[0].score,
                        details: format!(
                            "A node with a similarity score of {} already exists.",
                            similar_nodes[0].score
                        ),
                    });
                }
            }
            Err(e) => {
                tracing::error!("Failed to find similar nodes: {}", e);
                return Err(ServiceError::DatabaseError(format!(
                    "Failed to find similar nodes: {}",
                    e
                )));
            }
        }
    }

    // Add embedding to properties
    let mut final_properties = request.properties.clone();
    final_properties.insert("embedding".to_string(), json!(embedding));

    // Build labels string and SET clauses
    let label_string = format!(":{}", request.labels.join(":"));
    let set_clauses: Vec<String> = final_properties
        .keys()
        .map(|key| format!("n.{} = ${}", key, key))
        .collect();

    let query_string = format!(
        "CREATE (n{}) SET {} RETURN elementId(n) AS elementId, n.name AS name",
        label_string,
        set_clauses.join(", ")
    );

    let mut query = Neo4jQuery::new(query_string);
    for (key, value) in final_properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();
                let node_name: String = row.get("name").unwrap_or_default();

                Ok(CreateNodeResult {
                    element_id,
                    name: node_name,
                    labels: request.labels,
                })
            } else {
                Err(ServiceError::DatabaseError(
                    "Failed to get element ID after node creation".to_string(),
                ))
            }
        }
        Err(e) => {
            tracing::error!("Error creating node: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Find a node by name and optional label - returns element ID if found
pub async fn find_node_by_name(
    graph: &Graph,
    name: &str,
    label: Option<&str>,
) -> Result<Option<String>, ServiceError> {
    let query_string = if let Some(lbl) = label {
        format!(
            "MATCH (n:{} {{name: $name}}) RETURN elementId(n) AS elementId LIMIT 1",
            lbl
        )
    } else {
        "MATCH (n {name: $name}) RETURN elementId(n) AS elementId LIMIT 1".to_string()
    };

    let query = Neo4jQuery::new(query_string).param("name", name);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();
                Ok(Some(element_id))
            } else {
                Ok(None)
            }
        }
        Err(e) => Err(ServiceError::DatabaseError(format!("Database error: {}", e))),
    }
}

/// Get nodes with optional filters (labels, properties) and related nodes up to depth
pub async fn get_nodes_with_relationships(
    graph: &Graph,
    labels: Option<Vec<&str>>,
    properties: Option<HashMap<String, Value>>,
    depth: i32,
) -> Result<Vec<NodeWithRelationships>, ServiceError> {
    let mut match_clauses = Vec::new();

    // Handle labels
    if let Some(labels_vec) = labels {
        for label in labels_vec {
            match_clauses.push(format!("MATCH (node:`{}`)", label));
        }
    } else {
        match_clauses.push("MATCH (node)".to_string());
    }

    // Handle properties
    let mut where_clauses = Vec::new();
    let props = properties.unwrap_or_default();
    for (key, value) in &props {
        let key = key.trim();
        if let Some(value_str) = value.as_str() {
            let value_str = value_str.trim();
            if key == "elementId" {
                where_clauses.push(format!("elementId(node) = '{}'", value_str));
            } else {
                where_clauses.push(format!("node.{} = '{}'", key, value_str));
            }
        }
    }

    let mut query_string = match_clauses.join("\n");

    if !where_clauses.is_empty() {
        query_string += &format!("\nWHERE {}", where_clauses.join(" AND "));
    }

    query_string += &node_with_relationships_query_fragment(depth);

    let query = Neo4jQuery::new(query_string);
    match graph.execute(query).await {
        Ok(mut result) => {
            let mut nodes_data = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                let relationships: Value = row.get("relationships").unwrap_or(json!([]));
                let affiliated_nodes: Value = row.get("affiliatedNodes").unwrap_or(json!([]));

                nodes_data.push(json!({
                    "node": node,
                    "relationships": relationships,
                    "affiliatedNodes": affiliated_nodes
                }));
            }

            // Map to Bolt5 format
            let bolt5_data = map_bolt4_to_bolt5(nodes_data);

            // Convert back to NodeWithRelationships
            let result = if let Value::Array(arr) = bolt5_data {
                arr.into_iter()
                    .map(|v| NodeWithRelationships {
                        node: v.get("node").cloned().unwrap_or(json!({})),
                        relationships: v.get("relationships").cloned().unwrap_or(json!([])),
                        affiliated_nodes: v.get("affiliatedNodes").cloned().unwrap_or(json!([])),
                    })
                    .collect()
            } else {
                Vec::new()
            };

            Ok(result)
        }
        Err(e) => {
            tracing::error!("Error in get_nodes_with_relationships: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Get nodes by embedding-based vector search
pub async fn get_nodes_by_search_term(
    graph: &Graph,
    search_term: &str,
    depth: i32,
) -> Result<Vec<NodeWithRelationships>, ServiceError> {
    // Generate embedding for search term
    let embedding = generate_embedding(search_term)
        .await
        .map_err(|e| ServiceError::EmbeddingFailed(e.to_string()))?;

    let query_string = format!(
        r#"
        CALL db.index.vector.queryNodes('nodeEmbeddings', 1, $embedding)
        YIELD node, score
        {}
        "#,
        node_with_relationships_query_fragment(depth)
    );

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("embedding", embedding);

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut nodes_data = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                let relationships: Value = row.get("relationships").unwrap_or(json!([]));
                let affiliated_nodes: Value = row.get("affiliatedNodes").unwrap_or(json!([]));

                nodes_data.push(json!({
                    "node": node,
                    "relationships": relationships,
                    "affiliatedNodes": affiliated_nodes
                }));
            }

            let bolt5_data = map_bolt4_to_bolt5(nodes_data);

            let result = if let Value::Array(arr) = bolt5_data {
                arr.into_iter()
                    .map(|v| NodeWithRelationships {
                        node: v.get("node").cloned().unwrap_or(json!({})),
                        relationships: v.get("relationships").cloned().unwrap_or(json!([])),
                        affiliated_nodes: v.get("affiliatedNodes").cloned().unwrap_or(json!([])),
                    })
                    .collect()
            } else {
                Vec::new()
            };

            Ok(result)
        }
        Err(e) => {
            tracing::error!("Error in get_nodes_by_search_term: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Update a node's labels and/or properties
pub async fn update_node(
    graph: &Graph,
    target_id: &str,
    labels: Option<Vec<String>>,
    properties: Option<HashMap<String, Value>>,
) -> Result<Vec<Value>, ServiceError> {
    if labels.is_none() && properties.is_none() {
        return Err(ServiceError::ValidationError(
            "At least one of 'labels' or 'properties' must be provided".to_string(),
        ));
    }

    let mut query_parts = vec![
        "MATCH (n)".to_string(),
        "WHERE elementId(n) = $targetId".to_string(),
    ];

    // Handle labels if provided
    if let Some(labels_vec) = &labels {
        query_parts.push("REMOVE n:_".to_string());
        for label in labels_vec {
            query_parts.push(format!("SET n:`{}`", label));
        }
    }

    // Handle properties if provided
    let props = properties.clone().unwrap_or_default();
    if !props.is_empty() {
        let set_clauses: Vec<String> = props
            .keys()
            .map(|key| format!("n.{} = ${}", key, key))
            .collect();
        query_parts.push(format!("SET {}", set_clauses.join(", ")));
    }

    query_parts.push("RETURN n".to_string());
    let query_string = query_parts.join("\n");

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("targetId", target_id);

    for (key, value) in props {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut updated_nodes = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("n").unwrap_or(json!({}));
                updated_nodes.push(node);
            }

            Ok(updated_nodes)
        }
        Err(e) => {
            tracing::error!("Error updating node: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}
