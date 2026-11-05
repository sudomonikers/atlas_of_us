//writes the body functions seed: the ICF's body functions, with each one's definition from the ICD-API, how they nest, and
//how they link to abilities, measurements and the Big Five. See README.md
mod api;
mod links;
mod tabulation;

use std::{
    collections::HashMap,
    env,
    fs::{self, OpenOptions},
    io::Write as _,
    path::Path,
    process::ExitCode,
};

use api::{Api, Definition};
use tabulation::Category;

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: icf-import <data-dir> <seed-file> [--release YYYY-MM]";
//the ICF release the tabulation and the definitions come from
const RELEASE: &str = "2026-01";
//every definition fetched, one json line each. Categories already in it aren't asked for again, so a rerun picks up
//where the last one stopped
const DEFINITIONS_FILE: &str = "definitions.jsonl";

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let (dir, seed, release) = match args.as_slice() {
        [dir, seed] => (dir, seed, RELEASE),
        [dir, seed, flag, release] if flag == "--release" => (dir, seed, release.as_str()),
        _ => {
            eprintln!("{USAGE}");
            return ExitCode::FAILURE;
        }
    };
    match run(Path::new(dir), Path::new(seed), release) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

fn run(dir: &Path, seed: &Path, release: &str) -> Result<(), BoxError> {
    let categories = tabulation::categories(dir)?;
    let codes: HashMap<&str, &Category> = categories.iter().map(|c| (c.code.as_str(), c)).collect();
    for code in links::UNDERLIES.iter().map(|(c, _)| c).chain(links::MEASURES.iter().map(|(_, c)| c))
        .chain(links::PERSONALITY.iter().map(|(c, _, _)| c))
    {
        if !codes.contains_key(code) {
            return Err(format!("links.rs names {code}, which isn't a body function in the tabulation").into());
        }
    }

    let definitions = definitions(dir, &categories, release)?;
    fs::write(seed, cypher(&categories, &definitions, release))?;
    println!("{} body functions", categories.len());
    println!("wrote {}", seed.display());
    Ok(())
}

//every category's definition, from the file of ones already fetched and the ICD-API for the rest
fn definitions(dir: &Path, categories: &[Category], release: &str) -> Result<HashMap<String, Definition>, BoxError> {
    let path = dir.join(DEFINITIONS_FILE);
    let mut known: HashMap<String, Definition> = fs::read_to_string(&path).unwrap_or_default().lines()
        .filter_map(|line| serde_json::from_str::<Definition>(line).ok())
        .map(|d| (d.code.clone(), d))
        .collect();
    let todo: Vec<&Category> = categories.iter().filter(|c| !known.contains_key(&c.code)).collect();
    if !todo.is_empty() {
        println!("asking the ICD-API for {} definitions", todo.len());
        let mut api = Api::new(release);
        let mut file = OpenOptions::new().create(true).append(true).open(&path)?;
        for (i, category) in todo.iter().enumerate() {
            let definition = api.definition(&category.code, &category.entity)?;
            writeln!(file, "{}", serde_json::to_string(&definition)?)?;
            known.insert(category.code.clone(), definition);
            if (i + 1) % 50 == 0 {
                println!("  {} of {}", i + 1, todo.len());
            }
        }
    }
    Ok(known)
}

fn quote(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_default()
}

fn list(items: &[String]) -> String {
    format!("[{}]", items.iter().map(|i| quote(i)).collect::<Vec<_>>().join(", "))
}

fn cypher(categories: &[Category], definitions: &HashMap<String, Definition>, release: &str) -> String {
    let rows: Vec<String> = categories.iter().map(|c| {
        let d = definitions.get(&c.code).cloned().unwrap_or_default();
        format!(
            "  {{ code: {}, name: {}, group: {}, subgroup: {}, sourceUri: {},\n    description: {},\n    includes: {}, excludes: {} }}",
            quote(&c.code), quote(&c.title), quote(&c.chapter), c.section.as_deref().map_or("null".into(), quote), quote(&c.uri),
            d.definition.as_deref().map_or("null".into(), quote), list(&d.inclusions), list(&d.exclusions),
        )
    }).collect();
    let parents: Vec<String> = categories.iter()
        .filter_map(|c| c.parent.as_ref().map(|p| format!("  {{ code: {}, parent: {} }}", quote(&c.code), quote(p))))
        .collect();
    let underlies: Vec<String> = links::UNDERLIES.iter()
        .flat_map(|(code, abilities)| abilities.iter().map(move |a| format!("  {{ code: {}, ability: {} }}", quote(code), quote(a))))
        .collect();
    let measures: Vec<String> = links::MEASURES.iter()
        .map(|(m, code)| format!("  {{ measurement: {}, code: {} }}", quote(m), quote(code)))
        .collect();
    let personality: Vec<String> = links::PERSONALITY.iter()
        .map(|(code, name, opposite)| format!("  {{ code: {}, name: {}, opposite: {opposite} }}", quote(code), quote(name)))
        .collect();
    format!("\
// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: body functions
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// Generated by database/icf_import. Change it and run it again rather than
// editing this file.
//
// One BodyFunction per body function of the WHO's International Classification
// of Functioning, Disability and Health (ICF), with its description, and
// SUBFUNCTION_OF to the one it's part of. `code` is the ICF code, and
// `sourceUri` the WHO's permanent URI for it. Body functions UNDERLIE the
// abilities they're the basis of, and measurements MEASURE the function they're
// a reading of, and temperament and personality functions CORRESPOND_TO the
// Big Five domains and traits they describe, so run
// physical_abilities_seed.cypher, physical_norms_seed.cypher,
// personality_seed.cypher and personality_explore_seed.cypher first.
//
// Source: ICF, release {release}, from the WHO's ICD-API. (c) World Health
// Organization, licensed under CC BY-ND 3.0 IGO: codes and titles are used
// unaltered, and the WHO is credited wherever they're shown.
//
// Idempotent: safe to re-run. Functions MERGE on code and keep their id.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT bodyfunction_code_unique IF NOT EXISTS
FOR (n:BodyFunction) REQUIRE n.code IS UNIQUE;

CREATE CONSTRAINT bodyfunction_id_unique IF NOT EXISTS
FOR (n:BodyFunction) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Body functions
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS c
MERGE (n:BodyFunction {{code: c.code}})
ON CREATE SET n.id = randomUUID()
SET n.name = c.name,
    n.group = c.group,
    n.subgroup = c.subgroup,
    n.sourceUri = c.sourceUri,
    n.description = c.description,
    n.includes = c.includes,
    n.excludes = c.excludes;

UNWIND [
{}
] AS c
MATCH (n:BodyFunction {{code: c.code}}), (p:BodyFunction {{code: c.parent}})
MERGE (n)-[:SUBFUNCTION_OF]->(p);


// -----------------------------------------------------------------------------
// 2. Abilities they underlie, and measurements of them
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (f:BodyFunction {{code: l.code}}), (a:Ability {{name: l.ability}})
MERGE (f)-[:UNDERLIES]->(a);

UNWIND [
{}
] AS l
MATCH (m:PhysicalMeasurement {{name: l.measurement}}), (f:BodyFunction {{code: l.code}})
MERGE (m)-[:MEASURES]->(f);


// -----------------------------------------------------------------------------
// 3. The Big Five domains and traits they correspond to
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (f:BodyFunction {{code: l.code}})
CALL (l) {{ MATCH (t:PersonalityDomain {{name: l.name}}) RETURN t UNION MATCH (t:PersonalityTrait {{name: l.name}}) RETURN t }}
MERGE (f)-[c:CORRESPONDS_TO]->(t)
SET c.opposite = l.opposite;
", rows.join(",\n"), parents.join(",\n"), underlies.join(",\n"), measures.join(",\n"), personality.join(",\n"))
}
