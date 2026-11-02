//writes the physical norms seed: for each measurement, the value at each percentile of the US population, by sex and
//age band, worked out from NHANES with its survey weights. See README.md
mod measurements;
mod norms;
mod xpt;

use std::{
    collections::{BTreeSet, HashMap},
    env, fs,
    fmt::Write,
    path::{Path, PathBuf},
    process::ExitCode,
};

use measurements::{Cycle, MEASUREMENTS, Measurement};

type BoxError = Box<dyn std::error::Error + Send + Sync>;

const USAGE: &str = "usage: physical-norms-import <data-dir> <seed-file>\n       physical-norms-import --urls";

//age bands, from and to inclusive. NHANES records everyone 80 and over as 80
const BANDS: [(u32, Option<u32>); 8] = [
    (12, Some(17)), (18, Some(29)), (30, Some(39)), (40, Some(49)), (50, Some(59)), (60, Some(69)), (70, Some(79)), (80, None),
];
//the fewest respondents a norm is worked out from. Smaller groups are left out
const MIN_RESPONDENTS: usize = 100;

//a respondent's place in the population and their value
struct Sample {
    sex: &'static str,
    age: u32,
    weight: f64,
    value: f64,
}

struct Norm {
    measurement: &'static str,
    sex: &'static str,
    age_from: u32,
    age_to: Option<u32>,
    values: Vec<f64>,
}

fn main() -> ExitCode {
    let args: Vec<String> = env::args().skip(1).collect();
    let result = match args.as_slice() {
        [flag] if flag == "--urls" => {
            urls().iter().for_each(|u| println!("{u}"));
            Ok(())
        }
        [dir, seed] => run(Path::new(dir), Path::new(seed)),
        _ => {
            eprintln!("{USAGE}");
            return ExitCode::FAILURE;
        }
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{e}");
            ExitCode::FAILURE
        }
    }
}

//every file the seed is worked out from
fn files() -> BTreeSet<(&'static str, String)> {
    MEASUREMENTS.iter()
        .flat_map(|m| m.cycles.iter().flat_map(|c| [(c.folder, format!("DEMO{}", c.suffix)), (c.folder, format!("{}{}", m.file, c.suffix))]))
        .collect()
}

fn urls() -> Vec<String> {
    files().iter().map(|(folder, file)| format!("https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/{folder}/DataFiles/{file}.xpt")).collect()
}

fn run(dir: &Path, seed: &Path) -> Result<(), BoxError> {
    let missing: Vec<PathBuf> = files().iter().map(|(_, f)| dir.join(format!("{f}.xpt"))).filter(|p| !p.exists()).collect();
    if !missing.is_empty() {
        let list = missing.iter().map(|p| format!("  {}", p.display())).collect::<Vec<_>>().join("\n");
        return Err(format!("missing NHANES files, see README.md for downloading them:\n{list}").into());
    }

    let mut demographics: HashMap<&str, xpt::Rows> = HashMap::new();
    let mut norms = Vec::new();
    for m in MEASUREMENTS {
        let samples = samples(dir, m, &mut demographics)?;
        let before = norms.len();
        for (age_from, age_to) in BANDS {
            for sex in ["male", "female", "all"] {
                let group: Vec<(f64, f64)> = samples.iter()
                    .filter(|s| s.age >= age_from && age_to.is_none_or(|to| s.age <= to) && (sex == "all" || s.sex == sex))
                    .map(|s| (s.value, s.weight))
                    .collect();
                if group.len() >= MIN_RESPONDENTS {
                    norms.push(Norm { measurement: m.name, sex, age_from, age_to, values: norms::percentiles(group) });
                }
            }
        }
        println!("{}: {} respondents, {} norms", m.name, samples.len(), norms.len() - before);
    }

    fs::write(seed, cypher(&norms))?;
    println!("wrote {}", seed.display());
    Ok(())
}

//everyone in the measurement's cycles with a value, sex, age and exam weight, leaving out pregnant women. Each cycle's
//weights stand for the whole population, so with several cycles each weight is divided by how many there are
fn samples(dir: &Path, m: &Measurement, demographics: &mut HashMap<&'static str, xpt::Rows>) -> Result<Vec<Sample>, BoxError> {
    let mut samples = Vec::new();
    for cycle in m.cycles {
        if !demographics.contains_key(cycle.suffix) {
            demographics.insert(cycle.suffix, xpt::read(&dir.join(format!("DEMO{}.xpt", cycle.suffix)))?);
        }
        let people = &demographics[cycle.suffix];
        let rows = xpt::read(&dir.join(format!("{}{}.xpt", m.file, cycle.suffix)))?;
        if let Some(var) = m.value.vars().into_iter().find(|v| !rows.values().any(|r| r.contains_key(*v))) {
            return Err(format!("{}{} has no {var}", m.file, cycle.suffix).into());
        }
        for (seqn, row) in &rows {
            let Some(person) = people.get(seqn) else { continue };
            let sex = match person.get("RIAGENDR") {
                Some(1.0) => "male",
                Some(2.0) => "female",
                _ => continue,
            };
            let (Some(age), Some(weight), Some(value)) = (person.get("RIDAGEYR"), person.get("WTMEC2YR"), m.value.read(row)) else { continue };
            if *weight <= 0.0 || person.get("RIDEXPRG") == Some(&1.0) {
                continue;
            }
            samples.push(Sample { sex, age: *age as u32, weight: weight / m.cycles.len() as f64, value });
        }
    }
    Ok(samples)
}

fn cypher(norms: &[Norm]) -> String {
    let mut out = String::new();
    let sources = MEASUREMENTS.iter()
        .map(|m| format!("//   {:<25} {}", m.name, m.cycles.iter().map(|c: &Cycle| c.years).collect::<Vec<_>>().join(", ")))
        .collect::<Vec<_>>()
        .join("\n");
    let _ = write!(out, "\
// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: measurements and norms
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// Generated by database/physical_norms_import. Change its measurements.rs and
// run it again rather than editing this file.
//
// One PhysicalMeasurement per measurement, each with a MeasurementNorm per sex
// (male, female and all) and age band: the value at each percentile of the US
// population, worked out from NHANES with its survey weights. A person's
// percentile is worked out from these when it's read. Measurements that show
// an ability link to it with MEASURES, so run physical_abilities_seed.cypher
// first.
//
// Source: the National Health and Nutrition Examination Survey (NHANES), by
// the CDC's National Center for Health Statistics. Public domain.
{sources}
//
// Idempotent: safe to re-run. Measurements MERGE on name and keep their id,
// and their norms are replaced on every run.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT physicalmeasurement_name_unique IF NOT EXISTS
FOR (n:PhysicalMeasurement) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT physicalmeasurement_id_unique IF NOT EXISTS
FOR (n:PhysicalMeasurement) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Measurements
// -----------------------------------------------------------------------------

UNWIND [
");
    let rows: Vec<String> = MEASUREMENTS.iter().map(|m| format!(
        "  {{ name: {}, unit: {}, better: {}, group: {}, min: {:.1}, max: {:.1},\n    description: {} }}",
        quote(m.name), quote(m.unit), quote(m.better), quote(m.group), m.range.0, m.range.1, quote(&m.description.split_whitespace().collect::<Vec<_>>().join(" ")),
    )).collect();
    let _ = write!(out, "{}\n] AS m
MERGE (n:PhysicalMeasurement {{name: m.name}})
ON CREATE SET n.id = randomUUID()
SET n.unit = m.unit,
    n.better = m.better,
    n.group = m.group,
    n.min = m.min,
    n.max = m.max,
    n.description = m.description;


// -----------------------------------------------------------------------------
// 2. Abilities they measure
// -----------------------------------------------------------------------------

UNWIND [
", rows.join(",\n"));
    let links: Vec<String> = MEASUREMENTS.iter()
        .flat_map(|m| m.abilities.iter().map(move |a| format!("  {{ measurement: {}, ability: {} }}", quote(m.name), quote(a))))
        .collect();
    let percentiles = format!("[{}]", norms::PERCENTILES.iter().map(|p| format!("{p:.1}")).collect::<Vec<_>>().join(", "));
    let _ = write!(out, "{}\n] AS l
MATCH (m:PhysicalMeasurement {{name: l.measurement}})
MATCH (a:Ability {{name: l.ability}})
MERGE (m)-[:MEASURES]->(a);


// -----------------------------------------------------------------------------
// 3. Norms
// -----------------------------------------------------------------------------

MATCH (:PhysicalMeasurement)-[:HAS_NORM]->(n:MeasurementNorm)
DETACH DELETE n;

UNWIND [
", links.join(",\n"));
    let rows: Vec<String> = norms.iter().map(|n| format!(
        "  {{ measurement: {}, sex: {}, ageFrom: {}, ageTo: {},\n    values: [{}] }}",
        quote(n.measurement), quote(n.sex), n.age_from, n.age_to.map_or("null".into(), |t| t.to_string()),
        n.values.iter().map(|v| format!("{v:.1}")).collect::<Vec<_>>().join(", "),
    )).collect();
    let _ = write!(out, "{}\n] AS norm
MATCH (m:PhysicalMeasurement {{name: norm.measurement}})
CREATE (m)-[:HAS_NORM]->(:MeasurementNorm {{
  sex: norm.sex, ageFrom: norm.ageFrom, ageTo: norm.ageTo,
  percentiles: {percentiles}, values: norm.values
}});
", rows.join(",\n"));
    out
}

fn quote(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
}
