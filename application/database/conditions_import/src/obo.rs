//reads an ontology in OBO format, as Mondo and HPO publish it: one [Term] stanza per class, with its name, definition,
//synonyms and the classes it's a kind of
use std::{collections::HashMap, fs, path::Path};

use crate::BoxError;

pub struct Term {
    pub id: String, //MONDO:0004979 or HP:0001382
    pub name: String,
    pub definition: Option<String>,
    pub synonyms: Vec<String>, //exact synonyms, leaving out ones the ontology marks obsolete
    pub is_a: Vec<String>,     //the ids of the classes it's a kind of
    pub obsolete: bool,
}

//every term in the file, by id
pub fn terms(path: &Path) -> Result<HashMap<String, Term>, BoxError> {
    let text = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    let mut terms = HashMap::new();
    for stanza in text.split("\n[").skip(1) {
        let Some(body) = stanza.strip_prefix("Term]\n") else { continue };
        let mut term = Term { id: String::new(), name: String::new(), definition: None, synonyms: Vec::new(), is_a: Vec::new(), obsolete: false };
        for line in body.lines() {
            let Some((tag, value)) = line.split_once(": ") else { continue };
            match tag {
                "id" => term.id = value.to_string(),
                "name" => term.name = value.to_string(),
                "def" => term.definition = quoted(value),
                "is_obsolete" => term.obsolete = value == "true",
                "is_a" => term.is_a.push(value.split(' ').next().unwrap_or_default().to_string()),
                //synonym: "Double-jointedness" EXACT layperson [ORCID:...]
                "synonym" => {
                    let Some(name) = quoted(value) else { continue };
                    let rest = value.rsplit_once('"').map(|(_, r)| r.trim()).unwrap_or_default();
                    let mut words = rest.split(' ');
                    if words.next() == Some("EXACT") && words.next() != Some("obsolete_synonym") {
                        term.synonyms.push(name);
                    }
                }
                _ => {}
            }
        }
        if !term.id.is_empty() {
            terms.insert(term.id.clone(), term);
        }
    }
    Ok(terms)
}

//the text between the first pair of unescaped quotes
fn quoted(value: &str) -> Option<String> {
    let rest = value.strip_prefix('"')?;
    let mut out = String::new();
    let mut chars = rest.chars();
    while let Some(c) = chars.next() {
        match c {
            '\\' => out.push(chars.next()?),
            '"' => return Some(out),
            c => out.push(c),
        }
    }
    None
}
