//writes the O*NET occupations seed: every occupation O*NET rates, with the level and importance of each ability it
//takes, the knowledge and skills it takes at the Bloom and Dreyfus levels its ratings come to, how important each of
//its work styles is, and an embedding of each, so skills can find the occupations like them by meaning. It reads O*NET
//30.0's Occupation Data, Alternate Titles, Abilities, Knowledge, Skills and Work Styles, and links.tsv, which names the
//topic, skill or personality trait each knowledge area, skill and work style is in the Atlas. From Work Context, it
//writes how often the work has people in each of the physical demands in demands.tsv, and which body functions and
//parts each demand strains, from strains.tsv. See README.md
use std::{collections::BTreeMap, env, fmt::Write, fs, path::Path, process::ExitCode};

use atlas_shared::{bedrock::embed, skills::resolver::embedding_text};
use futures::{StreamExt, TryStreamExt, stream};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: onet-import <data-dir> <seed-file>";

//O*NET's files, as named in its text download
const OCCUPATIONS: &str = "Occupation Data.txt";
const TITLES: &str = "Alternate Titles.txt";
const ABILITIES: &str = "Abilities.txt";
const KNOWLEDGE: &str = "Knowledge.txt";
const SKILLS: &str = "Skills.txt";
const WORK_STYLES: &str = "Work Styles.txt";
const WORK_CONTEXT: &str = "Work Context.txt";
//what each of O*NET's knowledge areas, skills and work styles is in the Atlas, beside Cargo.toml
const LINKS: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/links.tsv");
//the physical demands of work kept from Work Context, and the body functions and parts each strains, beside Cargo.toml
const DEMANDS: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/demands.tsv");
const STRAINS: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/strains.tsv");
//a knowledge area or skill an occupation takes at least this important is one it requires: O*NET's "important", 3 on
//its 1 to 5, which is 0.5 here
const IMPORTANT: f64 = 0.5;

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
//abilities_seed.cypher), so they're left out
const NOT_ABILITIES: [&str; 6] = ["1.A.1.a.1", "1.A.1.a.2", "1.A.1.a.3", "1.A.1.a.4", "1.A.1.c.1", "1.A.1.c.2"];

struct Occupation {
    title: String,
    description: String,
    titles: Vec<String>,
    vector: Vec<f64>,
}

//what an occupation takes of one ability, knowledge area, skill or work style: the level over 7, and the importance
//from 0 to 1. Work styles are rated on importance alone
#[derive(Default)]
struct Takes {
    level: Option<f64>,
    importance: Option<f64>,
    //for Work Context: how often, from O*NET's 1 (never) to 5 (continually, or every day), over 0 to 1
    frequency: Option<f64>,
}

//what one of O*NET's elements is in the Atlas: a topic, skill or trait by name, and for a trait, whether the element is
//its low end. An element can be more than one topic ("Law and Government" is Law and Government)
struct Link {
    kind: String,
    element: String,
    name: String,
    opposite: bool,
}

//one requirement to write: the occupation, the Atlas name, the Bloom or Dreyfus rank its level comes to, and O*NET's
//level over 7 and importance from 0 to 1
struct Requirement {
    rank: i64,
    level: f64,
    importance: f64,
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

    let mut takes = ratings(&data.join(ABILITIES))?;
    takes.retain(|(soc, ability), _| occupations.contains_key(soc) && !NOT_ABILITIES.contains(&ability.as_str()));
    let takes: Vec<(&String, &String, f64, f64)> = takes.iter()
        .filter_map(|((soc, ability), t)| Some((soc, ability, t.level?, t.importance?)))
        .collect();
    //only occupations rated on their abilities are worth a node
    occupations.retain(|soc, _| takes.iter().any(|(s, ..)| *s == soc));

    let links = links()?;
    let knowledge = requirements(&ratings(&data.join(KNOWLEDGE))?, &links, "topic", 6, &occupations);
    let skills = requirements(&ratings(&data.join(SKILLS))?, &links, "skill", 5, &occupations);
    //every work style an occupation is rated on, with how important it is, as the trait it is in the Atlas
    //how often each occupation's work has people in each physical demand
    let demands = tsv(DEMANDS)?;
    let context = ratings(&data.join(WORK_CONTEXT))?;
    let frequencies: Vec<(&String, &String, f64)> = context.iter()
        .filter(|((soc, element), _)| occupations.contains_key(soc) && demands.iter().any(|d| &d[0] == element))
        .filter_map(|((soc, element), t)| Some((soc, element, t.frequency?)))
        .collect();
    //the body functions and parts each demand strains, by the demand's element id
    let strains: Vec<(String, Vec<String>)> = tsv(STRAINS)?.into_iter().map(|row| {
        let element = demands.iter().find(|d| d[2] == row[0]).map(|d| d[0].clone())
            .ok_or_else(|| format!("strains.tsv names a demand demands.tsv doesn't have: {}", row[0]))?;
        Ok::<_, BoxError>((element, row))
    }).collect::<Result<_, _>>()?;

    let styles = ratings(&data.join(WORK_STYLES))?;
    let mut traits: Vec<(&String, &Link, f64)> = Vec::new();
    for ((soc, element), t) in &styles {
        let Some(importance) = t.importance else { continue };
        if occupations.contains_key(soc) {
            traits.extend(links.iter().filter(|l| l.kind == "trait" && &l.element == element).map(|l| (soc, l, importance)));
        }
    }

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

    //the knowledge, skills, traits and demands are written again from scratch, since a new rating can move one to another
    //level, or leave it out
    writeln!(out, "MATCH (:Occupation)-[r:TAKES_KNOWLEDGE|TAKES_SKILL|TAKES_TRAIT|HAS_DEMAND]->()\nDELETE r;\n")?;
    let knowledge: Vec<_> = knowledge.iter().collect();
    for chunk in knowledge.chunks(BATCH) {
        write_requirements(&mut out, chunk)?;
        writeln!(out, "] AS t\nMATCH (o:Occupation {{onetSoc: t.soc}}), (:Topic {{name: t.name}})-[:HAS_LEVEL]->(l:BloomLevel {{rank: t.rank}})\nMERGE (o)-[r:TAKES_KNOWLEDGE]->(l)\nSET r.level = t.level, r.importance = t.importance;\n")?;
    }
    let skills: Vec<_> = skills.iter().collect();
    for chunk in skills.chunks(BATCH) {
        write_requirements(&mut out, chunk)?;
        writeln!(out, "] AS t\nMATCH (o:Occupation {{onetSoc: t.soc}}), (:Skill {{name: t.name}})-[:HAS_LEVEL]->(l:DreyfusLevel {{rank: t.rank}})\nMERGE (o)-[r:TAKES_SKILL]->(l)\nSET r.level = t.level, r.importance = t.importance;\n")?;
    }
    for chunk in traits.chunks(BATCH) {
        writeln!(out, "UNWIND [")?;
        for (i, (soc, link, importance)) in chunk.iter().enumerate() {
            writeln!(
                out,
                "  {{soc: {}, name: {}, importance: {}, opposite: {}}}{}",
                text(soc), text(&link.name), round(*importance), link.opposite, if i + 1 < chunk.len() { "," } else { "" }
            )?;
        }
        writeln!(out, "] AS t\nMATCH (o:Occupation {{onetSoc: t.soc}}), (p:PersonalityTrait {{name: t.name}})\nMERGE (o)-[r:TAKES_TRAIT]->(p)\nSET r.importance = t.importance, r.opposite = t.opposite;\n")?;
    }

    //the demands, what each strains, and how often each occupation's work has people in them
    writeln!(out, "UNWIND [")?;
    for (i, d) in demands.iter().enumerate() {
        writeln!(out, "  {{onetId: {}, name: {}, group: {}}}{}", text(&d[0]), text(&d[2]), text(&d[3]), if i + 1 < demands.len() { "," } else { "" })?;
    }
    writeln!(out, "] AS d\nMERGE (n:WorkDemand {{onetId: d.onetId}})\nON CREATE SET n.id = randomUUID()\nSET n.name = d.name, n.group = d.group;\n")?;
    writeln!(out, "MATCH (:WorkDemand)-[r:STRAINS]->()\nDELETE r;\n")?;
    for (kind, label, key) in [("function", "BodyFunction", "code"), ("part", "BodyPart", "fmaId")] {
        let rows: Vec<_> = strains.iter().filter(|(_, row)| row[1] == kind).collect();
        writeln!(out, "UNWIND [")?;
        for (i, (element, row)) in rows.iter().enumerate() {
            writeln!(out, "  {{demand: {}, target: {}}}{}", text(element), text(&row[2]), if i + 1 < rows.len() { "," } else { "" })?;
        }
        writeln!(out, "] AS s\nMATCH (d:WorkDemand {{onetId: s.demand}}), (t:{label} {{{key}: s.target}})\nMERGE (d)-[:STRAINS]->(t);\n")?;
    }
    for chunk in frequencies.chunks(BATCH) {
        writeln!(out, "UNWIND [")?;
        for (i, (soc, element, frequency)) in chunk.iter().enumerate() {
            writeln!(out, "  {{soc: {}, demand: {}, frequency: {}}}{}", text(soc), text(element), round(*frequency), if i + 1 < chunk.len() { "," } else { "" })?;
        }
        writeln!(out, "] AS t\nMATCH (o:Occupation {{onetSoc: t.soc}}), (d:WorkDemand {{onetId: t.demand}})\nMERGE (o)-[r:HAS_DEMAND]->(d)\nSET r.frequency = t.frequency;\n")?;
    }

    fs::write(seed, out)?;
    println!(
        "{} occupations, {} abilities, {} knowledge, {} skills, {} traits and {} demands they take, {} body functions and parts the demands strain",
        occupations.len(), takes.len(), knowledge.len(), skills.len(), traits.len(), frequencies.len(), strains.len()
    );
    Ok(())
}

//one of O*NET's files of ratings, by occupation and element. A rating O*NET recommends suppressing is left out, and a
//level it marks not relevant is 0. The columns are found by name, since the files differ in which they have
fn ratings(path: &Path) -> Result<BTreeMap<(String, String), Takes>, BoxError> {
    let file = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    let mut lines = file.lines();
    let header: Vec<&str> = lines.next().unwrap_or_default().split('\t').collect();
    let column = |name: &str| header.iter().position(|h| *h == name);
    let (Some(soc), Some(element), Some(scale), Some(value), Some(suppress)) =
        (column("O*NET-SOC Code"), column("Element ID"), column("Scale ID"), column("Data Value"), column("Recommend Suppress"))
    else {
        return Err(format!("{}: missing a column", path.display()).into());
    };
    let not_relevant = column("Not Relevant");
    let mut takes: BTreeMap<(String, String), Takes> = BTreeMap::new();
    for line in lines.filter(|l| !l.is_empty()) {
        let row: Vec<&str> = line.split('\t').map(str::trim).collect();
        let field = |i: usize| row.get(i).copied().unwrap_or_default();
        if field(suppress) == "Y" {
            continue;
        }
        let number: f64 = field(value).parse()?;
        let entry = takes.entry((field(soc).to_string(), field(element).to_string())).or_default();
        match field(scale) {
            "LV" => entry.level = Some(if not_relevant.is_some_and(|i| field(i) == "Y") { 0.0 } else { number / 7.0 }),
            "IM" => entry.importance = Some((number - 1.0) / 4.0),
            "CX" => entry.frequency = Some((number - 1.0) / 4.0),
            _ => {}
        }
    }
    Ok(takes)
}

//the fields of each row of one of the tab separated files beside Cargo.toml, without its header
fn tsv(path: &str) -> Result<Vec<Vec<String>>, BoxError> {
    let file = fs::read_to_string(path).map_err(|e| format!("{path}: {e}"))?;
    Ok(file.lines().skip(1).filter(|l| !l.trim().is_empty())
        .map(|line| line.split('\t').map(|f| f.trim().to_string()).collect::<Vec<_>>())
        .filter(|row| row.len() >= 4)
        .collect())
}

//links.tsv, without its header
fn links() -> Result<Vec<Link>, BoxError> {
    let file = fs::read_to_string(LINKS).map_err(|e| format!("{LINKS}: {e}"))?;
    Ok(file.lines().skip(1).filter(|l| !l.trim().is_empty()).map(|line| {
        let fields: Vec<&str> = line.split('\t').map(str::trim).collect();
        let field = |i: usize| fields.get(i).copied().unwrap_or_default().to_string();
        Link { kind: field(0), element: field(1), name: field(3), opposite: field(4) == "yes" }
    }).collect())
}

//the requirements of a kind (topic or skill), by occupation and Atlas name: every rating at least IMPORTANT with a
//level, at the rank its level comes to on a scale of `ranks` (6 Bloom levels or 5 Dreyfus levels). When two of O*NET's
//elements are one thing in the Atlas, the more important one counts
fn requirements(ratings: &BTreeMap<(String, String), Takes>, links: &[Link], kind: &str, ranks: i64, occupations: &BTreeMap<String, Occupation>) -> BTreeMap<(String, String), Requirement> {
    let mut requirements: BTreeMap<(String, String), Requirement> = BTreeMap::new();
    for ((soc, element), t) in ratings {
        let (Some(level), Some(importance)) = (t.level, t.importance) else { continue };
        if importance < IMPORTANT || level <= 0.0 || !occupations.contains_key(soc) {
            continue;
        }
        let rank = ((level * ranks as f64).round() as i64).clamp(1, ranks);
        for link in links.iter().filter(|l| l.kind == kind && &l.element == element) {
            let key = (soc.clone(), link.name.clone());
            if requirements.get(&key).is_none_or(|r| r.importance < importance) {
                requirements.insert(key, Requirement { rank, level, importance });
            }
        }
    }
    requirements
}

//the start of a statement of requirements, up to the end of its list
fn write_requirements(out: &mut String, chunk: &[(&(String, String), &Requirement)]) -> std::fmt::Result {
    writeln!(out, "UNWIND [")?;
    for (i, ((soc, name), r)) in chunk.iter().enumerate() {
        writeln!(
            out,
            "  {{soc: {}, name: {}, rank: {}, level: {}, importance: {}}}{}",
            text(soc), text(name), r.rank, round(r.level), round(r.importance), if i + 1 < chunk.len() { "," } else { "" }
        )?;
    }
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

//a number to 3 places, always with a decimal point, so cypher keeps it a float: a bare 0 or 1 would be an integer
fn round(v: f64) -> String {
    let short = format!("{:.3}", v).trim_end_matches('0').to_string();
    if short.ends_with('.') { format!("{short}0") } else { short }
}

const HEADER: &str = r#"
// =============================================================================
// Atlas of Us — Occupations sub-graph seed
// Spec: documentation/data_model/occupations/occupations.md
//
// Generated by database/onet_import. Run it again on a newer O*NET release
// rather than editing this file.
//
// One Occupation per occupation O*NET rates on its abilities, with
// TAKES_ABILITY to each of the Atlas's abilities: `level` is the level the
// occupation takes on O*NET's 0 to 7 level scale, over 7, and `importance` is
// how important it is, from O*NET's 1 to 5 over 0 to 1. Both are rated by
// O*NET's job analysts and incumbents. TAKES_KNOWLEDGE and TAKES_SKILL go to
// the Bloom or Dreyfus level of each topic and skill it takes at least
// "important" (3 of 5), the level O*NET's rating comes to, with the same
// `level` and `importance`. TAKES_TRAIT goes to the personality trait each of
// its work styles is, with its `importance`, and `opposite` when the work style
// is the trait's low end. Which topic, skill or trait each of O*NET's elements
// is comes from database/onet_import/links.tsv. HAS_DEMAND goes to each of the
// physical demands of work (WorkDemand), with how often the work has people in
// it, its `frequency` from O*NET's 1 (never) to 5 (continually, or every day),
// over 0 to 1. STRAINS goes from each demand to the body functions and parts it
// strains, from demands.tsv and strains.tsv. `vector` is an embedding of its
// title, description and alternate titles (amazon.titan-embed-text-v2:0), the
// same as a skill's, so skills can find the occupations like them. Run
// migrations 006 and 018, abilities_seed.cypher, abilities_functions_seed.cypher,
// abilities_anatomy_seed.cypher and personality_seed.cypher first.
//
// Source: O*NET 30.0 Database (Occupation Data, Alternate Titles, Abilities,
// Knowledge, Skills, Work Styles, Work Context),
// by the U.S. Department of Labor, Employment and Training Administration,
// under CC BY 4.0 (https://www.onetcenter.org/database.html). Credit O*NET
// wherever this data is shown.
//
// Idempotent: safe to re-run. MERGE on onetSoc, everything else overwritten
// from this file on every run. id is set once, when the occupation is first
// created.
// =============================================================================
"#;
