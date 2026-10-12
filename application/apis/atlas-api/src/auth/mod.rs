use std::env;

use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use axum::{
    Json, Router,
    extract::{FromRequestParts, State},
    http::{StatusCode, header::AUTHORIZATION, request::Parts},
    routing::{get, post},
};
use chrono::{DateTime, Datelike, Duration, NaiveDate, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/create-user", post(create_user))
        .route("/login", post(login))
        .route("/logout", post(logout))
        .route("/me", get(me))
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, //the Person's id
    iat: i64,
    exp: i64,
}

//the logged in user. Add it as a handler argument to require a valid token
pub struct AuthUser {
    pub person_id: String,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let rejected = || (StatusCode::UNAUTHORIZED, "missing or invalid token".to_string());
        let token = parts.headers.get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or_else(rejected)?;
        let secret = env::var("JWT_SECRET").map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "JWT_SECRET is not set".to_string()))?;
        //checks the signature and expiry
        let data = decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::new(Algorithm::HS256))
            .map_err(|_| rejected())?;
        Ok(AuthUser { person_id: data.claims.sub })
    }
}

#[derive(Serialize, Deserialize)]
pub struct Person {
    id: String,
    phone: String,
    first_name: String,
    last_name: String,
    email: String,
    birthday: NaiveDate,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    expires_at: DateTime<Utc>,
    person: Person,
}

//signs a 24 hour token for the person. Logout is stateless, so tokens are kept short lived
fn authenticate(person: Person) -> Result<AuthResponse, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());
    let secret = env::var("JWT_SECRET").map_err(|_| internal(&"JWT_SECRET is not set"))?;
    let now = Utc::now();
    let expires_at = now + Duration::hours(24);
    let claims = Claims { sub: person.id.clone(), iat: now.timestamp(), exp: expires_at.timestamp() };
    let token = encode(&Header::new(Algorithm::HS256), &claims, &EncodingKey::from_secret(secret.as_bytes()))
        .map_err(|e| internal(&e))?;
    Ok(AuthResponse { token, expires_at, person })
}

//E.164: + then 8-15 digits starting with a country code. Spaces, dashes, dots and brackets are ignored
fn normalize_phone(raw: &str) -> Result<String, (StatusCode, String)> {
    let phone: String = raw.chars().filter(|c| !matches!(c, ' ' | '-' | '.' | '(' | ')')).collect();
    match phone.strip_prefix('+') {
        Some(d) if (8..=15).contains(&d.len()) && d.chars().all(|c| c.is_ascii_digit()) && !d.starts_with('0') => Ok(phone),
        _ => Err((StatusCode::BAD_REQUEST, "phone number must start with + and a country code, e.g. +15551234567".to_string())),
    }
}

#[derive(Deserialize)]
pub struct CreateUserPayload {
    phone: String,
    password: String,
    first_name: String,
    last_name: String,
    birthday: String, //YYYY-MM-DD
    email: String,
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(body): Json<CreateUserPayload>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());
    let bad = |message: &str| (StatusCode::BAD_REQUEST, message.to_string());

    let phone = normalize_phone(&body.phone)?;
    let email = body.email.trim().to_lowercase();
    let first_name = body.first_name.trim().to_string();
    let last_name = body.last_name.trim().to_string();
    let birthday = NaiveDate::parse_from_str(body.birthday.trim(), "%Y-%m-%d")
        .map_err(|_| bad("birthday must be a date formatted YYYY-MM-DD"))?;

    let email_valid = email.split_once('@')
        .is_some_and(|(local, domain)| !local.is_empty() && domain.contains('.') && !domain.contains('@'));
    if !email_valid || email.contains(char::is_whitespace) {
        return Err(bad("email address is not valid"));
    }
    if first_name.is_empty() || last_name.is_empty() || first_name.len() > 100 || last_name.len() > 100 {
        return Err(bad("first and last name must be between 1 and 100 characters"));
    }
    if birthday.year() < 1900 || birthday > Utc::now().date_naive() {
        return Err(bad("birthday must be between 1900 and today"));
    }
    if !(8..=128).contains(&body.password.chars().count()) {
        return Err(bad("password must be between 8 and 128 characters"));
    }

    //argon2 is deliberately slow, so it runs off the async runtime
    let password = body.password;
    let password_hash = tokio::task::spawn_blocking(move || {
        Argon2::default().hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng)).map(|h| h.to_string())
    }).await.map_err(|e| internal(&e))?.map_err(|e| internal(&e))?;

    let created = state.graph.execute(query("
        CREATE (p:Person {
            phone: $phone, firstName: $firstName, lastName: $lastName,
            email: $email, birthday: $birthday, passwordHash: $passwordHash, createdDate: datetime()
        })
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name,
               p.email AS email, p.birthday AS birthday
    ")
        .param("phone", phone)
        .param("firstName", first_name)
        .param("lastName", last_name)
        .param("email", email)
        .param("birthday", birthday)
        .param("passwordHash", password_hash)
    ).await;

    //the Person uniqueness constraints reject a phone or email that's already taken
    let mut rows = match created {
        Ok(rows) => rows,
        Err(neo4rs::Error::Neo4j(e)) if e.code() == "Neo.ClientError.Schema.ConstraintValidationFailed" => {
            return Err((StatusCode::CONFLICT, "an account with that phone number or email already exists".to_string()));
        }
        Err(e) => return Err(internal(&e)),
    };

    let row = rows.next().await.map_err(|e| internal(&e))?.ok_or_else(|| internal(&"person was not created"))?;
    let person = row.to::<Person>().map_err(|e| internal(&e))?;
    Ok((StatusCode::CREATED, Json(authenticate(person)?)))
}

#[derive(Deserialize)]
pub struct LoginPayload {
    phone: String,
    password: String,
}

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginPayload>,
) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());
    let phone = normalize_phone(&body.phone)?;

    let mut rows = state.graph.execute(query("
        MATCH (p:Person {phone: $phone})
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name,
               p.email AS email, p.birthday AS birthday, p.passwordHash AS password_hash
    ")
        .param("phone", phone)
    ).await.map_err(|e| internal(&e))?;
    let invalid = || (StatusCode::UNAUTHORIZED, "invalid phone number or password".to_string());
    let row = rows.next().await.map_err(|e| internal(&e))?.ok_or_else(invalid)?;

    //argon2 is deliberately slow, so it runs off the async runtime
    let hash = row.get::<String>("password_hash").map_err(|e| internal(&e))?;
    let password = body.password;
    let matches = tokio::task::spawn_blocking(move || {
        PasswordHash::new(&hash).is_ok_and(|parsed| Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok())
    }).await.map_err(|e| internal(&e))?;

    if !matches {
        return Err(invalid());
    }
    let person = row.to::<Person>().map_err(|e| internal(&e))?;
    Ok(Json(authenticate(person)?))
}

//tokens are stateless, so logging out is the client throwing its token away. This gives the UI one place to call
pub async fn logout() -> StatusCode {
    StatusCode::NO_CONTENT
}

pub async fn me(State(state): State<AppState>, user: AuthUser) -> Result<Json<Person>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string());

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $id
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name,
               p.email AS email, p.birthday AS birthday
    ")
        .param("id", user.person_id)
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.to::<Person>().map_err(|e| internal(&e))?)),
        None => Err((StatusCode::UNAUTHORIZED, "missing or invalid token".to_string())), //token for a deleted Person
    }
}
