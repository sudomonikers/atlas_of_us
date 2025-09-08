use axum::{extract::State, http::StatusCode, response::Json};
use neo4rs::Graph;
use std::collections::HashMap;
use validator::Validate;

use crate::domains::auth::models::{AuthResponse, ErrorResponse, LoginRequest, SignUpRequest};
use crate::domains::auth::utils::{generate_token, hash_password, verify_password};

pub async fn healthcheck() -> Json<serde_json::Value> {
    Json(serde_json::json!("ok"))
}

pub async fn login(
    State(graph): State<Graph>,
    Json(login_req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate request
    if let Err(_) = login_req.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid request".to_string(),
            }),
        ));
    }

    // Query user from Neo4j
    let mut params = HashMap::new();
    params.insert(
        "username".to_string(),
        serde_json::Value::String(login_req.username.clone()),
    );

    let rows = match graph
        .execute(
            neo4rs::query("MATCH (n:Person) WHERE n.username = $username RETURN n.password")
                .param("username", login_req.username.clone()),
        )
        .await
    {
        Ok(mut result) => {
            let mut rows = Vec::new();
            while let Some(row) = result.next().await.map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "internal server error".to_string(),
                    }),
                )
            })? {
                rows.push(row);
            }
            rows
        }
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "internal server error".to_string(),
                }),
            ));
        }
    };

    if rows.len() != 1 {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Username and password combo not found!".to_string(),
            }),
        ));
    }

    let stored_password: String = match rows[0].get("n.password") {
        Ok(password) => password,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "internal server error".to_string(),
                }),
            ));
        }
    };

    // Verify password
    match verify_password(&login_req.password, &stored_password) {
        Ok(true) => {
            // Generate JWT token
            match generate_token(&login_req.username) {
                Ok(token) => Ok(Json(AuthResponse { token })),
                Err(_) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "internal server error".to_string(),
                    }),
                )),
            }
        }
        Ok(false) => Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "invalid username or password".to_string(),
            }),
        )),
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "internal server error".to_string(),
            }),
        )),
    }
}

pub async fn signup(
    State(graph): State<Graph>,
    Json(signup_req): Json<SignUpRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Validate request
    if let Err(_) = signup_req.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid request".to_string(),
            }),
        ));
    }

    // Check if username or phone already exists
    let rows = match graph
        .execute(
            neo4rs::query(
                "MATCH (n:Person) WHERE n.phone = $phone OR n.username = $username RETURN n",
            )
            .param("username", signup_req.username.clone())
            .param("phone", signup_req.phone.clone()),
        )
        .await
    {
        Ok(mut result) => {
            let mut rows = Vec::new();
            while let Some(row) = result.next().await.map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "internal server error".to_string(),
                    }),
                )
            })? {
                rows.push(row);
            }
            rows
        }
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "internal server error".to_string(),
                }),
            ));
        }
    };

    if !rows.is_empty() {
        return Err((
            StatusCode::NOT_ACCEPTABLE,
            Json(ErrorResponse {
                error: "Username or phone number already exists!".to_string(),
            }),
        ));
    }

    // Hash password
    let hashed_password = match hash_password(&signup_req.password) {
        Ok(hash) => hash,
        Err(_) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "internal server error".to_string(),
                }),
            ));
        }
    };

    // Create user
    match graph
        .run(
            neo4rs::query(
                "CREATE (p:Person:L3 { username: $username, password: $password, phone: $phone })",
            )
            .param("username", signup_req.username.clone())
            .param("password", hashed_password)
            .param("phone", signup_req.phone.clone()),
        )
        .await
    {
        Ok(_) => {
            // Generate JWT token
            match generate_token(&signup_req.username) {
                Ok(token) => Ok(Json(AuthResponse { token })),
                Err(_) => Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "internal server error".to_string(),
                    }),
                )),
            }
        }
        Err(_) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "internal server error".to_string(),
            }),
        )),
    }
}
