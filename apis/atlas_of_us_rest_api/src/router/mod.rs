use axum::{
    middleware,
    routing::{get, post, put},
    Router,
};
use neo4rs::Graph;
use tower_http::cors::CorsLayer;

use crate::common::handlers::{create_embedding_from_text, return_s3_object, upload_s3_object};
use crate::common::logging_middleware::logging_middleware;
use crate::domains::agent::generate_domain_sse;
use crate::domains::auth::{healthcheck, jwt_auth_middleware, login, signup};
use crate::domains::graph::handlers::{
    create_domain, create_node, create_relationship, delete_relationship, get_domain,
    get_node_with_relationships_by_search_term, get_nodes, get_similar_nodes, search_nodes,
    update_domain, update_node, update_relationship, validate_domain_name,
};
use crate::domains::profile::handlers::get_user_profile;

/// Create the complete application router with all routes and middleware.
pub fn create_router(graph: Graph, cors: CorsLayer) -> Router {
    Router::new()
        .merge(create_auth_routes())
        .merge(create_helper_routes())
        .merge(create_graph_routes())
        .merge(create_profile_routes())
        .merge(create_agent_routes())
        .layer(middleware::from_fn(logging_middleware))
        .layer(cors)
        .with_state(graph)
}

/// Public authentication routes (no JWT required)
fn create_auth_routes() -> Router<Graph> {
    Router::new()
        .route("/api/healthcheck", get(healthcheck))
        .route("/api/register", post(signup))
        .route("/api/login", post(login))
}

/// Helper routes for S3 and embedding operations (JWT protected)
fn create_helper_routes() -> Router<Graph> {
    Router::new()
        .route("/api/secure/helper/s3-object", get(return_s3_object))
        .route("/api/secure/helper/s3-upload", post(upload_s3_object))
        .route(
            "/api/secure/helper/embedding",
            post(create_embedding_from_text),
        )
        .route_layer(middleware::from_fn(jwt_auth_middleware))
}

/// Graph management routes (JWT protected)
fn create_graph_routes() -> Router<Graph> {
    Router::new()
        // Node operations
        .route("/api/secure/graph/get-nodes", get(get_nodes))
        .route(
            "/api/secure/graph/get-node-with-relationships-by-search-term",
            get(get_node_with_relationships_by_search_term),
        )
        .route("/api/secure/graph/create-node", post(create_node))
        .route("/api/secure/graph/update-node", put(update_node))
        // Relationship operations
        .route(
            "/api/secure/graph/create-relationship",
            post(create_relationship),
        )
        .route(
            "/api/secure/graph/update-relationship",
            put(update_relationship),
        )
        .route(
            "/api/secure/graph/delete-relationship",
            post(delete_relationship),
        )
        // Search operations
        .route("/api/secure/graph/similar-nodes", post(get_similar_nodes))
        .route("/api/secure/graph/search-nodes", get(search_nodes))
        // Domain operations
        .route("/api/secure/graph/domain", get(get_domain))
        .route(
            "/api/secure/graph/validate-domain-name",
            get(validate_domain_name),
        )
        .route("/api/secure/graph/create-domain", post(create_domain))
        .route("/api/secure/graph/update-domain", put(update_domain))
        .route_layer(middleware::from_fn(jwt_auth_middleware))
}

/// User profile routes (JWT protected)
fn create_profile_routes() -> Router<Graph> {
    Router::new()
        .route(
            "/api/secure/profile/user-profile/{username}",
            get(get_user_profile),
        )
        .route_layer(middleware::from_fn(jwt_auth_middleware))
}

/// Agent routes for AI-powered domain generation (JWT protected)
fn create_agent_routes() -> Router<Graph> {
    Router::new()
        .route("/api/secure/agent/generate-domain", post(generate_domain_sse))
        .route_layer(middleware::from_fn(jwt_auth_middleware))
}
