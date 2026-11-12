//writes the O*NET occupations seed: every occupation O*NET rates, with the level and importance of each ability it
//takes, from O*NET 30.0's Occupation Data, Alternate Titles and Abilities, and an embedding of each, so skills can find
//the occupations like them by meaning. See README.md
use std::{collections::BTreeMap, env, fmt::Write, fs, path::Path, process::ExitCode};

use atlas_shared::{bedrock::embed, skills::resolver::embedding_text};
use futures::{StreamExt, TryStreamExt, stream};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: onet-import <data-dir> <seed-file>";

//O*NET's files, as named in its text download
const OCCUPATIONS: &str = "Occupation Data.txt";
const TITLES: &str = "Alternate Titles.txt";
const ABILITIES: &str = "Abilities.txt";

//the alternate titles kept for each occupation, in O*NET's order. They're for finding it by meaning
const MAX_TITLES: usize = 12;
//rows to a statement, so no one statement in the seed is too big. Occupations carry their vectors, so fewer go in one
const BATCH: usize = 500;
const OCCUPATION_BATCH: usize = 50;
//embeddings asked for at once
const EMBEDDING_AT_ONCE: usize = 8;
//the region bedrock is called in, unless AWS_REGION says otherwise: the one the app runs in
const REGION: &str = "us-east-1";
//O*NET's verbal and quantitative abilities, which are skills in the Atlas rather than abilities (see
//physical_abilities_seed.cypher), so they're left out
const NOT_ABILITIES: [&str; 6] = ["1.A.1.a.1", "1.A.1.a.2", "1.A.1.a.3", "1.A.1.a.4", "1.A.1.c.1", "1.A.1.c.2"];

struct Occupation {
    title: String,
    description: String,
    titles: Vec<String>,
    vector: Vec<f64>,
}

//what an occupation takes of one ability: the level over 7, and the importance from 0 to 1
#[derive(Default)]
struct Takes {
    level: Option<f64>,
    importance: Option<f64>,
}

#[tokio::main]
async fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let [data, seed] = args.as_slice() else {
        eprintln!("{USAGE}");
        return ExitCode::FAILURE;
    };
    match run(Path::new(data), Path::new(seed)).await {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

async fn run(data: &Path, seed: &Path) -> Result<(), BoxError> {
    let mut occupations: BTreeMap<String, Occupation> = BTreeMap::new();
    for row in rows(&data.join(OCCUPATIONS))? {
        let [soc, title, description, ..] = row.as_slice() else { continue };
        occupations.insert(soc.clone(), Occupation { title: title.clone(), description: description.clone(), titles: Vec::new(), vector: Vec::new() });
    }
    for row in rows(&data.join(TITLES))? {
        let [soc, title, ..] = row.as_slice() else { continue };
        if let Some(o) = occupations.get_mut(soc) {
            if o.titles.len() < MAX_TITLES && !o.titles.contains(title) && title != &o.title {
                o.titles.push(title.clone());
            }
        }
    }

    //by occupation, then ability. A rating O*NET recommends suppressing is left out, and a level it marks not
    //relevant is 0
    let mut takes: BTreeMap<(String, String), Takes> = BTreeMap::new();
    for row in rows(&data.join(ABILITIES))? {
        let [soc, ability, _, scale, value, _, _, _, _, suppress, not_relevant, ..] = row.as_slice() else { continue };
        if suppress == "Y" || !occupations.contains_key(soc) || NOT_ABILITIES.contains(&ability.as_str()) {
            continue;
        }
        let value: f64 = value.parse()?;
        let entry = takes.entry((soc.clone(), ability.clone())).or_default();
        match scale.as_str() {
            "LV" => entry.level = Some(if not_relevant == "Y" { 0.0 } else { value / 7.0 }),
            "IM" => entry.importance = Some((value - 1.0) / 4.0),
            _ => {}
        }
    }
    let takes: Vec<(&String, &String, f64, f64)> = takes.iter()
        .filter_map(|((soc, ability), t)| Some((soc, ability, t.level?, t.importance?)))
        .collect();
    //only occupations rated on their abilities are worth a node
    occupations.retain(|soc, _| takes.iter().any(|(s, ..)| *s == soc));

    //each embedded from the same text a skill is, its title and description with its other titles
    let region = env::var("AWS_REGION").unwrap_or_else(|_| REGION.to_string());
    let aws = aws_config::defaults(aws_config::BehaviorVersion::latest()).region(aws_config::Region::new(region)).load().await;
    let bedrock = aws_sdk_bedrockruntime::Client::new(&aws);
    let vectors: Vec<(String, Vec<f64>)> = stream::iter(occupations.iter())
        .map(|(soc, o)| {
            let bedrock = &bedrock;
            async move { Ok::<_, BoxError>((soc.clone(), embed(bedrock, &embedding_text(&o.title, &o.description, &o.titles)).await?)) }
        })
        .buffer_unordered(EMBEDDING_AT_ONCE)
        .try_collect()
        .await?;
    for (soc, vector) in vectors {
        if let Some(o) = occupations.get_mut(&soc) {
            o.vector = vector;
        }
    }

    let mut out = String::new();
    writeln!(out, "{}", HEADER.trim_start())?;
    let list: Vec<_> = occupations.iter().collect();
    for chunk in list.chunks(OCCUPATION_BATCH) {
        writeln!(out, "UNWIND [")?;
        for (i, (soc, o)) in chunk.iter().enumerate() {
            let titles: Vec<String> = o.titles.iter().map(|t| text(t)).collect();
            let vector: Vec<String> = o.vector.iter().map(|v| format!("{v:.5}")).collect();
            writeln!(
                out,
                "  {{soc: {}, title: {}, description: {}, alternateTitles: [{}], vector: [{}]}}{}",
                text(soc), text(&o.title), text(&o.description), titles.join(", "), vector.join(","), if i + 1 < chunk.len() { "," } else { "" }
            )?;
        }
        writeln!(out, "] AS o\nMERGE (n:Occupation {{onetSoc: o.soc}})\nON CREATE SET n.id = randomUUID()\nSET n.title = o.title, n.description = o.description, n.alternateTitles = o.alternateTitles, n.vector = o.vector;\n")?;
    }
    for chunk in takes.chunks(BATCH) {
        writeln!(out, "UNWIND [")?;
        for (i, (soc, ability, level, importance)) in chunk.iter().enumerate() {
            writeln!(
                out,
                "  {{soc: {}, ability: {}, level: {}, importance: {}}}{}",
                text(soc), text(ability), round(*level), round(*importance), if i + 1 < chunk.len() { "," } else { "" }
            )?;
        }
        writeln!(out, "] AS t\nMATCH (o:Occupation {{onetSoc: t.soc}}), (a:Ability {{onetId: t.ability}})\nMERGE (o)-[r:TAKES_ABILITY]->(a)\nSET r.level = t.level, r.importance = t.importance;\n")?;
    }
    fs::write(seed, out)?;
    println!("{} occupations, {} abilities they take", occupations.len(), takes.len());
    Ok(())
}

//the rows of one of O*NET's tab separated files, without its header
fn rows(path: &Path) -> Result<Vec<Vec<String>>, BoxError> {
    let file = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(file.lines().skip(1).filter(|l| !l.is_empty()).map(|l| l.split('\t').map(|f| f.trim().to_string()).collect()).collect())
}

//a cypher string
fn text(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
}

fn round(v: f64) -> String {
    format!("{:.3}", v).trim_end_matches('0').trim_end_matches('.').to_string()
}

const HEADER: &str = r#"
// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: occupations
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// Generated by database/onet_import. Run it again on a newer O*NET release
// rather than editing this file.
//
// One Occupation per occupation O*NET rates on its abilities, with
// TAKES_ABILITY to each of the Atlas's abilities: `level` is the level the
// occupation takes on O*NET's 0 to 7 level scale, over 7, and `importance` is
// how important it is, from O*NET's 1 to 5 over 0 to 1. Both are rated by
// O*NET's job analysts. `vector` is an embedding of its title, description
// and alternate titles (amazon.titan-embed-text-v2:0), the same as a skill's,
// so skills can find the occupations like them. Run migration 006 and
// physical_abilities_seed.cypher first.
//
// Source: O*NET 30.0 Database (Occupation Data, Alternate Titles, Abilities),
// by the U.S. Department of Labor, Employment and Training Administration,
// under CC BY 4.0 (https://www.onetcenter.org/database.html). Credit O*NET
// wherever this data is shown.
//
// Idempotent: safe to re-run. MERGE on onetSoc, everything else overwritten
// from this file on every run. id is set once, when the occupation is first
// created.
// =============================================================================
"#;
