//writes the anatomy seed and the 3D body: every part of the body BodyParts3D has a model of, and the parts in picks.rs it
//hasn't, with names, definitions and synonyms from FMA, how they nest, and the body functions they carry out; and the
//models, simplified, one file per layer. See README.md
mod bp3d;
mod fma;
mod models;
mod picks;

use std::{
    collections::{BTreeMap, BTreeSet, HashMap, HashSet, VecDeque},
    env,
    fs,
    path::Path,
    process::ExitCode,
};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

//FMA's whole body, whose parts are the systems and regions
const HUMAN_BODY: &str = "FMA20394";

const USAGE: &str = "usage: anatomy-import <data-dir> <icf-tabulation> <norms-seed> <seed-file> <models-dir>";

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let [dir, icf, norms, seed, models] = args.as_slice() else {
        eprintln!("{USAGE}");
        return ExitCode::FAILURE;
    };
    match run(Path::new(dir), Path::new(icf), Path::new(norms), Path::new(seed), Path::new(models)) {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

//a part of the body, as the seed writes it
struct Part {
    fma_id: String,
    name: String,
    definition: Option<String>,
    synonyms: Vec<String>,
    elements: Vec<String>, //the meshes it's drawn with, empty when it has no model
    major: bool,           //whether it's a part worth linking a condition to
}

fn run(dir: &Path, icf: &Path, norms: &Path, seed: &Path, models_dir: &Path) -> Result<(), BoxError> {
    let bp3d = bp3d::read(&dir.join("bp3d"))?;
    let classes = fma::classes(dir)?;
    let functions = icf_functions(icf)?;

    //every part: the ones with models, and the extras
    let mut ids: BTreeSet<String> = bp3d.names.keys().cloned().collect();
    for id in picks::EXTRAS {
        if !classes.contains_key(*id) {
            return Err(format!("picks.rs names {id}, which isn't in FMA").into());
        }
        if !ids.insert(id.to_string()) {
            return Err(format!("picks.rs names {id} as an extra, but BodyParts3D has a model of it").into());
        }
    }
    let parts: Vec<Part> = ids.iter().map(|id| {
        let class = classes.get(id);
        let name = class.map(|c| c.name.clone()).filter(|n| !n.is_empty()).or_else(|| bp3d.names.get(id).cloned()).unwrap_or_else(|| id.clone());
        let mut synonyms: Vec<String> = class.map(|c| c.synonyms.clone()).unwrap_or_default();
        synonyms.retain(|s| !s.eq_ignore_ascii_case(&name));
        synonyms.sort();
        synonyms.dedup();
        Part {
            fma_id: id.clone(),
            name,
            definition: class.and_then(|c| c.definition.clone()),
            synonyms,
            elements: bp3d.elements.get(id).map(|e| e.iter().cloned().collect()).unwrap_or_default(),
            major: false,
        }
    }).collect();

    let measurements = measurement_names(norms)?;
    for (name, parts) in picks::MEASURES {
        if !measurements.contains(*name) {
            return Err(format!("picks.rs names the measurement {name}, which isn't in the norms seed").into());
        }
        if let Some(part) = parts.iter().find(|p| !ids.contains(**p)) {
            return Err(format!("picks.rs says {name} measures {part}, which isn't a part").into());
        }
    }
    if let Some((part, _)) = picks::TOPICS.iter().find(|(p, _)| !ids.contains(*p)) {
        return Err(format!("picks.rs links {part} to topics, but it isn't a part").into());
    }
    if let Some((part, whole)) = picks::PLACES.iter().find(|(p, w)| !ids.contains(*p) || !ids.contains(*w)) {
        return Err(format!("picks.rs places {part} in {whole}, and both have to be parts").into());
    }
    let (subpart_of, subtype_of) = links(&bp3d, &classes, &ids);
    let mut parts = parts;
    let majors = majors(&parts, &subpart_of, &subtype_of, &classes);
    for part in &mut parts {
        part.major = majors.contains(&part.fma_id);
    }
    for (id, codes) in picks::SERVES {
        if !ids.contains(*id) {
            return Err(format!("picks.rs says {id} serves functions, but it isn't a part").into());
        }
        if let Some(code) = codes.iter().find(|c| !functions.contains(**c)) {
            return Err(format!("picks.rs links {id} to {code}, which isn't a body function").into());
        }
    }

    //the meshes on each layer, and for each mesh the most specific part drawn with it, which is what clicking it opens
    //each mesh's layer, from what the part its header names is, or is part of, in FMA and BodyParts3D
    let concepts = models::concepts(dir)?;
    let mut bp3d_above: HashMap<&str, Vec<&str>> = HashMap::new();
    for (part, whole) in bp3d.part_of.iter().chain(&bp3d.is_a) {
        bp3d_above.entry(part).or_default().push(whole);
    }
    let mut layer_of: BTreeMap<String, String> = BTreeMap::new();
    for element in parts.iter().flat_map(|p| p.elements.iter()) {
        let up = concepts.get(element).map(|c| upward(c, &bp3d_above, &classes)).unwrap_or_default();
        let name = concepts.get(element).and_then(|c| bp3d.names.get(c)).map(|n| n.to_lowercase()).unwrap_or_default();
        let layer = picks::LAYERS.iter()
            .find(|(_, classes)| classes.iter().any(|c| up.contains(*c)))
            .or_else(|| picks::LAYER_WORDS.iter().find(|(_, words)| words.iter().any(|w| name.contains(w))))
            .map_or(picks::OTHER_LAYER, |(layer, _)| layer);
        layer_of.insert(element.clone(), layer.to_string());
    }
    let mut layers: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for (element, layer) in &layer_of {
        layers.entry(layer.clone()).or_default().insert(element.clone());
    }
    let written = models::write(dir, models_dir, &layers)?;
    let by_id: HashMap<&str, &Part> = parts.iter().map(|p| (p.fma_id.as_str(), p)).collect();
    let mut picked: BTreeMap<&str, &Part> = BTreeMap::new();
    for part in &parts {
        for element in &part.elements {
            //the part the mesh's own header names, and otherwise the part drawn with fewest meshes
            let named = written.concepts.get(element).and_then(|c| by_id.get(c.as_str())).filter(|p| p.elements.contains(element));
            let better = picked.get(element.as_str()).is_none_or(|p| part.elements.len() < p.elements.len());
            if let Some(named) = named {
                picked.insert(element, named);
            } else if better {
                picked.insert(element, part);
            }
        }
    }
    let index: BTreeMap<&str, serde_json::Value> = picked.iter()
        .map(|(element, part)| (*element, serde_json::json!([part.fma_id, layer_of[*element]])))
        .collect();


    fs::write(models_dir.join("meshes.json"), serde_json::to_string(&index)?)?;
    fs::write(seed, cypher(&parts, &subpart_of, &subtype_of))?;
    let drawn = parts.iter().filter(|p| !p.elements.is_empty()).count();
    println!("{} parts, {drawn} drawn and {} not", parts.len(), parts.len() - drawn);
    for (layer, count) in &written.triangles {
        println!("  {layer}: {} meshes, {count} triangles", layers[layer].len());
    }
    println!("wrote {} and {}", seed.display(), models_dir.display());
    Ok(())
}

//a part and everything it is or is part of, however far up, in FMA and in BodyParts3D's trees
fn upward(id: &str, bp3d_above: &HashMap<&str, Vec<&str>>, classes: &HashMap<String, fma::Class>) -> HashSet<String> {
    let mut found = HashSet::from([id.to_string()]);
    let mut todo = vec![id.to_string()];
    while let Some(next) = todo.pop() {
        let mut above: Vec<String> = classes.get(&next).map(|c| c.is_a.iter().chain(&c.part_of).cloned().collect()).unwrap_or_default();
        above.extend(bp3d_above.get(next.as_str()).into_iter().flatten().map(|w| w.to_string()));
        for a in above {
            if found.insert(a.clone()) {
                todo.push(a);
            }
        }
    }
    found
}

//the name of every measurement the norms seed has
fn measurement_names(path: &Path) -> Result<HashSet<String>, BoxError> {
    let text = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(text.lines()
        .filter(|l| l.contains(", unit: "))
        .filter_map(|l| l.split("name: \"").nth(1)?.split('"').next().map(str::to_string))
        .collect())
}

//the major parts: the whole body, its systems and regions and theirs, the extras, the parts functions and measurements
//are linked to, and every kind of organ in FMA or BodyParts3D, leaving out
//the left and right copies of a part, such as the left femur beside the femur. These are what a condition is linked to
fn majors(parts: &[Part], subpart_of: &BTreeSet<(String, String)>, subtype_of: &BTreeSet<(String, String)>, classes: &HashMap<String, fma::Class>) -> HashSet<String> {
    let names: HashMap<&str, &str> = parts.iter().map(|p| (p.fma_id.as_str(), p.name.as_str())).collect();
    let mut kinds: HashMap<&str, Vec<&str>> = HashMap::new();
    for (part, kind) in subtype_of {
        kinds.entry(part).or_default().push(kind);
    }
    let unsided = |name: &str| name.to_lowercase().replace("left ", "").replace("right ", "");
    let sided = |id: &str| {
        let name = names.get(id).copied().unwrap_or_default();
        let lower = name.to_lowercase();
        lower.starts_with("left ") || lower.starts_with("right ")
            || (unsided(name) != lower && kinds.get(id).into_iter().flatten().any(|k| names.get(k).is_some_and(|n| n.to_lowercase() == unsided(name))))
    };
    let kind_of_organ = |id: &str| {
        let mut seen = HashSet::new();
        let mut todo = vec![id];
        while let Some(next) = todo.pop() {
            if picks::MAJOR.contains(&next) {
                return true;
            }
            if seen.insert(next) {
                todo.extend(kinds.get(next).into_iter().flatten().copied());
                todo.extend(classes.get(next).into_iter().flat_map(|c| c.is_a.iter().map(String::as_str)));
            }
        }
        false
    };
    let systems: HashSet<&str> = subpart_of.iter().filter(|(_, w)| w == HUMAN_BODY).map(|(p, _)| p.as_str()).collect();
    let regions: HashSet<&str> = subpart_of.iter().filter(|(_, w)| systems.contains(w.as_str())).map(|(p, _)| p.as_str()).collect();
    parts.iter().map(|p| p.fma_id.as_str())
        .filter(|id| !sided(id))
        .filter(|id| {
            *id == HUMAN_BODY || systems.contains(id) || regions.contains(id) || picks::EXTRAS.contains(id) || kind_of_organ(id)
                || picks::SERVES.iter().any(|(p, _)| p == id) || picks::MEASURES.iter().any(|(_, ps)| ps.contains(id))
        })
        .map(str::to_string)
        .collect()
}

//the codes of WHO's body functions that the functions seed has, which leaves out the residual ones
fn icf_functions(path: &Path) -> Result<HashSet<String>, BoxError> {
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

//how the parts nest: BodyParts3D's part-of and is-a trees, FMA's direct links to the extras, and for each extra the
//nearest parts above it in FMA, by part-of where it has one and is-a otherwise
fn links(bp3d: &bp3d::Bp3d, classes: &HashMap<String, fma::Class>, ids: &BTreeSet<String>) -> (BTreeSet<(String, String)>, BTreeSet<(String, String)>) {
    let mut subpart_of = bp3d.part_of.clone();
    let mut subtype_of = bp3d.is_a.clone();
    let extras: HashSet<&str> = picks::EXTRAS.iter().copied().collect();
    for id in ids {
        let Some(class) = classes.get(id) else { continue };
        for whole in class.part_of.iter().filter(|w| extras.contains(w.as_str()) && *w != id) {
            subpart_of.insert((id.clone(), whole.clone()));
        }
        for kind in class.is_a.iter().filter(|k| extras.contains(k.as_str()) && *k != id) {
            subtype_of.insert((id.clone(), kind.clone()));
        }
    }
    for extra in picks::EXTRAS {
        let above = |next: fn(&fma::Class) -> &Vec<String>| -> Vec<String> {
            let mut found = Vec::new();
            let mut seen: HashSet<&str> = HashSet::new();
            let mut todo: VecDeque<&str> = classes.get(*extra).map(|c| next(c).iter().map(String::as_str).collect()).unwrap_or_default();
            while let Some(id) = todo.pop_front() {
                if !seen.insert(id) {
                    continue;
                }
                if ids.contains(id) {
                    found.push(id.to_string());
                } else if let Some(class) = classes.get(id) {
                    todo.extend(next(class).iter().map(String::as_str));
                }
            }
            found
        };
        let wholes = above(|c| &c.part_of);
        if wholes.is_empty() {
            subtype_of.extend(above(|c| &c.is_a).into_iter().map(|k| (extra.to_string(), k)));
        } else {
            subpart_of.extend(wholes.into_iter().map(|w| (extra.to_string(), w)));
        }
    }
    subpart_of.extend(picks::PLACES.iter().map(|(part, whole)| (part.to_string(), whole.to_string())));
    (subpart_of, subtype_of)
}

fn quote(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_default()
}

fn list(items: &[String]) -> String {
    format!("[{}]", items.iter().map(|i| quote(i)).collect::<Vec<_>>().join(", "))
}

fn cypher(parts: &[Part], subpart_of: &BTreeSet<(String, String)>, subtype_of: &BTreeSet<(String, String)>) -> String {
    let rows: Vec<String> = parts.iter().map(|p| format!(
        "  {{ fmaId: {}, name: {}, definition: {}, synonyms: {}, elements: {}, major: {} }}",
        quote(&p.fma_id), quote(&p.name), p.definition.as_deref().map_or("null".into(), quote), list(&p.synonyms), list(&p.elements), p.major,
    )).collect();
    let pairs = |links: &BTreeSet<(String, String)>| -> String {
        links.iter().map(|(a, b)| format!("  {{ part: {}, whole: {} }}", quote(a), quote(b))).collect::<Vec<_>>().join(",\n")
    };
    let measures: Vec<String> = picks::MEASURES.iter()
        .flat_map(|(name, parts)| parts.iter().map(move |p| format!("  {{ measurement: {}, part: {} }}", quote(name), quote(p))))
        .collect();
    let serves: Vec<String> = picks::SERVES.iter()
        .flat_map(|(id, codes)| codes.iter().map(move |c| format!("  {{ part: {}, code: {} }}", quote(id), quote(c))))
        .collect();
    let topics: Vec<String> = picks::TOPICS.iter()
        .flat_map(|(id, names)| names.iter().map(move |n| format!("  {{ part: {}, topic: {} }}", quote(id), quote(n))))
        .collect();
    format!("\
// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: anatomy
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// Generated by database/anatomy_import. Change it and run it again rather
// than editing this file.
//
// One BodyPart per part of the body BodyParts3D has a 3D model of, and per part
// in anatomy_import/src/picks.rs it hasn't, with its name, definition and
// synonyms from the Foundational Model of Anatomy (FMA). `fmaId` is the FMA id,
// and `elements` the meshes of the 3D body it's drawn with. `major` marks the
// organs, systems and regions conditions are linked to. A part is a
// SUBPART_OF the wholes it belongs to and a PART_SUBTYPE_OF the kinds it is,
// and SERVES the body functions it carries out. Measurements MEASURE the parts
// they're a reading of, so run physical_norms_seed.cypher and
// physical_functions_seed.cypher first. Topics COVER the systems and organs
// they teach about, by topic name, so run it again after the topics import to
// link topics that didn't exist yet.
//
// Sources: FMA, CC BY 3.0. BodyParts3D, (c) The Database Center for Life
// Science, CC BY 4.0.
//
// Idempotent: safe to re-run. Parts MERGE on fmaId and keep their id.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT bodypart_fma_id_unique IF NOT EXISTS
FOR (n:BodyPart) REQUIRE n.fmaId IS UNIQUE;

CREATE CONSTRAINT bodypart_id_unique IF NOT EXISTS
FOR (n:BodyPart) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Parts
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS p
MERGE (n:BodyPart {{fmaId: p.fmaId}})
ON CREATE SET n.id = randomUUID()
SET n.name = p.name,
    n.definition = p.definition,
    n.synonyms = p.synonyms,
    n.elements = p.elements,
    n.major = p.major;


// -----------------------------------------------------------------------------
// 2. How they nest
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (p:BodyPart {{fmaId: l.part}}), (w:BodyPart {{fmaId: l.whole}})
MERGE (p)-[:SUBPART_OF]->(w);

UNWIND [
{}
] AS l
MATCH (p:BodyPart {{fmaId: l.part}}), (w:BodyPart {{fmaId: l.whole}})
MERGE (p)-[:PART_SUBTYPE_OF]->(w);


// -----------------------------------------------------------------------------
// 3. Functions they carry out
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (p:BodyPart {{fmaId: l.part}}), (f:BodyFunction {{code: l.code}})
MERGE (p)-[:SERVES]->(f);


// -----------------------------------------------------------------------------
// 4. Measurements of them
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (m:PhysicalMeasurement {{name: l.measurement}}), (p:BodyPart {{fmaId: l.part}})
MERGE (m)-[:MEASURES]->(p);


// -----------------------------------------------------------------------------
// 5. Topics to learn more about them in
// -----------------------------------------------------------------------------

UNWIND [
{}
] AS l
MATCH (t:Topic {{name: l.topic}}), (p:BodyPart {{fmaId: l.part}})
MERGE (t)-[:COVERS]->(p);
", rows.join(",\n"), pairs(subpart_of), pairs(subtype_of), serves.join(",\n"), measures.join(",\n"), topics.join(",\n"))
}
