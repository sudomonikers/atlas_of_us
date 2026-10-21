use std::{env, time::Instant};

use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::Instrument;

use crate::personality_report;
use crate::personality_scoring::{BoxError, SCORING_PROMPT, ScoredAnswer, Shift, answer_json, invoke, save_traits};

//the person contesting one piece of evidence: explaining their answer, or saying the scorer got it wrong
#[derive(Serialize, Deserialize)]
struct Contest {
    r#trait: String,
    kind: Kind,
    message: String,
    at: String,
    status: Status,
    #[serde(skip_serializing_if = "Option::is_none")]
    reply: Option<String>, //the reviewer's answer to the person
    #[serde(skip_serializing_if = "Option::is_none")]
    before: Option<Shift>, //the evidence before an accepted contest changed it
    #[serde(skip_serializing_if = "Option::is_none")]
    after: Option<Shift>,
    #[serde(skip_serializing_if = "Option::is_none")]
    removed: Option<bool>, //the reviewer found the answer doesn't show the trait, so the evidence now has no weight
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Kind {
    Explain,
    Wrong,
}

#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum Status {
    Pending,
    Accepted,
    Rejected,
}

//a person's contest of one piece of evidence, with every answer in its scene for the reviewer to read
#[derive(Deserialize)]
pub struct ContestJob {
    person_id: String,
    request_id: String,
    answer_id: String, //the contested answer's ANSWERED relationship id
    r#trait: String, //the trait whose evidence on that answer is contested
    kind: Kind,
    message: String,
    scene: Vec<ScoredAnswer>, //the scene's answers, ordered by question, each with its evidence and earlier contests
}

#[derive(Deserialize)]
struct LlmRuling {
    accepted: bool,
    reply: String,
    remove: Option<bool>,
    evidence: Option<String>,
    level: Option<f64>,
    weight: Option<f64>,
}

//added to the scoring prompt when reviewing a contest, so the reviewer judges by the same rules the scorer did
const CONTEST_PROMPT: &str = "## Reviewing a contest
This time you are not scoring every trait. The person has seen one piece of evidence recorded about one of their answers, and contested it. You get every answer in that scene, each with the evidence recorded for it and anything the person added about it before. Decide whether the contested evidence should change.

The person either explained their answer (explain), or said the evidence misread them (wrong).
- Accept when the answers, read together with what the person wrote, show something different from the evidence: the evidence misread the answer, the level or weight goes against the rules above, or their explanation makes a different reading plausible. An explanation is new evidence, but it was written after they saw the score, so it counts like their reasoning and never more than what they actually said and did.
- Reject when the evidence still fits. Wanting a higher or lower score is not a reason to change it.
- For traits about what a person feels, such as Anger, Anxiety or Depression, their own account of what they felt is the best evidence there is. If they say the choice came from a different feeling or a practical reason, and nothing they said at the time shows the feeling, the choice no longer shows the trait. But what they said at the time comes first: if their answer or reasoning already named the feeling (\"it's still annoying\" is irritation, which is Anger), a later note saying otherwise does not change the evidence.
- When you accept, decide first whether the answer, read with what the person wrote, still shows what the trait's definition describes. If it does not, set remove: do not keep it at a lower level or weight. Only lower the evidence when the answer still shows the trait, just less strongly.
- When you keep the evidence, give it as it should now be recorded: the sentence, level and weight. The sentence must say what in the answer shows the trait at that level. If the sentence you would write says the answer does not really show the trait, remove the evidence instead.
- Only the contested evidence can change. Do not comment on any other evidence or trait.
- The reply goes to the person: at most two short, plain sentences saying what you decided and why, addressed to them as \"you\". Do not lecture them or praise them.";

//what the person said about earlier evidence on an answer, and what came of it, for the scorer to read. Pending contests
//aren't settled yet
pub fn notes(contests: Option<&str>) -> Result<Option<Vec<serde_json::Value>>, serde_json::Error> {
    let contests: Vec<Contest> = contests.map_or(Ok(Vec::new()), serde_json::from_str)?;
    let notes: Vec<_> = contests.iter().filter(|c| c.status != Status::Pending).map(|c| json!({
        "trait": c.r#trait, "kind": c.kind, "note": c.message, "outcome": c.status, "reviewer_reply": c.reply,
    })).collect();
    Ok((!notes.is_empty()).then_some(notes))
}

//reviews a contested piece of evidence, changing just that evidence or rejecting the contest, and rescores the person's
//traits and rewrites their report when it changes. A contest that can't be reviewed is rejected, so it never stays pending
pub async fn run(graph: &Graph, job: ContestJob) {
    let span = tracing::info_span!("contest", person_id = job.person_id, answer_id = job.answer_id, request_id = job.request_id);
    async {
        let started = Instant::now();
        let reviewed: Result<bool, BoxError> = async {
            let client = aws_sdk_bedrockruntime::Client::new(&aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await);
            let model = env::var("BEDROCK_MODEL_ID")?;
            let ruling = review(&client, &model, &job).await?;
            let accepted = ruling.accepted;
            settle(graph, &job, |shifts, contest| {
                if accepted {
                    let shift = shifts.iter_mut().find(|s| s.r#trait == job.r#trait).ok_or("the contested evidence is gone")?;
                    contest.before = Some(shift.clone());
                    if ruling.remove == Some(true) {
                        shift.weight = 0.0;
                        contest.removed = Some(true);
                    } else {
                        shift.evidence = ruling.evidence.unwrap_or(shift.evidence.clone());
                        shift.level = ruling.level.unwrap_or(shift.level).clamp(0.0, 1.0);
                        shift.weight = ruling.weight.unwrap_or(shift.weight).clamp(0.0, 1.0);
                    }
                    contest.after = Some(shift.clone());
                }
                contest.status = if accepted { Status::Accepted } else { Status::Rejected };
                contest.reply = Some(ruling.reply);
                Ok(())
            }).await?;
            if accepted {
                save_traits(graph, &job.person_id).await?;
                personality_report::refresh(graph, &client, &model, &job.person_id).await;
            }
            Ok(accepted)
        }.await;
        if let Err(e) = &reviewed {
            tracing::error!("contest review failed: {e}");
            let rejected = settle(graph, &job, |_, contest| {
                contest.status = Status::Rejected;
                contest.reply = Some("We couldn't review this one, so nothing changed. Try again in a little while.".to_string());
                Ok(())
            }).await;
            if let Err(e) = rejected {
                tracing::error!("couldn't reject the contest: {e}");
            }
        }
        tracing::info!(ok = reviewed.is_ok(), accepted = reviewed.as_ref().ok(), latency_ms = started.elapsed().as_millis() as u64, "finished");
    }.instrument(span).await
}

//one bedrock call over the contested answer's scene, deciding whether its evidence for the trait changes
async fn review(client: &aws_sdk_bedrockruntime::Client, model: &str, job: &ContestJob) -> Result<LlmRuling, BoxError> {
    let index = job.scene.iter().position(|a| a.id == job.answer_id).ok_or("the contested answer isn't in its scene")?;
    let answer_list = job.scene.iter().enumerate().map(|(index, a)| {
        let mut answer = answer_json(index, a)?;
        answer["evidence"] = serde_json::from_str(a.scoring.as_deref().unwrap_or("[]"))?;
        Ok(answer)
    }).collect::<Result<Vec<_>, serde_json::Error>>()?;
    let contested: Vec<Shift> = serde_json::from_str(job.scene[index].scoring.as_deref().unwrap_or("[]"))?;
    let evidence = contested.iter().find(|s| s.r#trait == job.r#trait).ok_or("the contested evidence is gone")?;
    let contest = json!({
        "answer": index, "trait": job.r#trait, "evidence": evidence.evidence, "level": evidence.level, "weight": evidence.weight,
        "kind": job.kind, "person_wrote": job.message,
    });

    let input = invoke(client, model, json!({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2000,
        "temperature": 0,
        "system": [
            {"type": "text", "text": SCORING_PROMPT, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": CONTEST_PROMPT},
        ],
        "tools": [{
            "name": "resolve_contest",
            "description": "Accept or reject the person's contest of one piece of evidence.",
            "input_schema": {
                "type": "object",
                "required": ["accepted", "reply"],
                "properties": {
                    "accepted": {"type": "boolean"},
                    "reply": {"type": "string", "description": "At most two short sentences to the person."},
                    "remove": {"type": "boolean", "description": "Accepted, and the answer read with the person's note no longer shows the trait."},
                    "evidence": {"type": "string", "description": "Accepted: the evidence sentence as it should now read."},
                    "level": {"type": "number", "minimum": 0, "maximum": 1},
                    "weight": {"type": "number", "minimum": 0, "maximum": 1},
                },
            },
        }],
        "tool_choice": {"type": "tool", "name": "resolve_contest"},
        "messages": [{"role": "user", "content": format!(
            "The scene's answers:\n{}\n\nThe contest:\n{}",
            serde_json::to_string_pretty(&answer_list)?, serde_json::to_string_pretty(&contest)?
        )}],
    })).await?;
    Ok(serde_json::from_value(input)?)
}

//changes the answer's evidence and settles the pending contest on the trait, from what's saved now rather than what the
//job was sent. The write only lands if neither changed since they were read, so a scoring job finishing in between is
//never overwritten. A replay clears the contests, leaving nothing to settle
async fn settle(
    graph: &Graph,
    job: &ContestJob,
    change: impl FnOnce(&mut Vec<Shift>, &mut Contest) -> Result<(), BoxError>,
) -> Result<(), BoxError> {
    let mut rows = graph.execute(query("
        MATCH ()-[a:ANSWERED]->() WHERE elementId(a) = $id
        RETURN a.scoring AS scoring, a.contests AS contests
    ")
        .param("id", job.answer_id.as_str())
    ).await?;
    let Some(row) = rows.next().await? else { return Ok(()) };
    drop(rows); //the stream holds its pooled connection until it's dropped, and the next query needs one
    let (Some(old_scoring), Some(old_contests)) = (row.get::<Option<String>>("scoring")?, row.get::<Option<String>>("contests")?) else {
        return Ok(());
    };
    let mut shifts: Vec<Shift> = serde_json::from_str(&old_scoring)?;
    let mut contests: Vec<Contest> = serde_json::from_str(&old_contests)?;
    let Some(contest) = contests.iter_mut().rev().find(|c| c.r#trait == job.r#trait && c.status == Status::Pending) else {
        return Ok(());
    };
    change(&mut shifts, contest)?;

    let mut rows = graph.execute(query("
        MATCH ()-[a:ANSWERED]->() WHERE elementId(a) = $id AND a.scoring = $oldScoring AND a.contests = $oldContests
        SET a.scoring = $scoring, a.contests = $contests
        RETURN count(a) AS saved
    ")
        .param("id", job.answer_id.as_str())
        .param("oldScoring", old_scoring)
        .param("oldContests", old_contests)
        .param("scoring", serde_json::to_string(&shifts)?)
        .param("contests", serde_json::to_string(&contests)?)
    ).await?;
    match rows.next().await?.map(|r| r.get::<i64>("saved")).transpose()? {
        Some(1) => Ok(()),
        _ => Err("the answer's evidence changed while its contest was reviewed".into()),
    }
}
