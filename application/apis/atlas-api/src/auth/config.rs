//A person's settings in the app, such as which intros they've seen and which notes they've turned off. Each person has
//one, on a PersonConfig node made the first time they change something, and a setting they've never changed reads as
//its default. It comes with the person when they log in, create an account or check their session, and every module
//changes its settings through PATCH /auth/config
use axum::{Json, extract::State, http::StatusCode};
use neo4rs::query;
use serde::{Deserialize, Serialize};

use super::AuthUser;
use crate::state::AppState;

#[derive(Serialize, Deserialize, Default)]
pub struct Config {
    physical_intro_seen: bool, //whether they've been through the story that opens Physical Traits
    personality_intro_seen: bool, //whether they've been through the story that opens Personality
    scene_start_note_hidden: bool, //whether they've turned off the note on getting the most out of a scene
    support_asked: bool, //whether they've been asked to chip in, which happens once, when their first report is written
}

//the settings to change. Any left out keep their value, and a setting that doesn't exist is refused
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConfigChanges {
    physical_intro_seen: Option<bool>,
    personality_intro_seen: Option<bool>,
    scene_start_note_hidden: Option<bool>,
    support_asked: Option<bool>,
}

//every setting, as columns read from the PersonConfig c, with its default where it's never been set or c is missing.
//Added to a query's RETURN to read a Config from its row
pub const CONFIG_COLUMNS: &str = "
    coalesce(c.physicalIntroSeen, false) AS physical_intro_seen,
    coalesce(c.personalityIntroSeen, false) AS personality_intro_seen,
    coalesce(c.sceneStartNoteHidden, false) AS scene_start_note_hidden,
    coalesce(c.supportAsked, false) AS support_asked
";

//changes some of the logged in person's settings, and gives back all of them
pub async fn update_config(
    State(state): State<AppState>,
    user: AuthUser,
    Json(changes): Json<ConfigChanges>,
) -> Result<Json<Config>, (StatusCode, String)> {
    let internal = |e: &dyn std::fmt::Display| {
        tracing::error!("{e}");
        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
    };
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $id}})
        MERGE (p)-[:HAS_CONFIG]->(c:PersonConfig)
        SET c.physicalIntroSeen = coalesce($physicalIntroSeen, c.physicalIntroSeen),
            c.personalityIntroSeen = coalesce($personalityIntroSeen, c.personalityIntroSeen),
            c.sceneStartNoteHidden = coalesce($sceneStartNoteHidden, c.sceneStartNoteHidden),
            c.supportAsked = coalesce($supportAsked, c.supportAsked)
        RETURN {CONFIG_COLUMNS}
    "))
        .param("id", user.person_id)
        .param("physicalIntroSeen", changes.physical_intro_seen)
        .param("personalityIntroSeen", changes.personality_intro_seen)
        .param("sceneStartNoteHidden", changes.scene_start_note_hidden)
        .param("supportAsked", changes.support_asked)
    ).await.map_err(|e| internal(&e))?;
    let row = rows.next().await.map_err(|e| internal(&e))?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Your session has expired. Please log in again.".to_string()))?;
    Ok(Json(row.to::<Config>().map_err(|e| internal(&e))?))
}
