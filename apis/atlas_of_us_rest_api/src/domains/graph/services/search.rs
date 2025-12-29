use neo4rs::{Graph, Query as Neo4jQuery};
use serde_json::{json, Value};

use crate::common::similarity::{find_similar_nodes as similarity_find_similar_nodes, FindSimilarNodesRequest};

use crate::domains::graph::models::ServiceError;

/// Search nodes by text query with optional label filter
pub async fn search_nodes(
    graph: &Graph,
    query_text: &str,
    labels: Option<Vec<&str>>,
    limit: i64,
) -> Result<Vec<Value>, ServiceError> {
    // Build label filter
    let label_filter = if let Some(labels_vec) = labels {
        let label_conditions: Vec<String> =
            labels_vec.iter().map(|l| format!("n:`{}`", l)).collect();
        format!("({})", label_conditions.join(" OR "))
    } else {
        "(n:Knowledge OR n:Skill OR n:Trait OR n:Milestone)".to_string()
    };

    let query_string = format!(
        r#"
        MATCH (n)
        WHERE {} AND toLower(n.name) CONTAINS toLower($query)
        RETURN {{
            elementId: elementId(n),
            labels: labels(n),
            props: properties(n)
        }} AS node
        ORDER BY n.name
        LIMIT $limit
        "#,
        label_filter
    );

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("query", query_text);
    query = query.param("limit", limit);

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut nodes = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                nodes.push(node);
            }

            Ok(nodes)
        }
        Err(e) => {
            tracing::error!("Error in search_nodes: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Find similar nodes by nodeId or embedding
pub async fn find_similar_nodes(
    graph: &Graph,
    node_id: Option<String>,
    embedding: Option<Vec<f64>>,
    limit: Option<i32>,
) -> Result<Value, ServiceError> {
    let has_node_id = node_id.is_some();
    let has_embedding = embedding.is_some() && !embedding.as_ref().unwrap().is_empty();

    if (!has_node_id && !has_embedding) || (has_node_id && has_embedding) {
        return Err(ServiceError::ValidationError(
            "Exactly one of 'nodeId' or 'embedding' must be provided".to_string(),
        ));
    }

    let request = FindSimilarNodesRequest {
        node_id,
        embedding,
        text: None,
        label: None,
        limit,
    };

    match similarity_find_similar_nodes(graph, request).await {
        Ok(result) => Ok(json!(result)),
        Err(e) => {
            tracing::error!("Error finding similar nodes: {}", e);
            Err(ServiceError::DatabaseError(format!(
                "Error finding similar nodes: {}",
                e
            )))
        }
    }
}
