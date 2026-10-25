//fills the skills graph with ESCO's skills by asking the atlas api for each one, the way a user asks for a skill we
//don't have. The api's gates name it and screen it, its resolver decides whether we already have it, and it creates the
//stub and publishes SkillCreated, so a run exercises the api and the events end to end. See README.md
mod api;
mod esco;

use std::{
    collections::{BTreeMap, HashSet},
    env,
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::ExitCode,
    sync::Arc,
    time::Duration,
};

use futures::StreamExt;
use serde_json::{Value, json};
use tokio::sync::Mutex;

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: skills-import <data-dir> [--dry-run] [--limit N] [--rate PER_SECOND]";

//every skill asked for, with what the api said, one json line each. Skills already in it are skipped, so a rerun picks
//up where the last one stopped
const RESULTS_FILE: &str = "results.jsonl";
//the longest query the api takes
const MAX_QUERY: usize = 100;
//requests in flight at once. The rate is what actually limits the run
const CONCURRENCY: usize = 8;

struct Options {
    dir: PathBuf,
    dry_run: bool,
    limit: Option<usize>,
    //the waf allows 1000 /api requests per ip every 5 minutes (infrastructure/waf.tf), which is 3.3 a second
    rate: f64,
}

#[tokio::main]
async fn main() -> ExitCode {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();
    let Some(options) = options(env::args().skip(1).collect()) else {
        eprintln!("{USAGE}");
        return ExitCode::FAILURE;
    };
    match run(options).await {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            tracing::error!("{e}");
            ExitCode::FAILURE
        }
    }
}

fn options(args: Vec<String>) -> Option<Options> {
    let mut args = args.into_iter();
    let mut options = Options { dir: PathBuf::from(args.next()?), dry_run: false, limit: None, rate: 3.0 };
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--dry-run" => options.dry_run = true,
            "--limit" => options.limit = Some(args.next()?.parse().ok()?),
            "--rate" => options.rate = args.next()?.parse().ok().filter(|r: &f64| *r > 0.0)?,
            _ => return None,
        }
    }
    Some(options)
}

async fn run(options: Options) -> Result<(), BoxError> {
    let labels = esco::labels(&options.dir)?;
    let done = asked(&options.dir)?;
    let too_long = labels.iter().filter(|l| l.chars().count() > MAX_QUERY).count();
    let mut todo: Vec<String> = labels.iter()
        .filter(|l| l.chars().count() <= MAX_QUERY && !done.contains(*l))
        .cloned()
        .collect();
    if let Some(limit) = options.limit {
        todo.truncate(limit);
    }
    tracing::info!(skills = labels.len(), already_asked = done.len(), too_long, to_ask = todo.len(), "loaded");
    if options.dry_run || todo.is_empty() {
        return Ok(());
    }

    let base = env::var("ATLAS_API_URL").unwrap_or_else(|_| "https://atlas-of-us.com".to_string());
    let token = env::var("ATLAS_TOKEN").map_err(|_| "set ATLAS_TOKEN to a login token")?;
    let api = api::Api::new(&base, &token).await?;
    tracing::info!(base, "the token works");

    let mut results = OpenOptions::new().create(true).append(true).open(options.dir.join(RESULTS_FILE))?;
    let mut ticker = tokio::time::interval(Duration::from_secs_f64(1.0 / options.rate));
    ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
    let ticker = Arc::new(Mutex::new(ticker));

    let mut asking = futures::stream::iter(&todo)
        .map(|label| {
            let (api, ticker) = (&api, ticker.clone());
            async move {
                ticker.lock().await.tick().await;
                (label, api.ask(label).await)
            }
        })
        .buffer_unordered(CONCURRENCY);
    let (mut asked_now, mut failed) = (0, 0);
    let mut outcomes: BTreeMap<String, usize> = BTreeMap::new();
    while let Some((label, outcome)) = asking.next().await {
        match outcome {
            Ok(outcome) => {
                *outcomes.entry(summary(&outcome)).or_default() += 1;
                writeln!(results, "{}", json!({"label": label, "outcome": outcome}))?;
                asked_now += 1;
                if asked_now % 100 == 0 {
                    tracing::info!(asked = asked_now, of = todo.len(), failed, "asking");
                }
            }
            //every request after this one would fail the same way
            Err(e) if e.to_string() == api::TOKEN_EXPIRED => return Err(e),
            Err(e) => {
                failed += 1;
                tracing::error!(label, "left for the next run: {e}");
            }
        }
    }
    for (outcome, count) in &outcomes {
        tracing::info!(outcome, count, "outcome");
    }
    tracing::info!(asked = asked_now, failed, "finished");
    if failed > 0 {
        return Err(format!("{failed} skills failed. Rerun to ask for them again").into());
    }
    Ok(())
}

//the labels in the results file
fn asked(dir: &Path) -> Result<HashSet<String>, BoxError> {
    let text = match fs::read_to_string(dir.join(RESULTS_FILE)) {
        Ok(text) => text,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(HashSet::new()),
        Err(e) => return Err(e.into()),
    };
    Ok(text.lines()
        .filter_map(|line| serde_json::from_str::<Value>(line).ok())
        .filter_map(|line| line["label"].as_str().map(String::from))
        .collect())
}

//an outcome's kind, with what a not_a_skill turned out to be
fn summary(outcome: &Value) -> String {
    let kind = outcome["outcome"].as_str().unwrap_or("unknown");
    match outcome["kind"].as_str() {
        Some(what) => format!("{kind} ({what})"),
        None => kind.to_string(),
    }
}
