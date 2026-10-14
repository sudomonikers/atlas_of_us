use std::env;

use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use axum::{
    Json, Router,
    extract::{FromRequestParts, OptionalFromRequestParts, State},
    http::{StatusCode, request::Parts},
    routing::{get, post, put},
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
        .route("/public", put(set_public))
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, //the Person's id
    iat: i64,
    exp: i64,
}

const TOKEN_HEADER: &str = "x-atlas-token";

//the logged in user. Add it as a handler argument to require a valid token
pub struct AuthUser {
    pub person_id: String,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let rejected = || (StatusCode::UNAUTHORIZED, "Your session has expired. Please log in again.".to_string());
        let token = parts.headers.get(TOKEN_HEADER)
            .and_then(|value| value.to_str().ok())
            .ok_or_else(rejected)?;
        let secret = env::var("JWT_SECRET").map_err(|_| {
            tracing::error!("JWT_SECRET is not set");
            (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
        })?;
        //checks the signature and expiry
        let data = decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::new(Algorithm::HS256))
            .map_err(|_| rejected())?;
        Ok(AuthUser { person_id: data.claims.sub })
    }
}

//Option<AuthUser> for handlers anyone can call: None without a token, still rejected for a bad one
impl<S: Send + Sync> OptionalFromRequestParts<S> for AuthUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Option<Self>, Self::Rejection> {
        if !parts.headers.contains_key(TOKEN_HEADER) {
            return Ok(None);
        }
        <AuthUser as FromRequestParts<S>>::from_request_parts(parts, state).await.map(Some)
    }
}

//a logged in user whose Person has admin: true. Add it as a handler argument (or a route_layer) to require
//an admin. Checked against the graph on every request, so taking admin away works immediately
pub struct AdminUser {
    pub person_id: String,
}

impl FromRequestParts<AppState> for AdminUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let internal = |e: &dyn std::fmt::Display| {
            tracing::error!("{e}");
            (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
        };
        let user = <AuthUser as FromRequestParts<AppState>>::from_request_parts(parts, state).await?;
        let mut rows = state.graph.execute(query("
            MATCH (p:Person) WHERE elementId(p) = $id AND p.admin = true
            RETURN elementId(p) AS id
        ")
            .param("id", user.person_id.clone())
        ).await.map_err(|e| internal(&e))?;
        match rows.next().await.map_err(|e| internal(&e))? {
            Some(_) => Ok(AdminUser { person_id: user.person_id }),
            None => Err((StatusCode::FORBIDDEN, "You don't have access to that.".to_string())),
        }
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
    username: String,
    public: bool, //whether anyone can see their profile at /u/{username}
    admin: bool, //set by hand in the graph, unlocks /admin
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    expires_at: DateTime<Utc>,
    person: Person,
}

//signs a 24 hour token for the person. Logout is stateless, so tokens are kept short lived
fn authenticate(person: Person) -> Result<AuthResponse, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
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
        _ => Err((StatusCode::BAD_REQUEST, "That doesn't look like a valid phone number. Check the country code and number.".to_string())),
    }
}

//3-30 lowercase letters, digits, _ or -. No dots, so /u/{username} isn't mistaken for a file
fn normalize_username(raw: &str) -> Result<String, (StatusCode, String)> {
    let username = raw.trim().to_lowercase();
    if (3..=30).contains(&username.len()) && username.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-') {
        Ok(username)
    } else {
        Err((StatusCode::BAD_REQUEST, "Your username needs to be 3 to 30 letters, numbers, _ or -.".to_string()))
    }
}

//the Person uniqueness constraints reject a phone, email or username that's already taken.
//Neo4j can report it when the query is sent or when its row is read, so both go through this
fn constraint_failed(e: neo4rs::Error) -> (StatusCode, String) {
    match e {
        neo4rs::Error::Neo4j(e) if e.code() == "Neo.ClientError.Schema.ConstraintValidationFailed" => {
            let taken = ["email", "username"].into_iter().find(|f| e.message().contains(&format!("`{f}`"))).unwrap_or("phone number");
            (StatusCode::CONFLICT, format!("There's already an account with that {taken}."))
        }
        e => {
            tracing::error!("{e}");
            (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
        }
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
    username: String,
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(body): Json<CreateUserPayload>,
) -> Result<(StatusCode, Json<AuthResponse>), (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    let bad = |message: &str| (StatusCode::BAD_REQUEST, message.to_string());

    let phone = normalize_phone(&body.phone)?;
    let username = normalize_username(&body.username)?;
    let email = body.email.trim().to_lowercase();
    let first_name = body.first_name.trim().to_string();
    let last_name = body.last_name.trim().to_string();
    let birthday = NaiveDate::parse_from_str(body.birthday.trim(), "%Y-%m-%d")
        .map_err(|_| bad("That doesn't look like a valid birthday."))?;

    let email_valid = email.split_once('@')
        .is_some_and(|(local, domain)| !local.is_empty() && domain.contains('.') && !domain.contains('@'));
    if !email_valid || email.contains(char::is_whitespace) {
        return Err(bad("That doesn't look like a valid email address."));
    }
    if first_name.is_empty() || last_name.is_empty() || first_name.len() > 100 || last_name.len() > 100 {
        return Err(bad("First and last name need to be between 1 and 100 characters."));
    }
    if birthday.year() < 1900 || birthday > Utc::now().date_naive() {
        return Err(bad("Your birthday has to be between 1900 and today."));
    }
    if !(8..=128).contains(&body.password.chars().count()) {
        return Err(bad("Your password needs to be between 8 and 128 characters."));
    }

    //argon2 is deliberately slow, so it runs off the async runtime
    let password = body.password;
    let password_hash = tokio::task::spawn_blocking(move || {
        Argon2::default().hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng)).map(|h| h.to_string())
    }).await.map_err(|e| internal(&e))?.map_err(|e| internal(&e))?;

    let mut created = state.graph.execute(query("
        CREATE (p:Person {
            phone: $phone, firstName: $firstName, lastName: $lastName, email: $email, birthday: $birthday,
            username: $username, passwordHash: $passwordHash, createdDate: datetime()
        })
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name, p.email AS email,
               p.birthday AS birthday, p.username AS username, coalesce(p.public, false) AS public, coalesce(p.admin, false) AS admin
    ")
        .param("phone", phone)
        .param("username", username)
        .param("firstName", first_name)
        .param("lastName", last_name)
        .param("email", email)
        .param("birthday", birthday)
        .param("passwordHash", password_hash)
    ).await.map_err(constraint_failed)?;
    let row = created.next().await.map_err(constraint_failed)?.ok_or_else(|| internal(&"person was not created"))?;
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
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    let phone = normalize_phone(&body.phone)?;

    let mut rows = state.graph.execute(query("
        MATCH (p:Person {phone: $phone})
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name, p.email AS email,
               p.birthday AS birthday, p.username AS username, coalesce(p.public, false) AS public, coalesce(p.admin, false) AS admin, p.passwordHash AS password_hash
    ")
        .param("phone", phone)
    ).await.map_err(|e| internal(&e))?;
    let invalid = || (StatusCode::UNAUTHORIZED, "That phone number and password don't match an account.".to_string());
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
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };

    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $id
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name, p.email AS email,
               p.birthday AS birthday, p.username AS username, coalesce(p.public, false) AS public, coalesce(p.admin, false) AS admin
    ")
        .param("id", user.person_id)
    ).await.map_err(|e| internal(&e))?;

    match rows.next().await.map_err(|e| internal(&e))? {
        Some(row) => Ok(Json(row.to::<Person>().map_err(|e| internal(&e))?)),
        None => Err((StatusCode::UNAUTHORIZED, "Your session has expired. Please log in again.".to_string())), //token for a deleted Person
    }
}

#[derive(Deserialize)]
pub struct PublicPayload {
    public: bool,
}

//opts the person's profile in or out of being seen by anyone. Private until they turn it on
pub async fn set_public(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<PublicPayload>,
) -> Result<Json<Person>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    let mut rows = state.graph.execute(query("
        MATCH (p:Person) WHERE elementId(p) = $id
        SET p.public = $public
        RETURN elementId(p) AS id, p.phone AS phone, p.firstName AS first_name, p.lastName AS last_name, p.email AS email,
               p.birthday AS birthday, p.username AS username, coalesce(p.public, false) AS public, coalesce(p.admin, false) AS admin
    ")
        .param("id", user.person_id)
        .param("public", body.public)
    ).await.map_err(|e| internal(&e))?;
    let row = rows.next().await.map_err(|e| internal(&e))?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Your session has expired. Please log in again.".to_string()))?;
    Ok(Json(row.to::<Person>().map_err(|e| internal(&e))?))
}
