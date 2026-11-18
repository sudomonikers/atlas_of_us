//reads Wikipedia's Level 4 vital articles from the wikitext of their subject pages (Wikipedia:Vital articles/Level 4/
//<subject>): every article that's a subject a person knows about, with its prominence, the most prominent first. People,
//places, organizations and specific works are left out: they're things in the world rather than subjects, and belong
//to other graphs
use std::{
    collections::{BTreeMap, HashSet},
    fs,
    path::Path,
};

use crate::{BoxError, Entry};

//the subject pages read, each saved as <name>.wiki. People isn't one of them: every article on it is a person
pub const SUBJECTS: [&str; 10] = [
    "Philosophy_and_religion",
    "Mathematics",
    "Physical_sciences",
    "Biology_and_health_sciences",
    "Society_and_social_sciences",
    "History",
    "Technology",
    "Arts",
    "Everyday_life",
    "Geography",
];

//sections of specific things rather than subjects: works, buildings, companies, institutions and ancient cities. A
//section is left out when any heading above an article starts with one of these
const LEFT_OUT_SECTIONS: [&str; 6] = [
    "Specific",
    "Historical cities",
    "Companies",
    "International organizations",
    "Educational institutions",
    "Libraries",
];
//cultural venues are specific buildings, apart from its general section
const VENUES: &str = "Cultural venues";
//most of Geography is specific places. These are its sections of subjects, and the rest is left out
const GEOGRAPHY_SUBJECTS: [&str; 5] = ["Basics: General", "Cartography", "Earth", "Urban studies and planning", "Land relief: General"];

//the articles that are subjects, most prominent first, each once, with a count of each reason the others were left out
pub fn entries(dir: &Path) -> Result<(Vec<Entry>, BTreeMap<String, usize>), BoxError> {
    let mut entries = Vec::new();
    let mut left_out: BTreeMap<String, usize> = BTreeMap::new();
    left_out.insert("people (not read)".to_string(), 0);
    for subject in SUBJECTS {
        let file = dir.join(format!("{subject}.wiki"));
        let text = fs::read_to_string(&file).map_err(|e| format!("{}: {e}. See README.md for getting the pages", file.display()))?;
        let mut headings: Vec<String> = Vec::new();
        for line in text.lines() {
            if let Some((depth, heading)) = heading(line) {
                headings.truncate(depth - 1);
                headings.push(heading);
                continue;
            }
            let Some((title, prominence, italic)) = article(line) else { continue };
            //Wikipedia also puts the names of genera and species in italics
            let reason = if italic && subject != "Biology_and_health_sciences" {
                Some("a work (italic title)")
            } else if headings.iter().any(|h| LEFT_OUT_SECTIONS.iter().any(|s| h.starts_with(s))) {
                Some("a section of specific things")
            } else if headings.iter().any(|h| h == VENUES) && !headings.last().is_some_and(|h| h.ends_with("General")) {
                Some("a section of specific things")
            } else if subject == "Geography" && !headings.iter().any(|h| GEOGRAPHY_SUBJECTS.contains(&h.as_str())) {
                Some("a place")
            } else {
                None
            };
            match reason {
                Some(reason) => *left_out.entry(reason.to_string()).or_default() += 1,
                None => entries.push(Entry { label: title, prominence: Some(prominence) }),
            }
        }
    }
    //most prominent first, keeping the pages' order within a prominence, which puts broader subjects first
    entries.sort_by_key(|e| e.prominence);
    let mut seen = HashSet::new();
    entries.retain(|e| seen.insert(e.label.to_lowercase()));
    left_out.remove("people (not read)");
    Ok((entries, left_out))
}

//a heading line ("==Basics==") as its depth and its text, without markup such as anchors and spans
fn heading(line: &str) -> Option<(usize, String)> {
    let line = line.trim_end();
    if !line.starts_with('=') {
        return None;
    }
    let depth = line.chars().take_while(|&c| c == '=').count();
    let text = line.trim_matches('=');
    Some((depth, strip_markup(text).trim().to_string()))
}

//removes {{templates}} and <tags> from a heading
fn strip_markup(text: &str) -> String {
    let mut out = String::new();
    let mut rest = text;
    while !rest.is_empty() {
        if let Some(after) = rest.strip_prefix("{{") {
            rest = after.split_once("}}").map_or("", |(_, r)| r);
        } else if rest.starts_with('<') {
            rest = rest.split_once('>').map_or("", |(_, r)| r);
        } else {
            let c = rest.chars().next().unwrap();
            out.push(c);
            rest = &rest[c.len_utf8()..];
        }
    }
    out
}

//an article line ("## {{Icon|C}} '''[[Fraction]]''' ([[Wikipedia:Vital articles/Level 3|Level 3]])") as its title, its
//prominence (the lowest level it's listed at) and whether its title is in italics, which Wikipedia uses for the titles
//of works and the names of genera and species
fn article(line: &str) -> Option<(String, i64, bool)> {
    let rest = line.strip_prefix('#')?.trim_start_matches('#').trim_start();
    if !rest.starts_with("{{Icon|") {
        return None;
    }
    let (before, link) = rest.split_once("[[")?;
    let target = link.split_once("]]")?.0.split('|').next()?.trim().trim_start_matches(':');
    let title = target.replace('_', " ");
    let prominence = (1..=3).find(|n| line.contains(&format!("Vital articles/Level {n}|"))).unwrap_or(4);
    //articles from the levels above are in bold (Level 3) or bold italics (Levels 1 and 2), which isn't a work's italics
    let quotes = before.chars().rev().take_while(|&c| c == '\'').count();
    let marking = match prominence {
        1 | 2 => 5,
        3 => 3,
        _ => 0,
    };
    Some((title, prominence, quotes.saturating_sub(marking) >= 2))
}
