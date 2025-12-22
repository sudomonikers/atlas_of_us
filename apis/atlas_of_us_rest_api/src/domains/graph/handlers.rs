use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use neo4rs::Graph;
use serde_json::{json, Value};
use std::collections::HashMap;

use super::models::{
    CreateDomainRequest, DeleteRelationshipRequest,
    GetDomainParams, GetNodeWithRelationshipsBySearchTermParams, NodeQueryParams,
    SearchNodesParams, ServiceError, UpdateDomainRequest, UpdateNodeRequest,
    UpdateRelationshipRequest, ValidateDomainNameParams,
};
use super::services;

// Re-export types needed by agent domain and other modules
pub use super::models::{
    CreateNodeRequest, CreateNodeResult, CreateRelationshipRequest, CreateRelationshipResult,
};

// ========== HTTP Handlers ==========

pub async fn get_nodes(
    Query(params): Query<NodeQueryParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let depth = params.depth.unwrap_or(1);

    // Parse labels
    let labels: Option<Vec<&str>> = params.labels.as_ref().map(|labels_str| {
        labels_str.split(',').map(|s| s.trim()).collect()
    });

    // Parse properties
    let properties: Option<HashMap<String, Value>> = if let Some(properties_str) = &params.properties {
        match serde_json::from_str(properties_str) {
            Ok(props) => Some(props),
            Err(_) => return Err(StatusCode::BAD_REQUEST),
        }
    } else {
        None
    };

    match services::get_nodes_with_relationships(&graph, labels, properties, depth).await {
        Ok(nodes) => {
            let result: Vec<Value> = nodes
                .into_iter()
                .map(|n| {
                    json!({
                        "node": n.node,
                        "relationships": n.relationships,
                        "affiliatedNodes": n.affiliated_nodes
                    })
                })
                .collect();
            Ok(Json(json!(result)))
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

    match services::get_nodes_by_search_term(&graph, &params.search_term, depth).await {
        Ok(nodes) => {
            let result: Vec<Value> = nodes
                .into_iter()
                .map(|n| {
                    json!({
                        "node": n.node,
                        "relationships": n.relationships,
                        "affiliatedNodes": n.affiliated_nodes
                    })
                })
                .collect();
            Ok(Json(json!(result)))
        }
        Err(ServiceError::EmbeddingFailed(e)) => {
            tracing::error!("Failed to generate embedding: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
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
    match services::create_node(&graph, request, true).await {
        Ok(result) => Ok(Json(json!([{
            "elementId": result.element_id,
            "labels": result.labels,
            "props": {
                "name": result.name
            }
        }]))),
        Err(ServiceError::SimilarNodeExists { score, details }) => Err((
            StatusCode::CONFLICT,
            Json(json!({
                "error": "similar node already exists",
                "details": details,
                "score": score
            })),
        )),
        Err(ServiceError::EmbeddingFailed(e)) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to generate embedding: {}", e)})),
        )),
        Err(e) => {
            tracing::error!("Error creating node: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn create_relationship(
    State(graph): State<Graph>,
    Json(request): Json<CreateRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::create_relationship(&graph, request).await {
        Ok(result) => Ok(Json(json!([{
            "elementId": result.element_id,
            "type": result.relationship_type,
            "startElementId": result.source_id,
            "endElementId": result.target_id
        }]))),
        Err(e) => {
            tracing::error!("Error creating relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn update_node(
    State(graph): State<Graph>,
    Json(request): Json<UpdateNodeRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::update_node(&graph, &request.target_id, request.labels, request.properties).await
    {
        Ok(nodes) => Ok(Json(json!(nodes))),
        Err(ServiceError::ValidationError(e)) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid request body",
                "details": e
            })),
        )),
        Err(e) => {
            tracing::error!("Error updating node: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn update_relationship(
    State(graph): State<Graph>,
    Json(request): Json<UpdateRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::update_relationship(
        &graph,
        &request.target_id,
        &request.relationship_type,
        request.properties,
    )
    .await
    {
        Ok(relationships) => Ok(Json(json!(relationships))),
        Err(e) => {
            tracing::error!("Error updating relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn get_similar_nodes(
    State(graph): State<Graph>,
    Json(request): Json<crate::common::similarity::FindSimilarNodesRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::find_similar_nodes(&graph, request.node_id, request.embedding, request.limit)
        .await
    {
        Ok(result) => Ok(Json(result)),
        Err(ServiceError::ValidationError(e)) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid request body",
                "details": e
            })),
        )),
        Err(e) => {
            tracing::error!("Error finding similar nodes: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn get_domain(
    Query(params): Query<GetDomainParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    match services::get_domain(&graph, &params.name).await {
        Ok(Some(domain_data)) => Ok(Json(domain_data)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Error in get_domain: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn delete_relationship(
    State(graph): State<Graph>,
    Json(request): Json<DeleteRelationshipRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::delete_relationship(&graph, &request.relationship_element_id).await {
        Ok(deleted) => Ok(Json(json!({ "deleted": deleted }))),
        Err(e) => {
            tracing::error!("Error deleting relationship: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn search_nodes(
    Query(params): Query<SearchNodesParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    let limit = params.limit.unwrap_or(20);

    let labels: Option<Vec<&str>> = params.labels.as_ref().map(|labels_str| {
        labels_str.split(',').map(|s| s.trim()).collect()
    });

    match services::search_nodes(&graph, &params.query, labels, limit).await {
        Ok(nodes) => Ok(Json(json!({ "nodes": nodes }))),
        Err(e) => {
            tracing::error!("Error in search_nodes: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn validate_domain_name(
    Query(params): Query<ValidateDomainNameParams>,
    State(graph): State<Graph>,
) -> Result<Json<Value>, StatusCode> {
    match services::validate_domain_name(&graph, &params.name).await {
        Ok(validation) => {
            if validation.available {
                Ok(Json(json!({ "available": true })))
            } else {
                Ok(Json(json!({
                    "available": false,
                    "existingDomainElementId": validation.existing_domain_element_id
                })))
            }
        }
        Err(e) => {
            tracing::error!("Error in validate_domain_name: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_domain(
    State(graph): State<Graph>,
    Json(request): Json<CreateDomainRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::create_domain(&graph, request).await {
        Ok(result) => Ok(Json(json!({
            "success": result.success,
            "domain": {
                "elementId": result.domain_element_id,
                "name": result.domain_name
            },
            "createdNodes": result.created_nodes
        }))),
        Err(ServiceError::ValidationError(e)) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e})),
        )),
        Err(e) => {
            tracing::error!("Error creating domain: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

pub async fn update_domain(
    State(graph): State<Graph>,
    Json(request): Json<UpdateDomainRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    match services::update_domain(&graph, request).await {
        Ok(result) => Ok(Json(json!({
            "success": result.success,
            "domain": {
                "elementId": result.domain_element_id,
                "name": result.domain_name
            },
            "createdNodes": result.created_nodes,
            "affectedUserProgressCount": result.affected_user_progress_count
        }))),
        Err(ServiceError::ValidationError(e)) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e})),
        )),
        Err(ServiceError::NotFound(e)) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": e})),
        )),
        Err(e) => {
            tracing::error!("Error updating domain: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "internal server error"})),
            ))
        }
    }
}

// ========== Internal Functions (for agent orchestrator) ==========
// These are thin wrappers around services for backwards compatibility

/// Create a node without HTTP context - for internal use by agent orchestrator
pub async fn create_node_internal(
    graph: &Graph,
    request: CreateNodeRequest,
) -> Result<CreateNodeResult, String> {
    services::create_node(graph, request, false)
        .await
        .map_err(|e| e.to_string())
}

/// Create a relationship without HTTP context - for internal use by agent orchestrator
pub async fn create_relationship_internal(
    graph: &Graph,
    request: CreateRelationshipRequest,
) -> Result<CreateRelationshipResult, String> {
    services::create_relationship(graph, request)
        .await
        .map_err(|e| e.to_string())
}

/// Find a node by name and label - returns element ID if found
pub async fn find_node_by_name(
    graph: &Graph,
    name: &str,
    label: Option<&str>,
) -> Result<Option<String>, String> {
    services::find_node_by_name(graph, name, label)
        .await
        .map_err(|e| e.to_string())
}
