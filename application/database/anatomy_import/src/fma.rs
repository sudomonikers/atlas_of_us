//reads the Foundational Model of Anatomy (FMA), in its OWL release: each class's name, definition and synonyms, the
//classes it's a kind of, and the wholes it's part of. The file is RDF/XML laid out by Protege with a fixed indent, which
//is read line by line rather than as a whole
use std::{collections::HashMap, fs, path::Path};

use crate::BoxError;

pub const FILE: &str = "fma.owl";

const CLASS: &str = "    <owl:Class rdf:about=\"http://purl.org/sig/ont/fma/fma";
const CLASS_END: &str = "    </owl:Class>";
//a restriction directly on the class: what it's part of. Deeper ones describe its parts
const PROPERTY: &str = "                <owl:onProperty rdf:resource=\"http://purl.org/sig/ont/fma/";
const VALUE: &str = "                <owl:someValuesFrom rdf:resource=\"http://purl.org/sig/ont/fma/fma";
const PART_OF: [&str; 4] = ["regional_part_of", "constitutional_part_of", "systemic_part_of", "member_of"];

#[derive(Default)]
pub struct Class {
    pub name: String,
    pub definition: Option<String>,
    pub synonyms: Vec<String>,
    pub is_a: Vec<String>,    //FMA ids, such as FMA55673
    pub part_of: Vec<String>, //FMA ids
}

//every class, by FMA id such as FMA7088
pub fn classes(dir: &Path) -> Result<HashMap<String, Class>, BoxError> {
    let path = dir.join(FILE);
    let text = fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
    let mut classes = HashMap::new();
    let mut current: Option<(String, Class)> = None;
    let mut property: Option<String> = None;
    for line in text.lines() {
        if let Some(rest) = line.strip_prefix(CLASS) {
            current = Some((format!("FMA{}", rest.split('"').next().unwrap_or_default()), Class::default()));
            continue;
        }
        let Some((_, class)) = current.as_mut() else { continue };
        if line == CLASS_END {
            let (id, class) = current.take().unwrap_or_default();
            classes.insert(id, class);
        } else if let Some(name) = element(line, "        <rdfs:label") {
            class.name = name;
        } else if let Some(definition) = element(line, "        <fma:definition") {
            class.definition = Some(definition);
        } else if let Some(synonym) = element(line, "        <fma:synonym") {
            class.synonyms.push(synonym);
        } else if let Some(rest) = line.strip_prefix("        <rdfs:subClassOf rdf:resource=\"http://purl.org/sig/ont/fma/fma") {
            class.is_a.push(format!("FMA{}", rest.split('"').next().unwrap_or_default()));
        } else if let Some(rest) = line.strip_prefix(PROPERTY) {
            property = Some(rest.split('"').next().unwrap_or_default().to_string());
        } else if let Some(rest) = line.strip_prefix(VALUE) {
            if property.as_deref().is_some_and(|p| PART_OF.contains(&p)) {
                class.part_of.push(format!("FMA{}", rest.split('"').next().unwrap_or_default()));
            }
            property = None;
        }
    }
    Ok(classes)
}

//the text of a one-line element that starts with `open`, such as <fma:definition>...</fma:definition>
fn element(line: &str, open: &str) -> Option<String> {
    let rest = line.strip_prefix(open)?;
    let text = rest.split_once('>')?.1.rsplit_once("</")?.0;
    Some(unescape(text))
}

fn unescape(text: &str) -> String {
    text.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&apos;", "'").replace("&amp;", "&")
}
