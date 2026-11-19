//importing a resume: the person uploads a PDF, atlas-jobs' resume_import job reads it for the skills and knowledge it
//shows and the noteworthy things they achieved (for a credit, given back if it fails), and the person changes and
//confirms what it found. Confirming places them on each skill and topic at the level they chose, makes the ones we
//don't have yet, keeps the resume as evidence about each, and adds each achievement they kept as an Achievement that
//demonstrates the skills and topics it shows. What it found is kept on the Person until they confirm or discard it. See
//documentation/architecture/resume_import.md
use std::collections::{HashMap, HashSet};

use atlas_shared::{resume::{Found, Read}, skills::resolver as skill_resolver, topics::resolver as topic_resolver};
use axum::{Json, Router, extract::State, http::StatusCode, routing::{get, post}};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{
    achievements,
    auth::AuthUser,
    credits::{refund, spend},
    domains::{skills, topics},
    evidence::{self, About, Uploaded},
    helpers::jobs::queue,
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_import).delete(discard))
        .route("/uploads", post(start_upload))
        .route("/read", post(read))
        .route("/confirm", post(confirm))
}

//the import's properties on the Person, which credits are spent and given back by
const FEATURE: &str = "resumeImport";
//how long a resume asked to be read is taken to be on its way. A job that hasn't read it by then has failed
const READING_MINUTES: i64 = 10;
const PDF: &str = "application/pdf";
//where the resume's evidence and achievements come from, so a newer resume replaces an older one's
const SOURCE: &str = "resume";
const MAX_FILE_NAME_CHARS: usize = 200;

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn bad_request(message: &str) -> (StatusCode, String) {
    (StatusCode::BAD_REQUEST, message.to_string())
}

//the import as it's kept on the person
#[derive(Deserialize)]
struct Kept {
    key: Option<String>,
    file_name: Option<String>,
    size: Option<i64>,
    found: Option<String>, //json, once it's read
    reading: bool,
    asked: bool, //whether it was asked for since it was last read
    charged: bool, //whether a credit was spent on the last ask, and not given back yet
}

//the import as it's kept on the person. A credit spent on one that couldn't be read goes back here, which covers a job
//that never ran as well as one that failed
async fn kept(graph: &Graph, person_id: &str) -> Result<Kept, (StatusCode, String)> {
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        WITH p, p.resumeImportAskedAt AS asked,
             coalesce(p.resumeImportAt, datetime({year: 1})) AS read,
             coalesce(p.resumeImportFailedAt, datetime({year: 1})) AS failed
        RETURN p.resumeImportKey AS key, p.resumeImportFileName AS file_name, p.resumeImportSize AS size,
               p.resumeImport AS found,
               coalesce(asked > read AND asked > failed AND asked > datetime() - duration({minutes: $minutes}), false) AS reading,
               coalesce(asked > read, false) AS asked,
               coalesce(p.resumeImportCharged, false) AS charged
    ").param("personId", person_id).param("minutes", READING_MINUTES)).await.map_err(internal)?;
    let mut kept = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?
        .to::<Kept>().map_err(internal)?;
    if kept.charged && kept.asked && !kept.reading {
        refund(graph, person_id, FEATURE).await.map_err(internal)?;
        kept.charged = false;
    }
    Ok(kept)
}

//a skill or topic the resume shows, with the person's level in it now
#[derive(Serialize)]
pub struct Shown {
    index: usize, //which one it is, for confirming
    #[serde(flatten)]
    found: Found,
    existing_name: Option<String>, //the name of the skill or topic it is, when we have it
    current_rank: Option<i64>, //the level they're at in it already, if they've placed themselves on it
}

//something noteworthy the resume shows they did, with the skills and topics it shows
#[derive(Serialize)]
pub struct ShownAchievement {
    index: usize, //which one it is, for confirming
    title: String,
    description: String,
    year: Option<i64>,
    shows: Vec<usize>, //the indexes of the skills and topics it shows, in found
    on_profile: bool, //whether they have it already, by its title
}

//a skill or topic an earlier resume showed and this one doesn't
#[derive(Serialize, Deserialize)]
pub struct Dropped {
    id: String,
    name: String,
    kind: String, //skill or topic
}

//what earlier resumes added that this one doesn't show. It all stays on their profile
#[derive(Serialize, Default)]
pub struct NotOnThisResume {
    skills_and_topics: Vec<Dropped>,
    achievements: Vec<String>, //their titles
}

//where the import is at, and what it found once it's read
#[derive(Serialize)]
pub struct Import {
    status: &'static str, //none, reading, ready or failed
    file_name: Option<String>,
    found: Vec<Shown>,
    achievements: Vec<ShownAchievement>,
    not_on_this_resume: NotOnThisResume,
}

//what it found, with the person's level in each now and the names of the ones we have
async fn shown(graph: &Graph, person_id: &str, found: Vec<Found>) -> Result<Vec<Shown>, (StatusCode, String)> {
    let ids: Vec<String> = found.iter().filter_map(|f| f.id.clone()).collect();
    let mut rows = graph.execute(query("
        MATCH (p:Person {id: $personId})
        UNWIND $ids AS id
        OPTIONAL MATCH (n {id: id}) WHERE n:Skill OR n:Topic
        RETURN id, n.name AS name,
               CASE WHEN n:Skill THEN COLLECT { MATCH (p)-[:ACHIEVED]->(l:DreyfusLevel)<-[:HAS_LEVEL]-(n) RETURN max(l.rank) }[0]
                    ELSE COLLECT { MATCH (p)-[:ENGAGES_TOPIC]->(l:BloomLevel)<-[:HAS_LEVEL]-(n) RETURN max(l.rank) }[0] END AS rank
    ").param("personId", person_id).param("ids", ids)).await.map_err(internal)?;
    let mut known = std::collections::HashMap::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        let id: String = row.get("id").map_err(internal)?;
        let name: Option<String> = row.get("name").map_err(internal)?;
        let rank: Option<i64> = row.get("rank").map_err(internal)?;
        known.insert(id, (name, rank));
    }
    Ok(found.into_iter().enumerate().map(|(index, mut found)| {
        let (existing_name, current_rank) = match found.id.as_ref().and_then(|id| known.get(id)) {
            Some((Some(name), rank)) => (Some(name.clone()), *rank),
            //one that's gone since it was read is made again on confirming
            _ => {
                found.id = None;
                (None, None)
            }
        };
        Shown { index, found, existing_name, current_rank }
    }).collect())
}

async fn import(graph: &Graph, person_id: &str) -> Result<Import, (StatusCode, String)> {
    let kept = kept(graph, person_id).await?;
    let status = if kept.reading {
        "reading"
    } else if kept.asked {
        "failed"
    } else if kept.found.is_some() {
        "ready"
    } else {
        "none"
    };
    let (found, achievements, not_on_this_resume) = match (status, kept.found) {
        ("ready", Some(read)) => {
            let read: Read = serde_json::from_str(&read).map_err(internal)?;
            let have = achievements::titles(graph, person_id, None).await.map_err(internal)?;
            let has = |title: &str| have.iter().any(|(_, t)| t.eq_ignore_ascii_case(title));
            let shown_achievements: Vec<ShownAchievement> = read.achievements.into_iter().enumerate().map(|(index, a)| ShownAchievement {
                on_profile: has(&a.title), index, title: a.title, description: a.description, year: a.year, shows: a.shows,
            }).collect();
            let found = shown(graph, person_id, read.found).await?;
            let dropped = not_on_this_resume(graph, person_id, &found, &shown_achievements).await?;
            (found, shown_achievements, dropped)
        }
        _ => (Vec::new(), Vec::new(), NotOnThisResume::default()),
    };
    Ok(Import { status, file_name: kept.file_name, found, achievements, not_on_this_resume })
}

//the skills and topics an earlier resume is evidence about, and the achievements earlier resumes added, that this one
//doesn't show
async fn not_on_this_resume(graph: &Graph, person_id: &str, found: &[Shown], read: &[ShownAchievement]) -> Result<NotOnThisResume, (StatusCode, String)> {
    let shown_ids: Vec<String> = found.iter().filter_map(|s| s.found.id.clone()).collect();
    let mut rows = graph.execute(query("
        MATCH (:Person {id: $personId})-[:GAVE_EVIDENCE]->(:Evidence {source: $source})-[:ABOUT]->(n)
        WHERE (n:Skill OR n:Topic) AND NOT n.id IN $shown
        WITH DISTINCT n
        RETURN n.id AS id, n.name AS name, CASE WHEN n:Skill THEN 'skill' ELSE 'topic' END AS kind
        ORDER BY kind, name
    ").param("personId", person_id).param("source", SOURCE).param("shown", shown_ids)).await.map_err(internal)?;
    let mut skills_and_topics = Vec::new();
    while let Some(row) = rows.next().await.map_err(internal)? {
        skills_and_topics.push(row.to::<Dropped>().map_err(internal)?);
    }
    drop(rows);
    let achievements = achievements::titles(graph, person_id, Some(SOURCE)).await.map_err(internal)?.into_iter()
        .map(|(_, title)| title)
        .filter(|title| !read.iter().any(|a| a.title.eq_ignore_ascii_case(title)))
        .collect();
    Ok(NotOnThisResume { skills_and_topics, achievements })
}

//the logged in user's import, and where it's at
async fn get_import(State(state): State<AppState>, user: AuthUser) -> Result<Json<Import>, (StatusCode, String)> {
    Ok(Json(import(&state.graph, &user.person_id).await?))
}

#[derive(Deserialize)]
struct UploadRequest {
    size: i64,
}

//a url to upload the resume to, a PDF. Reading it is asked for with POST /read once it's in
async fn start_upload(State(state): State<AppState>, user: AuthUser, Json(req): Json<UploadRequest>) -> Result<Json<evidence::Upload>, (StatusCode, String)> {
    Ok(Json(evidence::presign_upload(&state, &user.person_id, PDF, req.size).await?))
}

#[derive(Deserialize)]
struct ReadRequest {
    upload_id: String,
    file_name: String,
}

//what atlas-jobs' resume_import job is sent
#[derive(Serialize)]
struct ImportJob<'a> {
    person_id: &'a str,
    key: &'a str,
}

//asks for the resume the person uploaded to be read, for a credit, in place of any import they hadn't confirmed
async fn read(State(state): State<AppState>, user: AuthUser, Json(req): Json<ReadRequest>) -> Result<Json<Import>, (StatusCode, String)> {
    let file_name = req.file_name.trim();
    if file_name.is_empty() || file_name.chars().count() > MAX_FILE_NAME_CHARS {
        return Err(bad_request(&format!("Give the file a name of {MAX_FILE_NAME_CHARS} characters or fewer.")));
    }
    let file = evidence::uploaded(&state, &user.person_id, &req.upload_id).await?;
    if file.content_type != PDF {
        evidence::delete_files(&state, &[file.key]).await;
        return Err(bad_request("Your resume needs to be a PDF."));
    }
    let current = kept(&state.graph, &user.person_id).await?;
    if current.reading {
        evidence::delete_files(&state, &[file.key]).await;
        return Err((StatusCode::CONFLICT, "I'm still reading your last resume. Give me a moment.".to_string()));
    }

    spend(&state, &user.person_id, FEATURE).await?;
    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        SET p.resumeImportKey = $key, p.resumeImportFileName = $fileName, p.resumeImportSize = $size
        REMOVE p.resumeImport, p.resumeImportAt
    ").param("personId", user.person_id.as_str()).param("key", file.key.as_str()).param("fileName", file_name).param("size", file.size))
        .await.map_err(internal)?;
    //the last resume is only kept where it's evidence
    if let Some(old) = current.key.filter(|old| *old != file.key) {
        evidence::delete_files(&state, &[old]).await;
    }
    if let Err(e) = queue(&state, "resume_import", ImportJob { person_id: &user.person_id, key: &file.key }).await {
        tracing::error!("couldn't queue the resume import: {e}");
        state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.resumeImportFailedAt = datetime()").param("personId", user.person_id.as_str()))
            .await.map_err(internal)?;
        refund(&state.graph, &user.person_id, FEATURE).await.map_err(internal)?;
    }
    Ok(Json(import(&state.graph, &user.person_id).await?))
}

//one of what the resume showed that the person is adding, at the level they chose
#[derive(Deserialize)]
struct Chosen {
    index: usize,
    rank: i64,
}

#[derive(Deserialize)]
struct ConfirmRequest {
    chosen: Vec<Chosen>,
    #[serde(default)]
    achievements: Vec<usize>, //the indexes of the achievements they're keeping
}

//how many skills and topics the person was placed on, and how many achievements were added
#[derive(Serialize)]
struct Confirmed {
    skills: usize,
    topics: usize,
    achievements: usize,
}

//places the person on what they chose of what the resume showed, at the levels they chose, making the skills and topics
//we don't have yet, and keeps the resume as evidence about each. The import is done with after
async fn confirm(State(state): State<AppState>, user: AuthUser, Json(req): Json<ConfirmRequest>) -> Result<Json<Confirmed>, (StatusCode, String)> {
    let kept = kept(&state.graph, &user.person_id).await?;
    let (Some(found), Some(key), Some(file_name)) = (kept.found.filter(|_| !kept.reading && !kept.asked), kept.key, kept.file_name) else {
        return Err(bad_request("There's no resume read to confirm. Upload it again."));
    };
    let read: Read = serde_json::from_str(&found).map_err(internal)?;
    let accomplished = read.achievements;
    let found = shown(&state.graph, &user.person_id, read.found).await?;
    if req.achievements.iter().any(|i| *i >= accomplished.len()) {
        return Err(bad_request("That isn't one of the achievements your resume showed."));
    }

    //this resume replaces the earlier ones as the evidence about everything it shows, so each has one resume at most.
    //What only an earlier resume shows keeps that one
    let shown_ids: Vec<String> = found.iter().filter_map(|s| s.found.id.clone()).collect();
    let replaced = evidence::remove_from_source(&state.graph, &user.person_id, SOURCE, &shown_ids).await.map_err(internal)?;

    let mut seen = HashSet::new();
    let mut chosen = Vec::new();
    for c in &req.chosen {
        let shown = found.get(c.index).ok_or_else(|| bad_request("That isn't one of what your resume showed."))?;
        let top = if shown.found.kind == "skill" { 5 } else { 6 };
        if !(1..=top).contains(&c.rank) {
            return Err(bad_request("Pick one of its levels."));
        }
        if seen.insert(c.index) {
            chosen.push((c.index, &shown.found, c.rank));
        }
    }

    //the ones we don't have are made, each once, the way asking for it makes it
    let ids = futures::future::join_all(chosen.iter().map(|(_, f, _)| id(&state, f))).await;
    let file = Uploaded { key: key.clone(), size: kept.size.unwrap_or_default(), content_type: PDF.to_string() };
    let mut confirmed = Confirmed { skills: 0, topics: 0, achievements: 0 };
    let mut placed_on = HashMap::new(); //the id of each skill and topic they were placed on, by its index in found
    for ((index, f, rank), id) in chosen.iter().zip(ids) {
        let id = match id {
            Ok(id) => id,
            Err(e) => {
                tracing::error!(name = f.name, "couldn't find or make what the resume showed: {e}");
                continue;
            }
        };
        let skill = f.kind == "skill";
        let placed = if skill {
            skills::set_person_level(&state.graph, &user.person_id, &id, *rank, None).await
        } else {
            topics::set_person_level(&state.graph, &user.person_id, &id, *rank).await
        };
        placed.map_err(internal)?;
        let about = About { label: if skill { "Skill" } else { "Topic" }, id: &id };
        evidence::attach_file(&state.graph, &user.person_id, about, &file, &file_name, SOURCE).await.map_err(internal)?;
        //a new one's levels are written now, so they can read where they are
        let filled = if skill { skills::fill_stub(&state, &id).await } else { topics::fill_stub(&state, &id).await };
        if let Err((_, e)) = filled {
            tracing::error!(id, "couldn't ask for a fill: {e}");
        }
        if skill { confirmed.skills += 1 } else { confirmed.topics += 1 }
        placed_on.insert(*index, (skill, id));
    }
    //what they didn't add again, because they're on it already, gets this resume in place of the earlier one
    for id in &replaced.about {
        if placed_on.values().any(|(_, placed)| placed == id) {
            continue;
        }
        let Some(shown) = found.iter().find(|s| s.found.id.as_ref() == Some(id)) else { continue };
        let about = About { label: if shown.found.kind == "skill" { "Skill" } else { "Topic" }, id };
        evidence::attach_file(&state.graph, &user.person_id, about, &file, &file_name, SOURCE).await.map_err(internal)?;
    }

    //each achievement they kept demonstrates the skills and topics it shows that they added. One that shows none of
    //those has nothing to stand on, so it's left out
    for i in req.achievements.iter().collect::<HashSet<_>>() {
        let a = &accomplished[*i];
        let on: Vec<&(bool, String)> = a.shows.iter().filter_map(|s| placed_on.get(s)).collect();
        if on.is_empty() {
            continue;
        }
        let skill_ids: Vec<String> = on.iter().filter(|(skill, _)| *skill).map(|(_, id)| id.clone()).collect();
        let topic_ids: Vec<String> = on.iter().filter(|(skill, _)| !*skill).map(|(_, id)| id.clone()).collect();
        achievements::add(&state.graph, &user.person_id, SOURCE, &a.title, &a.description, a.year, &skill_ids, &topic_ids).await.map_err(internal)?;
        confirmed.achievements += 1;
    }
    tracing::info!(skills = confirmed.skills, topics = confirmed.topics, achievements = confirmed.achievements, "confirmed a resume import");

    evidence::delete_files(&state, &replaced.keys).await;
    done(&state, &user.person_id, &key).await?;
    Ok(Json(confirmed))
}

//the id of the skill or topic, made as a stub when we don't have it
async fn id(state: &AppState, f: &Found) -> Result<String, atlas_shared::BoxError> {
    if let Some(id) = &f.id {
        return Ok(id.clone());
    }
    Ok(if f.kind == "skill" {
        match skill_resolver::resolve(&state.graph, &state.bedrock, &f.name, &f.description).await? {
            (skill_resolver::Resolution::Same { skill_id }, _) => skill_id,
            (skill_resolver::Resolution::New { broader, narrower }, vector) => {
                skill_resolver::create_stub(&state.graph, &state.bus, &f.name, &f.description, vector, &broader, &narrower).await?
            }
        }
    } else {
        match topic_resolver::resolve(&state.graph, &state.bedrock, &f.name, &f.description).await? {
            (topic_resolver::Resolution::Same { topic_id }, _) => topic_id,
            (topic_resolver::Resolution::New { broader, narrower }, vector) => {
                topic_resolver::create_stub(&state.graph, &state.bus, &f.name, &f.description, vector, &broader, &narrower).await?
            }
        }
    })
}

//forgets the import, and the resume unless it's evidence. The read it was is over, so the credit spent on it stays spent
async fn done(state: &AppState, person_id: &str, key: &str) -> Result<(), (StatusCode, String)> {
    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        SET p.resumeImportCharged = false
        REMOVE p.resumeImport, p.resumeImportAt, p.resumeImportKey, p.resumeImportFileName, p.resumeImportSize,
               p.resumeImportAskedAt, p.resumeImportFailedAt
    ").param("personId", person_id)).await.map_err(internal)?;
    evidence::delete_files(state, &[key.to_string()]).await;
    Ok(())
}

//throws away what the resume showed, without adding any of it
async fn discard(State(state): State<AppState>, user: AuthUser) -> Result<StatusCode, (StatusCode, String)> {
    let kept = kept(&state.graph, &user.person_id).await?;
    if kept.reading {
        return Err((StatusCode::CONFLICT, "I'm still reading your resume. Give me a moment.".to_string()));
    }
    if let Some(key) = kept.key {
        done(&state, &user.person_id, &key).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}
