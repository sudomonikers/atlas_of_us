//reads the numeric columns of a SAS transport (XPORT v5) file, the format NHANES publishes its data in. Every record
//is 80 bytes: a few header records, one 140 byte description per variable, then the rows, with numbers stored as IBM
//mainframe floats
use std::{collections::HashMap, fs, path::Path};

use crate::BoxError;

const RECORD: usize = 80;
const NAMESTR: usize = 140;

//a file's rows by respondent (SEQN), each the named numeric columns it has a value for
pub type Rows = HashMap<u64, HashMap<String, f64>>;

pub fn read(path: &Path) -> Result<Rows, BoxError> {
    let data = fs::read(path).map_err(|e| format!("{}: {e}", path.display()))?;
    if !data.starts_with(b"HEADER RECORD*******LIBRARY HEADER RECORD") {
        return Err(format!("{} isn't a SAS transport file", path.display()).into());
    }
    //the namestr header is the 8th record and gives the number of variables
    let header = &data[RECORD * 7..RECORD * 8];
    let count: usize = std::str::from_utf8(&header[54..58])?.trim().parse()?;

    struct Var { name: String, numeric: bool, length: usize, position: usize }
    let start = RECORD * 8;
    let vars: Vec<Var> = (0..count).map(|i| {
        let n = &data[start + i * NAMESTR..start + (i + 1) * NAMESTR];
        Var {
            name: String::from_utf8_lossy(&n[8..16]).trim().to_string(),
            numeric: i16::from_be_bytes([n[0], n[1]]) == 1,
            length: i16::from_be_bytes([n[4], n[5]]) as usize,
            position: i32::from_be_bytes([n[84], n[85], n[86], n[87]]) as usize,
        }
    }).collect();

    //the descriptions are padded to a whole record, then one more record heads the rows
    let mut at = (start + count * NAMESTR).div_ceil(RECORD) * RECORD + RECORD;
    let width: usize = vars.iter().map(|v| v.length).sum();
    let mut rows = Rows::new();
    while at + width <= data.len() {
        let row = &data[at..at + width];
        at += width;
        if row.iter().all(|b| *b == b' ') {
            break; //the padding after the last row
        }
        let values: HashMap<String, f64> = vars.iter()
            .filter(|v| v.numeric)
            .filter_map(|v| ibm(&row[v.position..v.position + v.length]).map(|x| (v.name.clone(), x)))
            .collect();
        if let Some(seqn) = values.get("SEQN") {
            rows.insert(*seqn as u64, values);
        }
    }
    Ok(rows)
}

//an IBM float: a sign bit, a base 16 exponent biased by 64, and the rest a fraction. Shorter numbers drop trailing bytes.
//A missing value is a single marker byte followed by zeros
fn ibm(bytes: &[u8]) -> Option<f64> {
    let mut b = [0u8; 8];
    b[..bytes.len()].copy_from_slice(bytes);
    if b[1..].iter().all(|x| *x == 0) {
        return if b[0] == 0 { Some(0.0) } else { None };
    }
    let sign = if b[0] & 0x80 != 0 { -1.0 } else { 1.0 };
    let exponent = (b[0] & 0x7f) as i32 - 64;
    let fraction = u64::from_be_bytes([0, b[1], b[2], b[3], b[4], b[5], b[6], b[7]]) as f64 / (1u64 << 56) as f64;
    Some(sign * fraction * 16f64.powi(exponent))
}
