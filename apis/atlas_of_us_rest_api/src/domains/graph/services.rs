use neo4rs::{Graph, Query as Neo4jQuery};
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::common::{
    embedding::generate_embedding,
    neo4j_utils::{json_value_to_bolt_type, map_bolt4_to_bolt5},
    similarity::{find_similar_nodes as similarity_find_similar_nodes, FindSimilarNodesRequest},
};

use super::models::{
    CreateDomainRequest, CreateDomainResult, CreateNodeRequest, CreateNodeResult,
    CreateRelationshipRequest, CreateRelationshipResult, CreatedNodeInfo, DomainNameValidation,
    LevelRequirements, NewNodeData, NodeWithRelationships, ServiceError, UpdateDomainRequest,
    UpdateDomainResult,
};

// ========== Cypher Query Templates ==========

/// Returns the Cypher fragment for collecting node metadata with relationships
fn node_with_relationships_query_fragment(depth: i32) -> String {
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

// ========== Node Operations ==========

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

// ========== Relationship Operations ==========

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

// ========== Similarity Operations ==========

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

// ========== Domain Operations ==========

/// Get a domain with all its levels and requirements
pub async fn get_domain(graph: &Graph, name: &str) -> Result<Option<Value>, ServiceError> {
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
    query = query.param("name", name);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let domain_data: Value = row.get("result").unwrap_or(json!(null));

                if domain_data.is_null() {
                    return Ok(None);
                }

                Ok(Some(domain_data))
            } else {
                Ok(None)
            }
        }
        Err(e) => {
            tracing::error!("Error in get_domain: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Validate if a domain name is available
pub async fn validate_domain_name(
    graph: &Graph,
    name: &str,
) -> Result<DomainNameValidation, ServiceError> {
    let query_string = r#"
        MATCH (d:Domain {name: $name})
        RETURN elementId(d) AS elementId
        LIMIT 1
    "#;

    let mut query = Neo4jQuery::new(query_string.to_string());
    query = query.param("name", name);

    match graph.execute(query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let element_id: String = row.get("elementId").unwrap_or_default();
                Ok(DomainNameValidation {
                    available: false,
                    existing_domain_element_id: Some(element_id),
                })
            } else {
                Ok(DomainNameValidation {
                    available: true,
                    existing_domain_element_id: None,
                })
            }
        }
        Err(e) => {
            tracing::error!("Error in validate_domain_name: {}", e);
            Err(ServiceError::DatabaseError(format!("Database error: {}", e)))
        }
    }
}

/// Create a component node (Knowledge, Skill, Trait, Milestone) - helper for domain operations
async fn create_component_node(
    graph: &Graph,
    label: &str,
    node_data: &NewNodeData,
) -> Result<String, ServiceError> {
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
    let set_clauses: Vec<String> = props
        .iter()
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
                Err(ServiceError::DatabaseError(
                    "Failed to get element ID after creation".to_string(),
                ))
            }
        }
        Err(e) => Err(ServiceError::DatabaseError(format!("Database error: {}", e))),
    }
}

/// Process level requirements - creates nodes and relationships
/// This eliminates the 8x duplication in create_domain/update_domain
async fn process_level_requirements(
    graph: &Graph,
    level_element_id: &str,
    requirements: &LevelRequirements,
) -> Result<Vec<CreatedNodeInfo>, ServiceError> {
    let mut created_nodes: Vec<CreatedNodeInfo> = Vec::new();

    // Process Knowledge requirements
    for knowledge_req in &requirements.knowledge {
        let node_id = if let Some(existing_id) = &knowledge_req.node_element_id {
            existing_id.clone()
        } else if let Some(new_node) = &knowledge_req.new_node {
            match create_component_node(graph, "Knowledge", new_node).await {
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
            "#
            .to_string(),
        )
        .param("levelId", level_element_id)
        .param("nodeId", node_id)
        .param("bloomLevel", knowledge_req.bloom_level.clone());

        if let Err(e) = graph.run(rel_query).await {
            tracing::error!("Error creating knowledge requirement: {}", e);
        }
    }

    // Process Skill requirements
    for skill_req in &requirements.skills {
        let node_id = if let Some(existing_id) = &skill_req.node_element_id {
            existing_id.clone()
        } else if let Some(new_node) = &skill_req.new_node {
            match create_component_node(graph, "Skill", new_node).await {
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
            "#
            .to_string(),
        )
        .param("levelId", level_element_id)
        .param("nodeId", node_id)
        .param("dreyfusLevel", skill_req.dreyfus_level.clone());

        if let Err(e) = graph.run(rel_query).await {
            tracing::error!("Error creating skill requirement: {}", e);
        }
    }

    // Process Trait requirements
    for trait_req in &requirements.traits {
        let node_id = if let Some(existing_id) = &trait_req.node_element_id {
            existing_id.clone()
        } else if let Some(new_node) = &trait_req.new_node {
            match create_component_node(graph, "Trait", new_node).await {
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
            "#
            .to_string(),
        )
        .param("levelId", level_element_id)
        .param("nodeId", node_id)
        .param("minScore", trait_req.min_score);

        if let Err(e) = graph.run(rel_query).await {
            tracing::error!("Error creating trait requirement: {}", e);
        }
    }

    // Process Milestone requirements
    for milestone_req in &requirements.milestones {
        let node_id = if let Some(existing_id) = &milestone_req.node_element_id {
            existing_id.clone()
        } else if let Some(new_node) = &milestone_req.new_node {
            match create_component_node(graph, "Milestone", new_node).await {
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
            "#
            .to_string(),
        )
        .param("levelId", level_element_id)
        .param("nodeId", node_id);

        if let Err(e) = graph.run(rel_query).await {
            tracing::error!("Error creating milestone requirement: {}", e);
        }
    }

    Ok(created_nodes)
}

/// Create a complete domain with levels and requirements
pub async fn create_domain(
    graph: &Graph,
    request: CreateDomainRequest,
) -> Result<CreateDomainResult, ServiceError> {
    // Validate request
    if request.domain.name.is_empty() {
        return Err(ServiceError::ValidationError(
            "Domain name is required".to_string(),
        ));
    }

    if request.levels.is_empty() {
        return Err(ServiceError::ValidationError(
            "At least one level is required".to_string(),
        ));
    }

    // Check if domain already exists
    let check_query = Neo4jQuery::new(
        "MATCH (d:Domain {name: $name}) RETURN elementId(d) AS id LIMIT 1".to_string(),
    )
    .param("name", request.domain.name.clone());

    match graph.execute(check_query).await {
        Ok(mut result) => {
            if let Ok(Some(_)) = result.next().await {
                return Err(ServiceError::ValidationError(
                    "Domain with this name already exists".to_string(),
                ));
            }
        }
        Err(e) => {
            tracing::error!("Error checking domain existence: {}", e);
            return Err(ServiceError::DatabaseError(
                "Failed to check domain existence".to_string(),
            ));
        }
    }

    let mut created_nodes: Vec<CreatedNodeInfo> = Vec::new();

    // Create Domain node
    let create_domain_query = Neo4jQuery::new(
        r#"
        CREATE (d:Domain {name: $name, description: $description})
        RETURN elementId(d) AS elementId
        "#
        .to_string(),
    )
    .param("name", request.domain.name.clone())
    .param("description", request.domain.description.clone());

    let domain_element_id = match graph.execute(create_domain_query).await {
        Ok(mut result) => {
            if let Ok(Some(row)) = result.next().await {
                let id: String = row.get("elementId").unwrap_or_default();
                id
            } else {
                return Err(ServiceError::DatabaseError(
                    "Failed to create domain node".to_string(),
                ));
            }
        }
        Err(e) => {
            tracing::error!("Error creating domain: {}", e);
            return Err(ServiceError::DatabaseError("Failed to create domain".to_string()));
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
            "#
            .to_string(),
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
            }
        }
    }

    // Process requirements for each level
    for (level_idx, level) in request.levels.iter().enumerate() {
        if level_idx >= level_element_ids.len() {
            continue;
        }
        let level_element_id = &level_element_ids[level_idx];

        match process_level_requirements(graph, level_element_id, &level.requirements).await {
            Ok(mut nodes) => created_nodes.append(&mut nodes),
            Err(e) => {
                tracing::error!("Error processing level requirements: {}", e);
            }
        }
    }

    Ok(CreateDomainResult {
        success: true,
        domain_element_id,
        domain_name: request.domain.name,
        created_nodes,
    })
}

/// Update a domain with new levels and requirements
pub async fn update_domain(
    graph: &Graph,
    request: UpdateDomainRequest,
) -> Result<UpdateDomainResult, ServiceError> {
    // Validate request
    if request.domain.name.is_empty() {
        return Err(ServiceError::ValidationError(
            "Domain name is required".to_string(),
        ));
    }

    if request.levels.is_empty() {
        return Err(ServiceError::ValidationError(
            "At least one level is required".to_string(),
        ));
    }

    // Verify domain exists
    let verify_query = Neo4jQuery::new(
        "MATCH (d:Domain) WHERE elementId(d) = $domainId RETURN d.name AS name".to_string(),
    )
    .param("domainId", request.domain_element_id.clone());

    match graph.execute(verify_query).await {
        Ok(mut result) => {
            if result.next().await.ok().flatten().is_none() {
                return Err(ServiceError::NotFound("Domain not found".to_string()));
            }
        }
        Err(e) => {
            tracing::error!("Error verifying domain: {}", e);
            return Err(ServiceError::DatabaseError(
                "Failed to verify domain".to_string(),
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
            "#
            .to_string(),
        )
        .param("nodeIds", request.removed_node_element_ids.clone());

        match graph.execute(delete_progress_query).await {
            Ok(mut result) => {
                if let Ok(Some(row)) = result.next().await {
                    affected_user_count = row.get("deletedCount").unwrap_or(0);
                }
            }
            Err(e) => {
                tracing::error!("Error deleting user progress: {}", e);
            }
        }
    }

    // Update domain properties
    let update_domain_query = Neo4jQuery::new(
        r#"
        MATCH (d:Domain) WHERE elementId(d) = $domainId
        SET d.name = $name, d.description = $description
        RETURN elementId(d) AS elementId
        "#
        .to_string(),
    )
    .param("domainId", request.domain_element_id.clone())
    .param("name", request.domain.name.clone())
    .param("description", request.domain.description.clone());

    if let Err(e) = graph.run(update_domain_query).await {
        tracing::error!("Error updating domain: {}", e);
        return Err(ServiceError::DatabaseError(
            "Failed to update domain".to_string(),
        ));
    }

    // Delete old Domain_Level nodes and their relationships
    let delete_levels_query = Neo4jQuery::new(
        r#"
        MATCH (d:Domain)-[:HAS_DOMAIN_LEVEL]->(l:Domain_Level)
        WHERE elementId(d) = $domainId
        DETACH DELETE l
        "#
        .to_string(),
    )
    .param("domainId", request.domain_element_id.clone());

    if let Err(e) = graph.run(delete_levels_query).await {
        tracing::error!("Error deleting old levels: {}", e);
        return Err(ServiceError::DatabaseError(
            "Failed to delete old levels".to_string(),
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
            "#
            .to_string(),
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

    // Process requirements for each level
    for (level_idx, level) in request.levels.iter().enumerate() {
        if level_idx >= level_element_ids.len() {
            continue;
        }
        let level_element_id = &level_element_ids[level_idx];

        match process_level_requirements(graph, level_element_id, &level.requirements).await {
            Ok(mut nodes) => created_nodes.append(&mut nodes),
            Err(e) => {
                tracing::error!("Error processing level requirements: {}", e);
            }
        }
    }

    Ok(UpdateDomainResult {
        success: true,
        domain_element_id: request.domain_element_id,
        domain_name: request.domain.name,
        created_nodes,
        affected_user_progress_count: affected_user_count,
    })
}
