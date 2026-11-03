//reads BodyParts3D's lists: every concept it has a model of, by FMA id, the meshes each is made of, and its part-of and
//is-a trees. A concept is one or more element meshes, so the left femur is one mesh and the skeletal system is many
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::Path,
};

use crate::BoxError;

pub struct Bp3d {
    pub names: BTreeMap<String, String>,             //every concept's name, by FMA id
    pub elements: BTreeMap<String, BTreeSet<String>>, //the element meshes each concept is made of
    pub part_of: BTreeSet<(String, String)>,          //(part, whole)
    pub is_a: BTreeSet<(String, String)>,             //(kind, broader kind)
}

//a tab-separated list's rows, without its header
fn rows(path: &Path) -> Result<Vec<Vec<String>>, BoxError> {
    let text = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(text.lines().skip(1).filter(|l| !l.is_empty()).map(|l| l.split('\t').map(|c| c.trim().to_string()).collect()).collect())
}

pub fn read(dir: &Path) -> Result<Bp3d, BoxError> {
    let mut bp3d = Bp3d { names: BTreeMap::new(), elements: BTreeMap::new(), part_of: BTreeSet::new(), is_a: BTreeSet::new() };
    for tree in ["isa", "partof"] {
        //concept id, representation id, name
        for row in rows(&dir.join(format!("{tree}_parts_list_e.txt")))? {
            if let [id, _, name, ..] = row.as_slice() {
                bp3d.names.insert(id.clone(), name.clone());
            }
        }
        //concept id, name, element file id
        for row in rows(&dir.join(format!("{tree}_element_parts.txt")))? {
            if let [id, _, element, ..] = row.as_slice() {
                bp3d.elements.entry(id.clone()).or_default().insert(element.clone());
            }
        }
        //parent id, parent name, child id, child name
        for row in rows(&dir.join(format!("{tree}_inclusion_relation_list.txt")))? {
            if let [parent, _, child, ..] = row.as_slice() {
                let link = (child.clone(), parent.clone());
                if tree == "isa" { bp3d.is_a.insert(link) } else { bp3d.part_of.insert(link) };
            }
        }
    }
    Ok(bp3d)
}
