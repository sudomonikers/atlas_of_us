use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use neo4rs::{Graph, Query};
use serde_json::{json, Value};
use crate::common::neo4j_utils::map_bolt4_to_bolt5;

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
            {
                id: id(node),
                elementId: elementId(node), 
                labels: labels(node),
                props: properties(node)
            } AS nodeWithMeta,
            collect(distinct case when unwound_relationships is not null then {
                id: id(unwound_relationships),
                elementId: elementId(unwound_relationships),
                startId: id(startNode(unwound_relationships)),
                startElementId: elementId(startNode(unwound_relationships)),
                endId: id(endNode(unwound_relationships)),
                endElementId: elementId(endNode(unwound_relationships)),
                type: type(unwound_relationships),
                props: properties(unwound_relationships)
            } else null end) AS relationshipsWithMeta,
            collect(distinct case when unwound_affiliates is not null then {
                id: id(unwound_affiliates),
                elementId: elementId(unwound_affiliates),
                labels: labels(unwound_affiliates),
                props: properties(unwound_affiliates)
            } else null end) AS affiliatedNodesWithMeta
        RETURN 
            nodeWithMeta AS node,
            relationshipsWithMeta AS relationships,
            affiliatedNodesWithMeta AS affiliatedNodes
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

            // Map to Bolt5 format
            let bolt5_data = map_bolt4_to_bolt5(profile_data);
            Ok(Json(bolt5_data))
        }
        Err(e) => {
            tracing::error!("ERROR AT get_user_profile: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}