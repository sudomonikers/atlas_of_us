use neo4rs::{Graph, Query};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::embedding::generate_embedding;

#[derive(Debug, Serialize, Deserialize)]
pub struct FindSimilarNodesRequest {
    pub node_id: Option<String>,
    pub embedding: Option<Vec<f64>>,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarNodeResult {
    pub name: String,
    pub description: Option<String>,
    pub id: String,
    pub score: f64,
}

pub async fn find_similar_nodes(
    graph: &Graph,
    request: FindSimilarNodesRequest,
) -> Result<Vec<SimilarNodeResult>, Box<dyn std::error::Error>> {
    let limit = request.limit.unwrap_or(5);

    let (query_str, params) = if let Some(node_id) = request.node_id {
        // Search using a reference node ID
        let query = "
            MATCH (n) 
            WHERE elementId(n) = $nodeId
            CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, n.embedding)
            YIELD node, score
            WHERE elementId(node) <> $nodeId
            RETURN node.name as name, node.description as description, elementId(node) as id, score
            ORDER BY score DESC
        ";

        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("nodeId".to_string(), node_id.into());
        params.insert("limit".to_string(), limit.into());
        (query, params)
    } else if let Some(embedding) = request.embedding {
        // Search using an embedding vector
        let query = "
            CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, $embedding)
            YIELD node, score
            RETURN node.name as name, node.description as description, elementId(node) as id, score
            ORDER BY score DESC
        ";

        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("embedding".to_string(), embedding.into());
        params.insert("limit".to_string(), limit.into());
        (query, params)
    } else {
        return Err("Either node_id or embedding must be provided"
            .to_string()
            .into());
    };

    let mut query = Query::new(String::from(query_str));
    for (key, value) in params {
        query = query.param(&key, value);
    }
    let mut result = graph.execute(query).await?;
    let mut similar_nodes = Vec::new();

    while let Some(row) = result.next().await? {
        let name: String = row.get("name").unwrap_or_default();
        let description: Option<String> = row.get("description").ok();
        let id: String = row.get("id").unwrap_or_default();
        let score: f64 = row.get("score").unwrap_or(0.0);

        similar_nodes.push(SimilarNodeResult {
            name,
            description,
            id,
            score,
        });
    }

    Ok(similar_nodes)
}

/// Find similar nodes by text - generates embedding from text then searches
/// Optionally filter by node label (e.g., "Knowledge", "Skill", "Trait", "Milestone")
pub async fn find_similar_by_text(
    graph: &Graph,
    text: &str,
    label: Option<&str>,
    limit: i32,
) -> Result<Vec<SimilarNodeResult>, Box<dyn std::error::Error>> {
    // Generate embedding for the search text
    let embedding = generate_embedding(text).await?;

    // If label is provided, use a label-filtered query
    if let Some(node_label) = label {
        let query_str = format!(
            r#"
            CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, $embedding)
            YIELD node, score
            WHERE node:{}
            RETURN node.name as name, node.description as description, elementId(node) as id, score
            ORDER BY score DESC
            "#,
            node_label
        );

        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("embedding".to_string(), embedding.into());
        params.insert("limit".to_string(), limit.into());

        let mut query = Query::new(query_str);
        for (key, value) in params {
            query = query.param(&key, value);
        }

        let mut result = graph.execute(query).await?;
        let mut similar_nodes = Vec::new();

        while let Some(row) = result.next().await? {
            let name: String = row.get("name").unwrap_or_default();
            let description: Option<String> = row.get("description").ok();
            let id: String = row.get("id").unwrap_or_default();
            let score: f64 = row.get("score").unwrap_or(0.0);

            similar_nodes.push(SimilarNodeResult {
                name,
                description,
                id,
                score,
            });
        }

        Ok(similar_nodes)
    } else {
        // No label filter, use the standard function
        let request = FindSimilarNodesRequest {
            node_id: None,
            embedding: Some(embedding),
            limit: Some(limit),
        };
        find_similar_nodes(graph, request).await
    }
}
