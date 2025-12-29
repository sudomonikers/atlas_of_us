use neo4rs::{Graph, Query};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::embedding::generate_embedding;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct FindSimilarNodesRequest {
    pub node_id: Option<String>,
    pub embedding: Option<Vec<f64>>,
    pub text: Option<String>,
    pub label: Option<String>,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarNodeResult {
    pub name: String,
    pub description: Option<String>,
    pub id: String,
    pub score: f64,
}

/// Find similar nodes using node_id, embedding, or text (in order of priority).
/// Optionally filter results by node label.
pub async fn find_similar_nodes(
    graph: &Graph,
    request: FindSimilarNodesRequest,
) -> Result<Vec<SimilarNodeResult>, Box<dyn std::error::Error>> {
    let limit = request.limit.unwrap_or(5);

    let (query_str, params) = if let Some(node_id) = request.node_id {
        // Search using a reference node ID
        let query = build_node_id_query(request.label.as_deref());
        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("nodeId".to_string(), node_id.into());
        params.insert("limit".to_string(), limit.into());
        (query, params)
    } else if let Some(embedding) = request.embedding {
        // Search using provided embedding vector
        let query = build_embedding_query(request.label.as_deref());
        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("embedding".to_string(), embedding.into());
        params.insert("limit".to_string(), limit.into());
        (query, params)
    } else if let Some(text) = request.text {
        // Generate embedding from text, then search
        let embedding = generate_embedding(&text).await?;
        let query = build_embedding_query(request.label.as_deref());
        let mut params: HashMap<String, neo4rs::BoltType> = HashMap::new();
        params.insert("embedding".to_string(), embedding.into());
        params.insert("limit".to_string(), limit.into());
        (query, params)
    } else {
        return Err("Either node_id, embedding, or text must be provided".into());
    };

    execute_similarity_query(graph, query_str, params).await
}

/// Build query for node ID-based similarity search
fn build_node_id_query(label: Option<&str>) -> String {
    let label_filter = label
        .map(|l| format!(" AND node:{}", l))
        .unwrap_or_default();

    format!(
        r#"
        MATCH (n)
        WHERE elementId(n) = $nodeId
        CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, n.embedding)
        YIELD node, score
        WHERE elementId(node) <> $nodeId{}
        RETURN node.name as name, node.description as description, elementId(node) as id, score
        ORDER BY score DESC
        "#,
        label_filter
    )
}

/// Build query for embedding-based similarity search
fn build_embedding_query(label: Option<&str>) -> String {
    let label_filter = label
        .map(|l| format!("WHERE node:{}\n            ", l))
        .unwrap_or_default();

    format!(
        r#"
        CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, $embedding)
        YIELD node, score
        {}RETURN node.name as name, node.description as description, elementId(node) as id, score
        ORDER BY score DESC
        "#,
        label_filter
    )
}

/// Execute similarity query and parse results
async fn execute_similarity_query(
    graph: &Graph,
    query_str: String,
    params: HashMap<String, neo4rs::BoltType>,
) -> Result<Vec<SimilarNodeResult>, Box<dyn std::error::Error>> {
    let mut query = Query::new(query_str);
    for (key, value) in params {
        query = query.param(&key, value);
    }

    let mut result = graph.execute(query).await?;
    let mut similar_nodes = Vec::new();

    while let Some(row) = result.next().await? {
        similar_nodes.push(
            SimilarNodeResult {
                name: row.get("name").unwrap_or_default(),
                description: row.get("description").ok(),
                id: row.get("id").unwrap_or_default(),
                score: row.get("score").unwrap_or(0.0),
            }
        );
    }

    Ok(similar_nodes)
}
