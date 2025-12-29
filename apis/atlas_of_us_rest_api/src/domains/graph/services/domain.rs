use neo4rs::{Graph, Query as Neo4jQuery};
use serde_json::{json, Value};

use crate::domains::graph::models::{
    CreateDomainRequest, CreateDomainResult, CreatedNodeInfo, DomainNameValidation,
    LevelRequirements, NewNodeData, ServiceError, UpdateDomainRequest, UpdateDomainResult,
};

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
