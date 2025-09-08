use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use neo4rs::{Graph, Query};
use serde_json::{json, Value};

pub async fn get_user_profile(
    Path(username): Path<String>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let query_string = "
        MATCH (node:Person)
        WHERE node.username = $username
        OPTIONAL MATCH (node)-[r]->(m)
        UNWIND coalesce(r, [null]) AS unwound_relationships
        UNWIND coalesce(m, [null]) AS unwound_affiliates
        WITH 
            node,
            collect(distinct unwound_relationships) AS relationships, 
            collect(distinct unwound_affiliates) AS affiliatedNodes
        RETURN 
            node,
            relationships,
            affiliatedNodes
    ";

    let mut query = Query::new(query_string.to_string());
    query = query.param("username", username.clone());

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut profile_data = Vec::new();
            
            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                let relationships: Value = row.get("relationships").unwrap_or(json!([]));
                let affiliated_nodes: Value = row.get("affiliatedNodes").unwrap_or(json!([]));
                
                profile_data.push(json!({
                    "node": node,
                    "relationships": relationships,
                    "affiliatedNodes": affiliated_nodes
                }));
            }

            Ok(Json(json!(profile_data)))
        }
        Err(e) => {
            tracing::error!("ERROR AT get_user_profile: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}