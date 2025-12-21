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
        WITH node,
             collect(distinct r) AS rels,
             collect(distinct m) AS affiliates

        // First, process relationships
        UNWIND CASE WHEN size(rels) = 0 THEN [null] ELSE rels END AS rel
        WITH node, affiliates,
             collect(distinct case when rel is not null then {
                 id: id(rel),
                 elementId: elementId(rel),
                 startId: id(startNode(rel)),
                 startElementId: elementId(startNode(rel)),
                 endId: id(endNode(rel)),
                 endElementId: elementId(endNode(rel)),
                 type: type(rel),
                 props: properties(rel)
             } else null end) AS relationshipsWithMeta

        // Then, process affiliates with their GENERALIZES_TO
        UNWIND CASE WHEN size(affiliates) = 0 THEN [null] ELSE affiliates END AS affiliate
        OPTIONAL MATCH (affiliate)-[:GENERALIZES_TO]->(general)
        WITH node, relationshipsWithMeta,
             collect(distinct case when affiliate is not null then {
                 id: id(affiliate),
                 elementId: elementId(affiliate),
                 labels: labels(affiliate),
                 props: properties(affiliate),
                 generalizesToElementId: case when general is not null then elementId(general) else null end
             } else null end) AS affiliatedNodesWithMeta

        WITH
            {
                id: id(node),
                elementId: elementId(node),
                labels: labels(node),
                props: properties(node)
            } AS nodeWithMeta,
            relationshipsWithMeta,
            affiliatedNodesWithMeta
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