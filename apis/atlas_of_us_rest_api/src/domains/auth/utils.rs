use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::domains::auth::models::JwtClaims;

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(password_hash.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(hash)?;
    let argon2 = Argon2::default();
    match argon2.verify_password(password.as_bytes(), &parsed_hash) {
        Ok(()) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false),
        Err(e) => Err(e),
    }
}

pub fn generate_token(username: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs() as usize;
    
    // Token expires in 24 hours (24 * 60 minutes as in Go version)
    let expiration = now + (24 * 60 * 60);
    
    let claims = JwtClaims {
        sub: username.to_string(),
        iss: username.to_string(), // For compatibility with Go version
        exp: expiration,
        iat: now,
    };

    let header = Header::new(Algorithm::HS256);
    encode(&header, &claims, &EncodingKey::from_secret(jwt_secret.as_bytes()))
}

pub fn generate_random_key() -> String {
    use argon2::password_hash::rand_core::RngCore;
    use base64::Engine;
    let mut key = [0u8; 32]; // 256-bit key
    OsRng.fill_bytes(&mut key);
    base64::engine::general_purpose::STANDARD.encode(&key)
}