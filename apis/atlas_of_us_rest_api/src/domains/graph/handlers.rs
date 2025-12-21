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

    // Add embedding and image to properties
    let mut final_properties = request.properties.clone();
    final_properties.insert("embedding".to_string(), json!(embedding));

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
    
    // Use MERGE to update existing relationship or create if not exists
    let query_string = if set_clauses.is_empty() {
        format!(
            r#"
            MATCH (source), (target)
            WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
            MERGE (source)-[r:{}]->(target)
            RETURN {{id: id(r), elementId: elementId(r), startId: id(startNode(r)), startElementId: elementId(startNode(r)), endId: id(endNode(r)), endElementId: elementId(endNode(r)), type: type(r), props: properties(r)}} AS relationship
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
    // Unified flat format: all node properties and requirements merged into single objects
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

        // Get GENERALIZES_TO relationships for skills and knowledge
        OPTIONAL MATCH (s)-[:GENERALIZES_TO]->(generalSkill:Skill)
        OPTIONAL MATCH (k)-[:GENERALIZES_TO]->(generalKnowledge:Knowledge)

        WITH domain, level,
             collect(DISTINCT CASE WHEN k IS NOT NULL THEN {
                 elementId: elementId(k),
                 type: 'knowledge',
                 name: k.name,
                 description: k.description,
                 howToLearn: k.how_to_learn,
                 bloomLevel: kr.bloom_level,
                 generalizesTo: CASE WHEN generalKnowledge IS NOT NULL THEN {
                     elementId: elementId(generalKnowledge),
                     name: generalKnowledge.name
                 } ELSE null END
             } ELSE NULL END) AS knowledge,
             collect(DISTINCT CASE WHEN s IS NOT NULL THEN {
                 elementId: elementId(s),
                 type: 'skill',
                 name: s.name,
                 description: s.description,
                 howToDevelop: s.how_to_develop,
                 dreyfusLevel: sr.dreyfus_level,
                 generalizesTo: CASE WHEN generalSkill IS NOT NULL THEN {
                     elementId: elementId(generalSkill),
                     name: generalSkill.name
                 } ELSE null END
             } ELSE NULL END) AS skills,
             collect(DISTINCT CASE WHEN t IS NOT NULL THEN {
                 elementId: elementId(t),
                 type: 'trait',
                 name: t.name,
                 description: t.description,
                 measurementCriteria: t.measurement_criteria,
                 minScore: tr.min_score
             } ELSE NULL END) AS traits,
             collect(DISTINCT CASE WHEN m IS NOT NULL THEN {
                 elementId: elementId(m),
                 type: 'milestone',
                 name: m.name,
                 description: m.description,
                 howToAchieve: m.how_to_achieve
             } ELSE NULL END) AS milestones

        ORDER BY level.level

        WITH domain,
             collect(CASE WHEN level IS NOT NULL THEN {
                 elementId: elementId(level),
                 level: level.level,
                 name: level.name,
                 description: level.description,
                 pointsRequired: level.total_points_required,
                 knowledge: [item IN knowledge WHERE item IS NOT NULL],
                 skills: [item IN skills WHERE item IS NOT NULL],
                 traits: [item IN traits WHERE item IS NOT NULL],
                 milestones: [item IN milestones WHERE item IS NOT NULL]
             } ELSE NULL END) AS levels

        RETURN {
            elementId: elementId(domain),
            name: domain.name,
            description: domain.description,
            levels: [l IN levels WHERE l IS NOT NULL]
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

#[derive(Debug, Deserialize)]
pub struct DeleteRelationshipRequest {
    #[serde(rename = "relationshipElementId")]
    pub relationship_element_id: String,
}

pub async fn delete_relationship(
    State(graph): State<Graph>,
    Json(request): Json<DeleteRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let query_string = r#"
        MATCH ()-[r]->()
        WHERE elementId(r) = $relId
        DELETE r
        RETURN count(r) AS deleted
    "#;

    let mut query = Neo4jQuery::new(query_string.to_string());
    query = query.param("relId", request.relationship_element_id);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let deleted: i64 = row.get("deleted").unwrap_or(0);
                Ok(Json(json!({ "deleted": deleted })))
            } else {
                Ok(Json(json!({ "deleted": 0 })))
            }
        }
        Err(e) => {
            tracing::error!("Error deleting relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"}))
            ))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct SearchNodesParams {
    pub query: String,
    pub labels: Option<String>, // Comma-separated: "Knowledge,Skill,Trait,Milestone"
    pub limit: Option<i64>,
}

pub async fn search_nodes(
    Query(params): Query<SearchNodesParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let limit = params.limit.unwrap_or(20);

    // Build label filter
    let label_filter = if let Some(labels_str) = &params.labels {
        let labels: Vec<&str> = labels_str.split(',').map(|s| s.trim()).collect();
        let label_conditions: Vec<String> = labels.iter()
            .map(|l| format!("n:`{}`", l))
            .collect();
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
    query = query.param("query", params.query);
    query = query.param("limit", limit);

    match graph.execute(query).await {
        Ok(mut result) => {
            let mut nodes = Vec::new();

            while let Ok(Some(row)) = result.next().await {
                let node: Value = row.get("node").unwrap_or(json!({}));
                nodes.push(node);
            }

            Ok(Json(json!({ "nodes": nodes })))
        }
        Err(e) => {
            tracing::error!("Error in search_nodes: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ValidateDomainNameParams {
    pub name: String,
}

pub async fn validate_domain_name(
    Query(params): Query<ValidateDomainNameParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let query_string = r#"
        MATCH (d:Domain {name: $name})
        RETURN elementId(d) AS elementId
        LIMIT 1
    "#;

    let mut query = Neo4jQuery::new(query_string.to_string());
    query = query.param("name", params.name);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();
                Ok(Json(json!({
                    "available": false,
                    "existingDomainElementId": element_id
                })))
            } else {
                Ok(Json(json!({ "available": true })))
            }
        }
        Err(e) => {
            tracing::error!("Error in validate_domain_name: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Request types for create_domain
#[derive(Debug, Deserialize, Serialize)]
pub struct NewNodeData {
    pub name: String,
    pub description: String,
    pub how_to_learn: Option<String>,      // Knowledge
    pub how_to_develop: Option<String>,    // Skill
    pub measurement_criteria: Option<String>, // Trait
    pub how_to_achieve: Option<String>,    // Milestone
}

#[derive(Debug, Deserialize, Serialize)]
pub struct KnowledgeRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub bloom_level: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SkillRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub dreyfus_level: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TraitRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
    pub min_score: i64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MilestoneRequirement {
    #[serde(rename = "nodeElementId")]
    pub node_element_id: Option<String>,
    #[serde(rename = "newNode")]
    pub new_node: Option<NewNodeData>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LevelRequirements {
    pub knowledge: Vec<KnowledgeRequirement>,
    pub skills: Vec<SkillRequirement>,
    pub traits: Vec<TraitRequirement>,
    pub milestones: Vec<MilestoneRequirement>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DomainLevel {
    pub level: i64,
    pub name: String,
    pub description: Option<String>,
    pub points_required: i64,
    pub requirements: LevelRequirements,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DomainInfo {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateDomainRequest {
    pub domain: DomainInfo,
    pub levels: Vec<DomainLevel>,
}

#[derive(Debug, Serialize)]
pub struct CreatedNodeInfo {
    #[serde(rename = "elementId")]
    pub element_id: String,
    pub name: String,
    pub labels: Vec<String>,
}

pub async fn create_domain(
    State(graph): State<Graph>,
    Json(request): Json<CreateDomainRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Validate request
    if request.domain.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Domain name is required"}))
        ));
    }

    if request.levels.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "At least one level is required"}))
        ));
    }

    // Check if domain already exists
    let check_query = Neo4jQuery::new(
        "MATCH (d:Domain {name: $name}) RETURN elementId(d) AS id LIMIT 1".to_string()
    ).param("name", request.domain.name.clone());

    match graph.execute(check_query).await {
        Ok(mut result) => {
            if let Ok(Some(_)) = result.next().await {
                return Err((
                    StatusCode::CONFLICT,
                    Json(json!({"error": "Domain with this name already exists"}))
                ));
            }
        }
        Err(e) => {
            tracing::error!("Error checking domain existence: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to check domain existence"}))
            ));
        }
    }

    let mut created_nodes: Vec<CreatedNodeInfo> = Vec::new();

    // Create Domain node
    let create_domain_query = Neo4jQuery::new(
        r#"
        CREATE (d:Domain {name: $name, description: $description})
        RETURN elementId(d) AS elementId
        "#.to_string()
    )
    .param("name", request.domain.name.clone())
    .param("description", request.domain.description.clone());

    let domain_element_id = match graph.execute(create_domain_query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let id: String = row.get("elementId").unwrap_or_default();
                id
            } else {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create domain node"}))
                ));
            }
        }
        Err(e) => {
            tracing::error!("Error creating domain: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to create domain"}))
            ));
        }
    };

    // Create Domain Levels and link to domain
    let mut level_element_ids: Vec<String> = Vec::new();

    for level in &request.levels {
        let level_description = level.description.clone().unwrap_or_default();

        let create_level_query = Neo4jQuery::new(
            r#"
            MATCH (d:Domain) WHERE elementId(d) = $domainId
            CREATE (l:Domain_Level {
                level: $level,
                name: $name,
                description: $description,
                total_points_required: $points
            })
            CREATE (d)-[:HAS_DOMAIN_LEVEL]->(l)
            RETURN elementId(l) AS elementId
            "#.to_string()
        )
        .param("domainId", domain_element_id.clone())
        .param("level", level.level)
        .param("name", level.name.clone())
        .param("description", level_description)
        .param("points", level.points_required);

        match graph.execute(create_level_query).await {
            Ok(mut result) => {
                if let Ok(Some(row)) = result.next().await {
                    let id: String = row.get("elementId").unwrap_or_default();
                    level_element_ids.push(id);
                }
            }
            Err(e) => {
                tracing::error!("Error creating domain level: {}", e);
                // Continue but log the error
            }
        }
    }

    // Process requirements for each level
    for (level_idx, level) in request.levels.iter().enumerate() {
        if level_idx >= level_element_ids.len() {
            continue;
        }
        let level_element_id = &level_element_ids[level_idx];

        // Process Knowledge requirements
        for knowledge_req in &level.requirements.knowledge {
            let node_id = if let Some(existing_id) = &knowledge_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &knowledge_req.new_node {
                // Create new Knowledge node
                match create_component_node(&graph, "Knowledge", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Knowledge".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create knowledge node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            // Create REQUIRES_KNOWLEDGE relationship
            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (k:Knowledge)
                WHERE elementId(l) = $levelId AND elementId(k) = $nodeId
                CREATE (l)-[:REQUIRES_KNOWLEDGE {bloom_level: $bloomLevel}]->(k)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("bloomLevel", knowledge_req.bloom_level.clone());

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating knowledge requirement: {}", e);
            }
        }

        // Process Skill requirements
        for skill_req in &level.requirements.skills {
            let node_id = if let Some(existing_id) = &skill_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &skill_req.new_node {
                match create_component_node(&graph, "Skill", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Skill".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create skill node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (s:Skill)
                WHERE elementId(l) = $levelId AND elementId(s) = $nodeId
                CREATE (l)-[:REQUIRES_SKILL {dreyfus_level: $dreyfusLevel}]->(s)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("dreyfusLevel", skill_req.dreyfus_level.clone());

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating skill requirement: {}", e);
            }
        }

        // Process Trait requirements
        for trait_req in &level.requirements.traits {
            let node_id = if let Some(existing_id) = &trait_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &trait_req.new_node {
                match create_component_node(&graph, "Trait", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Trait".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create trait node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (t:Trait)
                WHERE elementId(l) = $levelId AND elementId(t) = $nodeId
                CREATE (l)-[:REQUIRES_TRAIT {min_score: $minScore}]->(t)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("minScore", trait_req.min_score);

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating trait requirement: {}", e);
            }
        }

        // Process Milestone requirements
        for milestone_req in &level.requirements.milestones {
            let node_id = if let Some(existing_id) = &milestone_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &milestone_req.new_node {
                match create_component_node(&graph, "Milestone", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Milestone".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create milestone node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (m:Milestone)
                WHERE elementId(l) = $levelId AND elementId(m) = $nodeId
                CREATE (l)-[:REQUIRES_MILESTONE]->(m)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id);

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating milestone requirement: {}", e);
            }
        }
    }

    Ok(Json(json!({
        "success": true,
        "domain": {
            "elementId": domain_element_id,
            "name": request.domain.name
        },
        "createdNodes": created_nodes
    })))
}

// Helper function to create component nodes (Knowledge, Skill, Trait, Milestone)
async fn create_component_node(
    graph: &Graph,
    label: &str,
    node_data: &NewNodeData,
) -> Result<String, String> {
    // Build properties based on node type
    let mut props = vec![
        ("name".to_string(), node_data.name.clone()),
        ("description".to_string(), node_data.description.clone()),
    ];

    match label {
        "Knowledge" => {
            if let Some(how_to_learn) = &node_data.how_to_learn {
                props.push(("how_to_learn".to_string(), how_to_learn.clone()));
            }
        }
        "Skill" => {
            if let Some(how_to_develop) = &node_data.how_to_develop {
                props.push(("how_to_develop".to_string(), how_to_develop.clone()));
            }
        }
        "Trait" => {
            if let Some(measurement_criteria) = &node_data.measurement_criteria {
                props.push(("measurement_criteria".to_string(), measurement_criteria.clone()));
            }
        }
        "Milestone" => {
            if let Some(how_to_achieve) = &node_data.how_to_achieve {
                props.push(("how_to_achieve".to_string(), how_to_achieve.clone()));
            }
        }
        _ => {}
    }

    // Build SET clause
    let set_clauses: Vec<String> = props.iter()
        .enumerate()
        .map(|(i, (key, _))| format!("n.{} = $prop{}", key, i))
        .collect();

    let query_string = format!(
        r#"
        MERGE (n:{} {{name: $name}})
        ON CREATE SET {}
        RETURN elementId(n) AS elementId
        "#,
        label,
        set_clauses.join(", ")
    );

    let mut query = Neo4jQuery::new(query_string);
    query = query.param("name", node_data.name.clone());

    for (i, (_, value)) in props.iter().enumerate() {
        query = query.param(&format!("prop{}", i), value.clone());
    }

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();
                Ok(element_id)
            } else {
                Err("Failed to get element ID after creation".to_string())
            }
        }
        Err(e) => {
            Err(format!("Database error: {}", e))
        }
    }
}

// Request type for update_domain
#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateDomainRequest {
    #[serde(rename = "domainElementId")]
    pub domain_element_id: String,
    pub domain: DomainInfo,
    pub levels: Vec<DomainLevel>,
    #[serde(rename = "removedNodeElementIds")]
    pub removed_node_element_ids: Vec<String>,
}

pub async fn update_domain(
    State(graph): State<Graph>,
    Json(request): Json<UpdateDomainRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Validate request
    if request.domain.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Domain name is required"}))
        ));
    }

    if request.levels.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "At least one level is required"}))
        ));
    }

    // Verify domain exists
    let verify_query = Neo4jQuery::new(
        "MATCH (d:Domain) WHERE elementId(d) = $domainId RETURN d.name AS name".to_string()
    ).param("domainId", request.domain_element_id.clone());

    match graph.execute(verify_query).await {
        Ok(mut result) => {
            if result.next().await.ok().flatten().is_none() {
                return Err((
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": "Domain not found"}))
                ));
            }
        }
        Err(e) => {
            tracing::error!("Error verifying domain: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to verify domain"}))
            ));
        }
    }

    // Delete user progress for removed nodes
    let mut affected_user_count: i64 = 0;
    if !request.removed_node_element_ids.is_empty() {
        let delete_progress_query = Neo4jQuery::new(
            r#"
            UNWIND $nodeIds AS nodeId
            MATCH (u:User)-[r:HAS_KNOWLEDGE|HAS_SKILL|HAS_TRAIT|ACHIEVED]->(n)
            WHERE elementId(n) = nodeId
            DELETE r
            RETURN count(r) AS deletedCount
            "#.to_string()
        ).param("nodeIds", request.removed_node_element_ids.clone());

        match graph.execute(delete_progress_query).await {
            Ok(mut result) => {
                if let Ok(Some(row)) = result.next().await {
                    affected_user_count = row.get("deletedCount").unwrap_or(0);
                }
            }
            Err(e) => {
                tracing::error!("Error deleting user progress: {}", e);
                // Continue anyway - non-critical
            }
        }
    }

    // Update domain properties
    let update_domain_query = Neo4jQuery::new(
        r#"
        MATCH (d:Domain) WHERE elementId(d) = $domainId
        SET d.name = $name, d.description = $description
        RETURN elementId(d) AS elementId
        "#.to_string()
    )
    .param("domainId", request.domain_element_id.clone())
    .param("name", request.domain.name.clone())
    .param("description", request.domain.description.clone());

    if let Err(e) = graph.run(update_domain_query).await {
        tracing::error!("Error updating domain: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to update domain"}))
        ));
    }

    // Delete old Domain_Level nodes and their relationships
    let delete_levels_query = Neo4jQuery::new(
        r#"
        MATCH (d:Domain)-[:HAS_DOMAIN_LEVEL]->(l:Domain_Level)
        WHERE elementId(d) = $domainId
        DETACH DELETE l
        "#.to_string()
    ).param("domainId", request.domain_element_id.clone());

    if let Err(e) = graph.run(delete_levels_query).await {
        tracing::error!("Error deleting old levels: {}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Failed to delete old levels"}))
        ));
    }

    let mut created_nodes: Vec<CreatedNodeInfo> = Vec::new();

    // Create new Domain Levels and link to domain
    let mut level_element_ids: Vec<String> = Vec::new();

    for level in &request.levels {
        let level_description = level.description.clone().unwrap_or_default();

        let create_level_query = Neo4jQuery::new(
            r#"
            MATCH (d:Domain) WHERE elementId(d) = $domainId
            CREATE (l:Domain_Level {
                level: $level,
                name: $name,
                description: $description,
                total_points_required: $points
            })
            CREATE (d)-[:HAS_DOMAIN_LEVEL]->(l)
            RETURN elementId(l) AS elementId
            "#.to_string()
        )
        .param("domainId", request.domain_element_id.clone())
        .param("level", level.level)
        .param("name", level.name.clone())
        .param("description", level_description)
        .param("points", level.points_required);

        match graph.execute(create_level_query).await {
            Ok(mut result) => {
                if let Ok(Some(row)) = result.next().await {
                    let id: String = row.get("elementId").unwrap_or_default();
                    level_element_ids.push(id);
                }
            }
            Err(e) => {
                tracing::error!("Error creating domain level: {}", e);
            }
        }
    }

    // Process requirements for each level (same logic as create_domain)
    for (level_idx, level) in request.levels.iter().enumerate() {
        if level_idx >= level_element_ids.len() {
            continue;
        }
        let level_element_id = &level_element_ids[level_idx];

        // Process Knowledge requirements
        for knowledge_req in &level.requirements.knowledge {
            let node_id = if let Some(existing_id) = &knowledge_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &knowledge_req.new_node {
                match create_component_node(&graph, "Knowledge", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Knowledge".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create knowledge node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (k:Knowledge)
                WHERE elementId(l) = $levelId AND elementId(k) = $nodeId
                CREATE (l)-[:REQUIRES_KNOWLEDGE {bloom_level: $bloomLevel}]->(k)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("bloomLevel", knowledge_req.bloom_level.clone());

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating knowledge requirement: {}", e);
            }
        }

        // Process Skill requirements
        for skill_req in &level.requirements.skills {
            let node_id = if let Some(existing_id) = &skill_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &skill_req.new_node {
                match create_component_node(&graph, "Skill", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Skill".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create skill node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (s:Skill)
                WHERE elementId(l) = $levelId AND elementId(s) = $nodeId
                CREATE (l)-[:REQUIRES_SKILL {dreyfus_level: $dreyfusLevel}]->(s)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("dreyfusLevel", skill_req.dreyfus_level.clone());

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating skill requirement: {}", e);
            }
        }

        // Process Trait requirements
        for trait_req in &level.requirements.traits {
            let node_id = if let Some(existing_id) = &trait_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &trait_req.new_node {
                match create_component_node(&graph, "Trait", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Trait".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create trait node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (t:Trait)
                WHERE elementId(l) = $levelId AND elementId(t) = $nodeId
                CREATE (l)-[:REQUIRES_TRAIT {min_score: $minScore}]->(t)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id)
            .param("minScore", trait_req.min_score);

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating trait requirement: {}", e);
            }
        }

        // Process Milestone requirements
        for milestone_req in &level.requirements.milestones {
            let node_id = if let Some(existing_id) = &milestone_req.node_element_id {
                existing_id.clone()
            } else if let Some(new_node) = &milestone_req.new_node {
                match create_component_node(&graph, "Milestone", new_node).await {
                    Ok(id) => {
                        created_nodes.push(CreatedNodeInfo {
                            element_id: id.clone(),
                            name: new_node.name.clone(),
                            labels: vec!["Milestone".to_string()],
                        });
                        id
                    }
                    Err(e) => {
                        tracing::error!("Failed to create milestone node: {}", e);
                        continue;
                    }
                }
            } else {
                continue;
            };

            let rel_query = Neo4jQuery::new(
                r#"
                MATCH (l:Domain_Level), (m:Milestone)
                WHERE elementId(l) = $levelId AND elementId(m) = $nodeId
                CREATE (l)-[:REQUIRES_MILESTONE]->(m)
                "#.to_string()
            )
            .param("levelId", level_element_id.clone())
            .param("nodeId", node_id);

            if let Err(e) = graph.run(rel_query).await {
                tracing::error!("Error creating milestone requirement: {}", e);
            }
        }
    }

    Ok(Json(json!({
        "success": true,
        "domain": {
            "elementId": request.domain_element_id,
            "name": request.domain.name
        },
        "createdNodes": created_nodes,
        "affectedUserProgressCount": affected_user_count
    })))
}