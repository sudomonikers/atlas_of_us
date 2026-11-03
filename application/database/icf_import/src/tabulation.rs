//reads WHO's simple tabulation of ICF: one row per chapter, block and category, each with the URI of its parent. Blocks
//are groupings without a code, such as "Mental functions", and categories are the coded entities, such as b144 Memory
//functions
use std::{collections::HashMap, path::Path};

use crate::BoxError;

pub const FILE: &str = "SimpleTabulation-ICF-en.txt";

pub struct Category {
    pub code: String,
    pub title: String,
    pub kind: &'static str, //function or structure
    pub uri: String,        //the foundation URI, which never changes between releases
    pub entity: String,     //the id the ICD-API knows it by in the ICF linearization
    pub parent: Option<String>, //the code of the category it's part of, if it's part of one rather than only a block
    pub chapter: String,    //the block it's under, such as "Mental functions"
    pub section: Option<String>, //the block under that, where there is one, such as "Global mental functions"
}

struct Row {
    code: String,
    block: String,
    title: String,
    kind: String,
    residual: bool,
    parent: String,
    linearization: String,
}

//the body functions (b) and body structures (s), leaving out the residual "other specified" and "unspecified" ones
pub fn categories(dir: &Path) -> Result<Vec<Category>, BoxError> {
    let path = dir.join(FILE);
    let mut reader = csv::ReaderBuilder::new()
        .delimiter(b'\t')
        .flexible(true)
        .from_path(&path)
        .map_err(|e| format!("{}: {e}", path.display()))?;
    let headers = reader.headers()?.clone();
    let column = |name: &str| headers.iter().position(|h| h.trim_start_matches('\u{feff}') == name).ok_or(format!("{FILE} has no {name} column"));
    let (uri, linearization, code, block, title, kind, residual, parent) = (
        column("Foundation URI")?, column("Linearization URI")?, column("Code")?, column("BlockId")?, column("Title")?,
        column("ClassKind")?, column("IsResidual")?, column("Parent")?,
    );

    let mut rows: HashMap<String, Row> = HashMap::new();
    let mut order = Vec::new();
    for record in reader.records() {
        let r = record?;
        let get = |i: usize| r.get(i).unwrap_or_default().to_string();
        let row = Row {
            code: get(code),
            block: get(block),
            //titles are indented with "- " for each level
            title: get(title).trim_start_matches(['-', ' ']).to_string(),
            kind: get(kind),
            residual: get(residual) == "True",
            parent: get(parent),
            linearization: get(linearization),
        };
        let key = get(uri);
        if key.is_empty() {
            continue; //residual categories have no foundation URI
        }
        order.push(key.clone());
        rows.insert(key, row);
    }

    let mut categories = Vec::new();
    for key in order {
        let row = &rows[&key];
        let kind = match row.code.chars().next() {
            Some('b') => "function",
            Some('s') => "structure",
            _ => continue,
        };
        if row.kind != "category" || row.residual {
            continue;
        }
        //the nearest category above it, and the blocks above that
        let mut parent = None;
        let (mut chapter, mut section) = (None, None);
        let mut up = rows.get(&row.parent);
        while let Some(above) = up {
            if above.kind == "category" && parent.is_none() {
                parent = Some(above.code.clone());
            }
            if above.block.starts_with("BlockL2") {
                chapter = Some(above.title.clone());
            }
            if above.block.starts_with("BlockL3") {
                section = Some(above.title.clone());
            }
            up = rows.get(&above.parent);
        }
        categories.push(Category {
            code: row.code.clone(),
            title: row.title.clone(),
            kind,
            uri: key.clone(),
            entity: row.linearization.rsplit('/').next().unwrap_or_default().to_string(),
            parent,
            chapter: chapter.ok_or(format!("{} isn't under a chapter", row.code))?,
            section,
        });
    }
    Ok(categories)
}
