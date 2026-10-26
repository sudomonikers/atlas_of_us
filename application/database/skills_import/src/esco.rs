//reads ESCO from Tabiya's csv export of it (github.com/tabiya-tech/taxonomy-model-application, data-sets/csv/esco-v1.1.2,
//CC BY 4.0): the label of every skill, broader skills first
use std::{collections::HashMap, path::Path};

use serde::Deserialize;

use crate::BoxError;

const SKILLS_FILE: &str = "skills.csv";
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

//one link of the hierarchy, between skills or the groups ESCO files them under
#[derive(Deserialize)]
struct HierarchyRow {
    #[serde(rename = "PARENTOBJECTTYPE")]
    parent_type: String,
    #[serde(rename = "PARENTID")]
    parent_id: String,
    #[serde(rename = "CHILDID")]
    child_id: String,
    #[serde(rename = "CHILDOBJECTTYPE")]
    child_type: String,
}

//the labels of the "skill/competence" entries (its "knowledge" entries belong to the Topics sub-graph). Broader skills
//come before narrower ones, so when a narrower one is asked for, the resolver can find the skills it's a kind of
pub fn labels(dir: &Path) -> Result<Vec<String>, BoxError> {
    let mut reader = csv::Reader::from_path(dir.join(SKILLS_FILE)).map_err(|e| format!("{SKILLS_FILE}: {e}"))?;
    let mut skills: Vec<(String, String)> = Vec::new();
    for row in reader.deserialize::<SkillRow>() {
        let row = row.map_err(|e| format!("{SKILLS_FILE}: {e}"))?;
        if row.skill_type == "skill/competence" {
            skills.push((row.id, row.label.trim().to_string()));
        }
    }

    //each skill's broader skills, by the file's ids
    let mut broader: HashMap<String, Vec<String>> = HashMap::new();
    let mut reader = csv::Reader::from_path(dir.join(HIERARCHY_FILE)).map_err(|e| format!("{HIERARCHY_FILE}: {e}"))?;
    for row in reader.deserialize::<HierarchyRow>() {
        let row = row.map_err(|e| format!("{HIERARCHY_FILE}: {e}"))?;
        if row.parent_type == "skill" && row.child_type == "skill" && row.parent_id != row.child_id {
            broader.entry(row.child_id).or_default().push(row.parent_id);
        }
    }

    //sorted by how many broader skills are above each one, keeping the file's order otherwise
    let mut depths: HashMap<String, usize> = HashMap::new();
    let mut ordered: Vec<(usize, String)> = skills.into_iter()
        .map(|(id, label)| (depth(&id, &broader, &mut depths, 0), label))
        .collect();
    ordered.sort_by_key(|(depth, _)| *depth);
    Ok(ordered.into_iter().map(|(_, label)| label).collect())
}

//the longest chain of broader skills above `id`, through any of a skill's broader skills. `level` stops a loop in the hierarchy
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
