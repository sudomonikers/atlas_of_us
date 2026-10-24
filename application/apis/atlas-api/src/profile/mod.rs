//Profiles: what a person shares about themselves at /u/{username}, gathered from each part of the Atlas they've been
//mapped on. Each part's module owns its data, and this one decides who gets to see it
use axum::{Json, Router, extract::{Path, State}, http::StatusCode, response::Html, routing::get};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, domains::personality, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().route("/{username}", get(get_profile))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

#[derive(Deserialize)]
struct Person {
    id: String,
    username: String,
    first_name: String,
    public: bool,
}

//the person with the username, if the viewer may see them: anyone for a public profile, only its owner for a private one
async fn find_person(graph: &Graph, username: &str, viewer_id: &str) -> Result<Option<Person>, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {username: toLower($username)})
        WHERE coalesce(p.public, false) OR p.id = $viewerId
        RETURN p.id AS id, p.username AS username, p.firstName AS first_name, coalesce(p.public, false) AS public
    ")
        .param("username", username)
        .param("viewerId", viewer_id)
    ).await.map_err(internal)?;
    rows.next().await.map_err(internal)?.map(|row| row.to::<Person>()).transpose().map_err(internal)
}

#[derive(Serialize)]
pub struct Profile {
    username: String,
    first_name: String,
    public: bool,
    personality: personality::PersonPersonality,
}

//someone's profile. Private ones are only seen by their owner, and look missing to everyone else
pub async fn get_profile(
    State(state): State<AppState>,
    user: Option<AuthUser>,
    Path(username): Path<String>,
) -> Result<Json<Profile>, (StatusCode, String)> {
    let viewer_id = user.map(|u| u.person_id).unwrap_or_default();
    let Some(person) = find_person(&state.graph, &username, &viewer_id).await? else {
        return Err((StatusCode::NOT_FOUND, "This profile is private or doesn't exist.".to_string()));
    };
    Ok(Json(Profile {
        personality: personality::person_personality(&state.graph, &person.id).await?,
        username: person.username,
        first_name: person.first_name,
        public: person.public,
    }))
}

//where share links and their preview image live
const SITE: &str = "https://atlas-of-us.com";

//the page a shared profile link opens, at /share/{username}. Sites like LinkedIn and X don't run javascript, so they'd only
//see the ui's bare index.html: this gives them a preview card, then sends people on to the profile itself. Only public
//profiles get their name and headline on it
pub async fn share_page(State(state): State<AppState>, Path(username): Path<String>) -> Result<Html<String>, (StatusCode, String)> {
    let (title, description) = match find_person(&state.graph, &username, "").await? {
        Some(person) => {
            let personality = personality::person_personality(&state.graph, &person.id).await?;
            let first_name = person.first_name;
            let description = personality.headline().map_or_else(|| format!("See how {first_name} maps out on Atlas Of Us."), str::to_string);
            (format!("This Is {first_name}"), description)
        }
        None => ("Atlas Of Us".to_string(), "Map your personality, one scenario at a time.".to_string()),
    };
    let (title, description, username) = (escape(&title), escape(&description), escape(&username));
    let url = format!("{SITE}/share/{username}");
    Ok(Html(format!(r#"<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title} | Atlas Of Us</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Atlas Of Us">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=/u/{username}">
</head>
<body><a href="/u/{username}">{title}</a></body>
</html>"#)))
}

fn escape(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&#39;")
}
