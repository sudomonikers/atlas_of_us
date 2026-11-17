//writes the conditions seed: the conditions chosen in picks.rs, with each one's name, definition and synonyms from Mondo
//or HPO, the broader conditions in the seed each is a kind of, the body functions and parts it affects, and the everyday
//names from common.rs. See README.md
mod common;
mod obo;
mod picks;

use std::{
    collections::{HashMap, HashSet},
    env,
    fmt::Write as _,
    fs,
    path::Path,
    process::ExitCode,
};

use obo::Term;

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: conditions-import <data-dir> <icf-tabulation> <anatomy-seed> <seed-file>";
//the classes every condition has to be under: human diseases in Mondo, which also has diseases of other animals, and
//phenotypic abnormalities in HPO, which also has modes of inheritance, onsets and frequencies
const MONDO_ROOT: &str = "MONDO:0700096";
const HPO_ROOT: &str = "HP:0000118";

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let [dir, icf, anatomy, seed] = args.as_slice() else {
        eprintln!("{USAGE}");
        return ExitCode::FAILURE;
    };
    match run(Path::new(dir), Path::new(icf), Path::new(anatomy), Path::new(seed)) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

fn run(dir: &Path, icf: &Path, anatomy: &Path, seed: &Path) -> Result<(), BoxError> {
    let mut terms = obo::terms(&dir.join("mondo.obo"))?;
    //Mondo's file carries the HPO classes it uses, so HPO's own file goes in last to win
    terms.extend(obo::terms(&dir.join("hp.obo"))?);
    let codes = icf_codes(icf)?;
    let parts = fma_ids(anatomy)?;

    let mut seen = HashSet::new();
    let mut picked: Vec<&Term> = Vec::new();
    for (id, functions, body_parts) in picks::PICKS {
        if !seen.insert(*id) {
            return Err(format!("picks.rs has {id} twice").into());
        }
        let term = terms.get(*id).ok_or(format!("picks.rs names {id}, which isn't in Mondo or HPO"))?;
        if term.obsolete {
            return Err(format!("picks.rs names {id} ({}), which is obsolete", term.name).into());
        }
        let root = if id.starts_with("MONDO:") { MONDO_ROOT } else { HPO_ROOT };
        if !ancestors(&terms, id).contains(root) {
            return Err(format!("picks.rs names {id} ({}), which isn't under {root}", term.name).into());
        }
        if let Some(code) = functions.iter().find(|c| !codes.contains(**c)) {
            return Err(format!("picks.rs links {id} to {code}, which isn't a body function").into());
        }
        if let Some(part) = body_parts.iter().find(|p| !parts.contains(**p)) {
            return Err(format!("picks.rs links {id} to {part}, which isn't in the anatomy seed").into());
        }
        picked.push(term);
    }
    let named = common::CHECKLIST.iter().flat_map(|(_, items)| items.iter().map(|(id, _)| *id)).chain(common::EVERYDAY.iter().map(|(id, _)| *id));
    for id in named {
        if !seen.contains(id) {
            return Err(format!("common.rs names {id}, which isn't in picks.rs").into());
        }
    }

    let broader = broader(&terms, &seen);
    fs::write(seed, cypher(&terms, &picked, &broader))?;
    let mondo = picked.iter().filter(|t| t.id.starts_with("MONDO:")).count();
    println!("{mondo} conditions from Mondo, {} from HPO", picked.len() - mondo);
    println!("wrote {}", seed.display());
    Ok(())
}

//the codes of every body function in WHO's tabulation that the functions seed has, which leaves out the residual
//"other specified" and "unspecified" ones
fn icf_codes(path: &Path) -> Result<HashSet<String>, BoxError> {
    let text = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    let mut lines = text.lines();
    let headers: Vec<&str> = lines.next().unwrap_or_default().split('\t').map(|h| h.trim_start_matches('\u{feff}')).collect();
    let column = |name: &str| headers.iter().position(|h| *h == name).ok_or(format!("{} has no {name} column", path.display()));
    let (code, residual) = (column("Code")?, column("IsResidual")?);
    Ok(lines
        .map(|l| l.split('\t').collect::<Vec<_>>())
        .filter(|row| row.get(residual) != Some(&"True"))
        .filter_map(|row| row.get(code).map(|c| c.to_string()))
        .filter(|c| c.starts_with('b'))
        .collect())
}

//the FMA id of every part the anatomy seed has
fn fma_ids(path: &Path) -> Result<HashSet<String>, BoxError> {
    let text = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(text.split("fmaId: \"").skip(1).filter_map(|s| s.split('"').next()).map(str::to_string).collect())
}

//every class a term is a kind of, however far up
fn ancestors<'a>(terms: &'a HashMap<String, Term>, id: &str) -> HashSet<&'a str> {
    let mut found = HashSet::new();
    let mut todo: Vec<&str> = terms.get(id).map(|t| t.is_a.iter().map(String::as_str).collect()).unwrap_or_default();
    while let Some(next) = todo.pop() {
        if let Some(term) = terms.get(next) {
            if found.insert(term.id.as_str()) {
                todo.extend(term.is_a.iter().map(String::as_str));
            }
        }
    }
    found
}

//each picked condition's nearest picked ancestors: the picked conditions it's a kind of, leaving out any that's a kind
//of another of them
fn broader<'a>(terms: &'a HashMap<String, Term>, picked: &HashSet<&str>) -> Vec<(&'a str, &'a str)> {
    let mut links = Vec::new();
    for id in picked {
        let Some(term) = terms.get(*id) else { continue };
        let above: Vec<&str> = ancestors(terms, id).into_iter().filter(|a| picked.contains(a)).collect();
        for a in &above {
            let through_another = above.iter().any(|b| b != a && ancestors(terms, b).contains(a));
            if !through_another {
                links.push((term.id.as_str(), *a));
            }
        }
    }
    links.sort();
    links
}

fn quote(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_default()
}

fn list(items: &[String]) -> String {
    format!("[{}]", items.iter().map(|i| quote(i)).collect::<Vec<_>>().join(", "))
}

//where the ontology publishes a term: MONDO:0004979 is http://purl.obolibrary.org/obo/MONDO_0004979
fn uri(id: &str) -> String {
    format!("http://purl.obolibrary.org/obo/{}", id.replace(':', "_"))
}

//a term's ancestors in its own ontology, which is what conditions people add are placed among
fn own_ancestors(terms: &HashMap<String, Term>, id: &str) -> Vec<String> {
    let prefix = id.split(':').next().unwrap_or_default();
    let mut found: Vec<String> = ancestors(terms, id).into_iter()
        .filter(|a| a.split(':').next() == Some(prefix))
        .map(str::to_string)
        .collect();
    found.sort();
    found
}

//where a condition sits on the checklist: its group, its place among all the checklist's conditions, and its everyday name
fn on_checklist(id: &str) -> Option<(&'static str, usize, &'static str)> {
    common::CHECKLIST.iter()
        .flat_map(|(group, items)| items.iter().map(move |(i, plain)| (*group, *i, *plain)))
        .enumerate()
        .find(|(_, (_, i, _))| *i == id)
        .map(|(order, (group, _, plain))| (group, order, plain))
}

fn everyday(id: &str) -> Vec<String> {
    common::EVERYDAY.iter().filter(|(i, _)| *i == id).flat_map(|(_, names)| names.iter().map(|n| n.to_string())).collect()
}

fn cypher(terms: &HashMap<String, Term>, picked: &[&Term], broader: &[(&str, &str)]) -> String {
    let rows: Vec<String> = picked.iter().map(|t| {
        let checklist = on_checklist(&t.id);
        format!(
            "  {{ sourceId: {}, source: {}, name: {}, sourceUri: {},\n    description: {},\n    synonyms: {},\n    ancestors: {},\n    plainName: {}, checklist: {}, checklistOrder: {}, everyday: {} }}",
            quote(&t.id), quote(if t.id.starts_with("MONDO:") { "Mondo" } else { "HPO" }), quote(&t.name), quote(&uri(&t.id)),
            t.definition.as_deref().map_or("null".into(), quote), list(&t.synonyms), list(&own_ancestors(terms, &t.id)),
            checklist.map_or("null".into(), |(_, _, plain)| quote(plain)), checklist.map_or("null".into(), |(group, _, _)| quote(group)),
            checklist.map_or("null".into(), |(_, order, _)| order.to_string()), list(&everyday(&t.id)),
        )
    }).collect();
    let subtypes: Vec<String> = broader.iter()
        .map(|(n, b)| format!("  {{ sourceId: {}, broader: {} }}", quote(n), quote(b)))
        .collect();
    let functions: Vec<String> = picks::PICKS.iter()
        .flat_map(|(id, codes, _)| codes.iter().map(move |c| format!("  {{ sourceId: {}, code: {} }}", quote(id), quote(c))))
        .collect();
    let parts: Vec<String> = picks::PICKS.iter()
        .flat_map(|(id, _, parts)| parts.iter().map(move |p| format!("  {{ sourceId: {}, fmaId: {} }}", quote(id), quote(p))))
        .collect();

    let mut out = String::new();
    let _ = write!(out, "\
// =============================================================================
// Atlas of Us — Abilities sub-graph seed: conditions
// Spec: documentation/data_model/abilities/abilities.md
//
// Generated by database/conditions_import. Change it and run it again rather
// than editing this file.
//
// One Condition per condition chosen in conditions_import/src/picks.rs: diseases
// from Mondo and features from the Human Phenotype Ontology (HPO), with names,
// definitions and synonyms as the ontology has them. `sourceId` is the ontology's
// id and `sourceUri` its permanent URI. `ancestors` are the ids of every class
// above it in the ontology, which places conditions people add later. A
// condition is a SUBTYPE_OF the nearest broader conditions in the seed, and
// AFFECTS the body functions and parts it acts on. `everyday` are the everyday
// names and abbreviations people search for it by, and the common ones a person
// picks from a checklist have a `plainName`, a `checklist` group and a
// `checklistOrder`, from conditions_import/src/common.rs. Run
// abilities_functions_seed.cypher and abilities_anatomy_seed.cypher first.
//
// Sources: Mondo Disease Ontology, CC BY 4.0. Human Phenotype Ontology, used
// unaltered and credited wherever it's shown (hpo.jax.org).
//
// Idempotent: safe to re-run. Conditions MERGE on sourceId and keep their id,
// and ones people have added are left as they are.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT condition_source_id_unique IF NOT EXISTS
FOR (n:Condition) REQUIRE n.sourceId IS UNIQUE;

CREATE CONSTRAINT condition_id_unique IF NOT EXISTS
FOR (n:Condition) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Conditions
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS c
MERGE (n:Condition {{sourceId: c.sourceId}})
ON CREATE SET n.id = randomUUID()
SET n.source = c.source,
    n.name = c.name,
    n.sourceUri = c.sourceUri,
    n.description = c.description,
    n.synonyms = c.synonyms,
    n.ancestors = c.ancestors,
    n.plainName = c.plainName,
    n.checklist = c.checklist,
    n.checklistOrder = c.checklistOrder,
    n.everyday = c.everyday;

UNWIND [
{}
] AS c
MATCH (n:Condition {{sourceId: c.sourceId}}), (b:Condition {{sourceId: c.broader}})
MERGE (n)-[:SUBTYPE_OF]->(b);


// -----------------------------------------------------------------------------
// 2. Body functions and parts they affect
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (c:Condition {{sourceId: l.sourceId}}), (f:BodyFunction {{code: l.code}})
MERGE (c)-[:AFFECTS]->(f);

UNWIND [
{}
] AS l
MATCH (c:Condition {{sourceId: l.sourceId}}), (p:BodyPart {{fmaId: l.fmaId}})
MERGE (c)-[:AFFECTS]->(p);
", rows.join(",\n"), subtypes.join(",\n"), functions.join(",\n"), parts.join(",\n"));
    out
}
