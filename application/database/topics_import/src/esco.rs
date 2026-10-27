//reads ESCO from Tabiya's csv export of it (github.com/tabiya-tech/taxonomy-model-application, data-sets/csv/esco-v1.1.2,
//CC BY 4.0): the label of every knowledge entry and of every group they're filed under, broader ones first
use std::{
    collections::{HashMap, HashSet},
    path::Path,
};

use serde::Deserialize;

use crate::BoxError;

const SKILLS_FILE: &str = "skills.csv";
const GROUPS_FILE: &str = "skill_groups.csv";
const HIERARCHY_FILE: &str = "skill_hierarchy.csv";

#[derive(Deserialize)]
struct SkillRow {
    #[serde(rename = "ID")]
    id: String,
    #[serde(rename = "SKILLTYPE")]
    skill_type: String,
    #[serde(rename = "PREFERREDLABEL")]
    label: String,
}

#[derive(Deserialize)]
struct GroupRow {
    #[serde(rename = "ORIGINURI")]
    uri: String,
    #[serde(rename = "ID")]
    id: String,
    #[serde(rename = "PREFERREDLABEL")]
    label: String,
}

//one link of the hierarchy, between skills or the groups ESCO files them under
#[derive(Deserialize)]
struct HierarchyRow {
    #[serde(rename = "PARENTID")]
    parent_id: String,
    #[serde(rename = "CHILDID")]
    child_id: String,
}

//the labels of the "knowledge" entries (its "skill/competence" entries are the skills import's) and of the fields of
//study above them, ESCO's groups from ISCED-F (such as "philosophy and ethics"). Broader ones come before narrower
//ones, so when a narrower one is asked for, the resolver can find the topics it's a subtopic of
pub fn labels(dir: &Path) -> Result<Vec<String>, BoxError> {
    let mut labels: HashMap<String, String> = HashMap::new();
    let mut knowledge: Vec<String> = Vec::new();
    let mut reader = csv::Reader::from_path(dir.join(SKILLS_FILE)).map_err(|e| format!("{SKILLS_FILE}: {e}"))?;
    for row in reader.deserialize::<SkillRow>() {
        let row = row.map_err(|e| format!("{SKILLS_FILE}: {e}"))?;
        if row.skill_type == "knowledge" {
            knowledge.push(row.id.clone());
            labels.insert(row.id, row.label.trim().to_string());
        }
    }
    //the fields of study. ESCO's other groups ("transversal skills and competences", "knowledge") are its own filing
    let mut groups: HashMap<String, String> = HashMap::new();
    let mut reader = csv::Reader::from_path(dir.join(GROUPS_FILE)).map_err(|e| format!("{GROUPS_FILE}: {e}"))?;
    for row in reader.deserialize::<GroupRow>() {
        let row = row.map_err(|e| format!("{GROUPS_FILE}: {e}"))?;
        if row.uri.contains("/isced-f/") {
            groups.insert(row.id, row.label.trim().to_string());
        }
    }

    //every link, child to its parents, by the files' ids
    let mut parents: HashMap<String, Vec<String>> = HashMap::new();
    let mut reader = csv::Reader::from_path(dir.join(HIERARCHY_FILE)).map_err(|e| format!("{HIERARCHY_FILE}: {e}"))?;
    for row in reader.deserialize::<HierarchyRow>() {
        let row = row.map_err(|e| format!("{HIERARCHY_FILE}: {e}"))?;
        if row.parent_id != row.child_id {
            parents.entry(row.child_id).or_default().push(row.parent_id);
        }
    }

    //the fields above any knowledge entry, through other fields. Fields holding only skills are left out
    let mut fields: HashSet<String> = HashSet::new();
    let mut climbing: Vec<String> = knowledge.clone();
    while let Some(id) = climbing.pop() {
        for parent in parents.get(&id).into_iter().flatten() {
            if let Some(label) = groups.get(parent)
                && fields.insert(parent.clone()) {
                labels.insert(parent.clone(), label.clone());
                climbing.push(parent.clone());
            }
        }
    }

    //each one's broader topics: the knowledge entries and fields above it
    let broader: HashMap<String, Vec<String>> = parents.into_iter()
        .filter(|(child, _)| labels.contains_key(child))
        .map(|(child, parents)| (child, parents.into_iter().filter(|p| labels.contains_key(p)).collect()))
        .collect();

    //sorted by how many broader topics are above each one, fields before entries at the same depth, and by label
    //otherwise, with each label asked for once
    let mut depths: HashMap<String, usize> = HashMap::new();
    let mut ordered: Vec<(usize, bool, &String)> = labels.iter()
        .map(|(id, label)| (depth(id, &broader, &mut depths, 0), !fields.contains(id), label))
        .collect();
    ordered.sort();
    let mut asked: HashSet<String> = HashSet::new();
    Ok(ordered.into_iter()
        .filter(|(_, _, label)| asked.insert(label.to_lowercase()))
        .map(|(_, _, label)| label.clone())
        .collect())
}

//the longest chain of broader topics above `id`, through any of its broader topics. `level` stops a loop in the hierarchy
fn depth(id: &str, broader: &HashMap<String, Vec<String>>, depths: &mut HashMap<String, usize>, level: usize) -> usize {
    if let Some(&depth) = depths.get(id) {
        return depth;
    }
    let depth = match broader.get(id) {
        Some(parents) if level < 32 => parents.iter().map(|p| depth(p, broader, depths, level + 1) + 1).max().unwrap_or(0),
        _ => 0,
    };
    depths.insert(id.to_string(), depth);
    depth
}
