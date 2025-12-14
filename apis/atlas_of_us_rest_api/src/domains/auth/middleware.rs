use crate::domains::auth::models::JwtClaims;
use axum::{
    extract::Request,
    http::{StatusCode, header::AUTHORIZATION},
    middleware::Next,
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};

pub async fn jwt_auth_middleware(
    req: Request,
    next: Next,
) -> Result<axum::response::Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let token = match auth_header {
        Some(auth) => {
            if auth.starts_with("Bearer ") {
                auth.strip_prefix("Bearer ").unwrap_or("")
            } else {
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());

    let validation = Validation::new(Algorithm::HS256);
    match decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &validation,
    ) {
        Ok(_token_data) => {
            Ok(next.run(req).await)
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}
