use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use neo4rs::{Graph, Query as Neo4jQuery};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::common::{
    embedding::generate_embedding, 
    image_generation::generate_image, 
    neo4j_utils::{json_value_to_bolt_type, map_bolt4_to_bolt5},
    s3::{upload_object_to_s3, UploadParams}, 
    similarity::{find_similar_nodes, FindSimilarNodesRequest}
};

#[derive(Debug, Deserialize)]
pub struct NodeQueryParams {
    pub labels: Option<String>,
    pub properties: Option<String>,
    pub depth: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct GetNodeWithRelationshipsBySearchTermParams {
    #[serde(rename = "searchTerm")]
    pub search_term: String,
    pub depth: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateNodeRequest {
    pub labels: Vec<String>,
    pub properties: HashMap<String, Value>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateRelationshipRequest {
    #[serde(rename = "sourceId")]
    pub source_id: String,
    #[serde(rename = "targetId")]
    pub target_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
    pub properties: Option<HashMap<String, Value>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateNodeRequest {
    #[serde(rename = "targetId")]
    pub target_id: String,
    pub labels: Option<Vec<String>>,
    pub properties: Option<HashMap<String, Value>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateRelationshipRequest {
    #[serde(rename = "targetId")]
    pub target_id: String,
    #[serde(rename = "type")]
    pub relationship_type: String,
    pub properties: Option<HashMap<String, Value>>,
}

pub async fn get_nodes(
    Query(params): Query<NodeQueryParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let depth = params.depth.unwrap_or(1);
    
    let mut match_clauses = Vec::new();

    // Handle labels
    if let Some(labels_str) = params.labels {
        let labels: Vec<&str> = labels_str.split(',').map(|s| s.trim()).collect();
        for label in labels {
            match_clauses.push(format!("MATCH (node:`{}`)", label));
        }
    } else {
        match_clauses.push("MATCH (node)".to_string());
    }

    // Handle properties
    let mut where_clauses = Vec::new();
    if let Some(properties_str) = params.properties {
        let properties: HashMap<String, Value> = match serde_json::from_str(&properties_str) {
            Ok(props) => props,
            Err(_) => {
                return Err(StatusCode::BAD_REQUEST);
            }
        };

        for (key, value) in properties {
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
    }

    let mut query_string = match_clauses.join("\n");
    
    if !where_clauses.is_empty() {
        query_string += &format!("\nWHERE {}", where_clauses.join(" AND "));
    }

    query_string += &format!(
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
    );

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
            Ok(Json(bolt5_data))
        }
        Err(e) => {
            tracing::error!("Error in get_nodes: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_node_with_relationships_by_search_term(
    Query(params): Query<GetNodeWithRelationshipsBySearchTermParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let depth = params.depth.unwrap_or(1);

    // Generate embedding for search term
    let embedding = match generate_embedding(&params.search_term).await {
        Ok(emb) => emb,
        Err(e) => {
            tracing::error!("Failed to generate embedding: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let query_string = format!(
        r#"
        CALL db.index.vector.queryNodes('nodeEmbeddings', 1, $embedding)
        YIELD node, score

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

            // Map to Bolt5 format
            let bolt5_data = map_bolt4_to_bolt5(nodes_data);
            Ok(Json(bolt5_data))
        }
        Err(e) => {
            tracing::error!("Error in get_node_with_relationships_by_search_term: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_node(
    State(graph): State<Graph>,
    Json(request): Json<CreateNodeRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Generate embedding
    let name = request.properties.get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let description = request.properties.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let text_to_embed = format!("{}: {}", name, description);
    
    let embedding = match generate_embedding(&text_to_embed).await {
        Ok(emb) => emb,
        Err(e) => {
            tracing::error!("Failed to generate embedding: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to generate embedding"}))
            ));
        }
    };

    // Check if similar node exists
    let similarity_request = FindSimilarNodesRequest {
        node_id: None,
        embedding: Some(embedding.clone()),
        limit: Some(1),
    };

    match find_similar_nodes(&graph, similarity_request).await {
        Ok(similar_nodes) => {
            if !similar_nodes.is_empty() && similar_nodes[0].score > 0.7 {
                return Err((
                    StatusCode::CONFLICT,
                    Json(json!({
                        "error": "similar node already exists",
                        "details": format!("A node with a similarity score of {} already exists.", similar_nodes[0].score)
                    }))
                ));
            }
        }
        Err(e) => {
            tracing::error!("Failed to find similar nodes: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to find similar nodes"}))
            ));
        }
    }

    // Generate mascot image
    let image_prompt = format!(
        "A minimalistic black-and-white line drawing of '{}'. The sketch is drawn with elegant, simple outlines, with no shading or extra details. The style is similar to high-fashion sketches, emphasizing grace.",
        text_to_embed
    );

    let image_bytes = match generate_image(&image_prompt).await {
        Ok(img) => img,
        Err(e) => {
            tracing::error!("Failed to generate image: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to generate image"}))
            ));
        }
    };

    // Upload image to S3
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let image_name = format!("{}_{}.png", name, timestamp);
    
    let s3_bucket = env::var("S3_BUCKET").unwrap_or_default();
    let upload_params = UploadParams {
        bucket: s3_bucket,
        key: image_name.clone(),
    };

    if let Err(e) = upload_object_to_s3(upload_params, image_bytes).await {
        tracing::error!("Failed to upload image to S3: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "failed to upload image to S3"}))
        ));
    }

    // Add embedding and image to properties
    let mut final_properties = request.properties.clone();
    final_properties.insert("embedding".to_string(), json!(embedding));
    final_properties.insert("image".to_string(), json!(image_name));

    // Build labels string and SET clauses
    let label_string = format!(":{}", request.labels.join(":"));
    let set_clauses: Vec<String> = final_properties.keys()
        .map(|key| format!("n.{} = ${}", key, key))
        .collect();
    let query_string = format!(
        "CREATE (n{}) SET {} RETURN {{id: id(n), elementId: elementId(n), labels: labels(n), props: properties(n)}} AS node", 
        label_string, 
        set_clauses.join(", ")
    );

    let mut query = Neo4jQuery::new(query_string);
    for (key, value) in final_properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut created_nodes = Vec::new();
            
            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                created_nodes.push(node);
            }

            // Map to Bolt5 format
            let bolt5_data = map_bolt4_to_bolt5(created_nodes);
            Ok(Json(bolt5_data))
        }
        Err(e) => {
            tracing::error!("Error creating node: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

pub async fn create_relationship(
    State(graph): State<Graph>,
    Json(request): Json<CreateRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let properties = request.properties.unwrap_or_default();
    let set_clauses: Vec<String> = properties.keys()
        .map(|key| format!("r.{} = ${}", key, key))
        .collect();
    
    let query_string = if set_clauses.is_empty() {
        format!(
            r#"
            MATCH (source), (target)
            WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
            CREATE (source)-[r:{}]->(target)
            RETURN {{id: id(r), elementId: elementId(r), startId: id(startNode(r)), startElementId: elementId(startNode(r)), endId: id(endNode(r)), endElementId: elementId(endNode(r)), type: type(r), props: properties(r)}} AS relationship
            "#,
            request.relationship_type
        )
    } else {
        format!(
            r#"
            MATCH (source), (target)
            WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
            CREATE (source)-[r:{}]->(target)
            SET {}
            RETURN {{id: id(r), elementId: elementId(r), startId: id(startNode(r)), startElementId: elementId(startNode(r)), endId: id(endNode(r)), endElementId: elementId(endNode(r)), type: type(r), props: properties(r)}} AS relationship
            "#,
            request.relationship_type,
            set_clauses.join(", ")
        )
    };

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("sourceId", request.source_id);
    query = query.param("targetId", request.target_id);
    
    for (key, value) in properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut relationships = Vec::new();
            
            while let Ok(Some(row)) = result.next().await {
                let relationship: Value = row.get("relationship").unwrap_or(json!({}));
                relationships.push(relationship);
            }

            // Map to Bolt5 format
            let bolt5_data = map_bolt4_to_bolt5(relationships);
            Ok(Json(bolt5_data))
        }
        Err(e) => {
            tracing::error!("Error creating relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

pub async fn update_node(
    State(graph): State<Graph>,
    Json(request): Json<UpdateNodeRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    if request.labels.is_none() && request.properties.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid request body",
                "details": "At least one of 'labels' or 'properties' must be provided"
            }))
        ));
    }

    let mut query_parts = vec![
        "MATCH (n)".to_string(),
        "WHERE elementId(n) = $targetId".to_string(),
    ];

    // Handle labels if provided
    if let Some(labels) = &request.labels {
        // Remove existing labels and set new ones
        query_parts.push("REMOVE n:_".to_string());
        for label in labels {
            query_parts.push(format!("SET n:`{}`", label));
        }
    }

    // Handle properties if provided
    let properties = request.properties.clone().unwrap_or_default();
    if !properties.is_empty() {
        let set_clauses: Vec<String> = properties.keys()
            .map(|key| format!("n.{} = ${}", key, key))
            .collect();
        query_parts.push(format!("SET {}", set_clauses.join(", ")));
    }

    query_parts.push("RETURN n".to_string());
    let query_string = query_parts.join("\n");

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("targetId", request.target_id);
    
    for (key, value) in properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut updated_nodes = Vec::new();
            
            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("n").unwrap_or(json!({}));
                updated_nodes.push(node);
            }

            Ok(Json(json!(updated_nodes)))
        }
        Err(e) => {
            tracing::error!("Error updating node: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

pub async fn update_relationship(
    State(graph): State<Graph>,
    Json(request): Json<UpdateRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let properties = request.properties.unwrap_or_default();
    let set_clauses: Vec<String> = properties.keys()
        .map(|key| format!("r.{} = ${}", key, key))
        .collect();

    let query_string = if !request.relationship_type.is_empty() {
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
                request.relationship_type
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
                request.relationship_type,
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
            "#.to_string()
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
    query = query.param("targetId", request.target_id);
    
    for (key, value) in properties {
        query = query.param(&key, json_value_to_bolt_type(&value));
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut relationships = Vec::new();
            
            while let Ok(Some(row)) = result.next().await {
                let relationship: Value = row.get("r").unwrap_or(json!({}));
                relationships.push(relationship);
            }

            Ok(Json(json!(relationships)))
        }
        Err(e) => {
            tracing::error!("Error updating relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

pub async fn get_similar_nodes(
    State(graph): State<Graph>,
    Json(request): Json<FindSimilarNodesRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Validate that exactly one of nodeId or embedding is provided
    let has_node_id = request.node_id.is_some();
    let has_embedding = request.embedding.is_some() && !request.embedding.as_ref().unwrap().is_empty();

    if (!has_node_id && !has_embedding) || (has_node_id && has_embedding) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid request body",
                "details": "Exactly one of 'nodeId' or 'embedding' must be provided"
            }))
        ));
    }

    match find_similar_nodes(&graph, request).await {
        Ok(result) => Ok(Json(json!(result))),
        Err(e) => {
            tracing::error!("Error finding similar nodes: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetDomainParams {
    pub name: String,
}

pub async fn get_domain(
    Query(params): Query<GetDomainParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let query_string = r#"
        MATCH (domain:Domain {name: $name})
        OPTIONAL MATCH (domain)-[:HAS_DOMAIN_LEVEL]->(level:Domain_Level)

        // Get knowledge requirements for each level
        OPTIONAL MATCH (level)-[kr:REQUIRES_KNOWLEDGE]->(k:Knowledge)

        // Get skill requirements for each level
        OPTIONAL MATCH (level)-[sr:REQUIRES_SKILL]->(s:Skill)

        // Get trait requirements for each level
        OPTIONAL MATCH (level)-[tr:REQUIRES_TRAIT]->(t:Trait)

        // Get milestone requirements for each level
        OPTIONAL MATCH (level)-[mr:REQUIRES_MILESTONE]->(m:Milestone)

        WITH domain, level,
             collect(DISTINCT {
                 node: properties(k),
                 relationship: properties(kr)
             }) AS knowledge,
             collect(DISTINCT {
                 node: properties(s),
                 relationship: properties(sr)
             }) AS skills,
             collect(DISTINCT {
                 node: properties(t),
                 relationship: properties(tr)
             }) AS traits,
             collect(DISTINCT {
                 node: properties(m),
                 relationship: properties(mr)
             }) AS milestones

        ORDER BY level.level

        WITH domain,
             collect({
                 level: properties(level),
                 knowledge: [item IN knowledge WHERE item.node IS NOT NULL],
                 skills: [item IN skills WHERE item.node IS NOT NULL],
                 traits: [item IN traits WHERE item.node IS NOT NULL],
                 milestones: [item IN milestones WHERE item.node IS NOT NULL]
             }) AS levels

        RETURN {
            domain: properties(domain),
            levels: levels
        } AS result
    "#;

    let mut query = Neo4jQuery::new(query_string.to_string());
    query = query.param("name", params.name);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let domain_data: Value = row.get("result").unwrap_or(json!(null));

                if domain_data.is_null() {
                    return Err(StatusCode::NOT_FOUND);
                }

                Ok(Json(domain_data))
            } else {
                Err(StatusCode::NOT_FOUND)
            }
        }
        Err(e) => {
            tracing::error!("Error in get_domain: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}