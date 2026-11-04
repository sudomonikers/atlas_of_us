//writes the physical norms seed: for each measurement, the value at each percentile of the US population, by sex and
//age band, worked out from NHANES with its survey weights, and the self-tests with their norms from published studies.
//See README.md
mod measurements;
mod norms;
mod published;
mod xpt;

use std::{
    collections::{BTreeSet, HashMap},
    env, fs,
    fmt::Write,
    path::{Path, PathBuf},
    process::ExitCode,
};

use measurements::{Cycle, MEASUREMENTS, Measurement};
use published::{Norms, TESTS};

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
    percentiles: Vec<f64>,
    values: Vec<f64>,
}

//what the seed writes for each measurement, from NHANES or a self-test
struct Row {
    name: &'static str,
    unit: &'static str,
    better: &'static str,
    group: &'static str,
    range: (f64, f64),
    description: &'static str,
    abilities: &'static [&'static str],
    confidence: f64,
    test: Option<&'static str>,
    timer: Option<u32>,
    protocol: &'static [&'static str],
    source: String,
    atlas_norms: bool, //its norms come from Atlas users' readings, worked out by the api
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
                    norms.push(Norm { measurement: m.name, sex, age_from, age_to, percentiles: norms::PERCENTILES.to_vec(), values: norms::percentiles(group) });
                }
            }
        }
        println!("{}: {} respondents, {} norms", m.name, samples.len(), norms.len() - before);
    }
    //a self-test's values are kept within what can be recorded, so a ceiling, such as 45 seconds on one leg, is where
    //the best readings bunch up
    for t in TESTS {
        let groups = t.norms.groups();
        println!("{}: {} norms", t.name, groups.len());
        norms.extend(groups.into_iter().map(|(sex, age_from, age_to, percentiles, values)| Norm {
            measurement: t.name, sex, age_from, age_to, percentiles,
            values: values.into_iter().map(|v| v.clamp(t.range.0, t.range.1)).collect(),
        }));
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

//every measurement the seed writes: NHANES's, then the self-tests
fn rows() -> Vec<Row> {
    let nhanes = MEASUREMENTS.iter().map(|m| Row {
        name: m.name, unit: m.unit, better: m.better, group: m.group, range: m.range, description: m.description,
        abilities: m.abilities, confidence: m.confidence, test: m.test, timer: None, protocol: &[], atlas_norms: false,
        source: format!("NHANES, the CDC's National Health and Nutrition Examination Survey, {}.", m.cycles.iter().map(|c: &Cycle| c.years).collect::<Vec<_>>().join(", ")),
    });
    let tests = TESTS.iter().map(|t| Row {
        name: t.name, unit: t.unit, better: t.better, group: t.group, range: t.range, description: t.description,
        abilities: t.abilities, confidence: t.confidence, test: Some(t.test), timer: t.timer, protocol: t.protocol, source: t.source.to_string(),
        atlas_norms: matches!(t.norms, Norms::Atlas),
    });
    nhanes.chain(tests).collect()
}

fn cypher(norms: &[Norm]) -> String {
    let mut out = String::new();
    let rows = rows();
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
// (male, female and all) and age band: the value at each of a list of
// percentiles. A person's percentile is worked out from these when it's read.
// Measurements that show an ability link to it with MEASURES, so run
// physical_abilities_seed.cypher first. `confidence` is how much a reading says
// about those abilities.
//
// Most norms are worked out from the National Health and Nutrition
// Examination Survey (NHANES), by the CDC's National Center for Health
// Statistics, with its survey weights. Public domain.
{sources}
//
// The self-tests, which a person takes at home (`test` is home, with the steps
// in `protocol`) or in the app (`test` names the one the app runs), have norms
// from the published studies and surveys in each one's `source`. Those with
// `atlasNorms` start with none: the api works out their norms from Atlas
// users' readings once enough people have taken them, and this seed keeps them.
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
    let written: Vec<String> = rows.iter().map(|m| format!(
        "  {{ name: {}, unit: {}, better: {}, group: {}, min: {:.1}, max: {:.1}, confidence: {:.1}, test: {}, timer: {}, atlasNorms: {},\n    description: {},\n    protocol: [{}],\n    source: {} }}",
        quote(m.name), quote(m.unit), quote(m.better), quote(m.group), m.range.0, m.range.1, m.confidence,
        m.test.map_or("null".into(), quote), m.timer.map_or("null".into(), |t| t.to_string()), m.atlas_norms,
        quote(&words(m.description)),
        m.protocol.iter().map(|p| quote(p)).collect::<Vec<_>>().join(", "), quote(&words(&m.source)),
    )).collect();
    let _ = write!(out, "{}\n] AS m
MERGE (n:PhysicalMeasurement {{name: m.name}})
ON CREATE SET n.id = randomUUID()
SET n.unit = m.unit,
    n.better = m.better,
    n.group = m.group,
    n.min = m.min,
    n.max = m.max,
    n.confidence = m.confidence,
    n.test = m.test,
    n.timer = m.timer,
    n.atlasNorms = m.atlasNorms,
    n.protocol = m.protocol,
    n.source = m.source,
    n.description = m.description;


// -----------------------------------------------------------------------------
// 2. Abilities they measure
// -----------------------------------------------------------------------------

UNWIND [
", written.join(",\n"));
    let links: Vec<String> = rows.iter()
        .flat_map(|m| m.abilities.iter().map(move |a| format!("  {{ measurement: {}, ability: {} }}", quote(m.name), quote(a))))
        .collect();
    let _ = write!(out, "{}\n] AS l
MATCH (m:PhysicalMeasurement {{name: l.measurement}})
MATCH (a:Ability {{name: l.ability}})
MERGE (m)-[:MEASURES]->(a);


// -----------------------------------------------------------------------------
// 3. Norms
// -----------------------------------------------------------------------------

MATCH (m:PhysicalMeasurement)-[:HAS_NORM]->(n:MeasurementNorm)
WHERE NOT (m.atlasNorms AND coalesce(n.fromAtlas, false))
DETACH DELETE n;

UNWIND [
", links.join(",\n"));
    let list = |xs: &[f64]| xs.iter().map(|v| format!("{v:.1}")).collect::<Vec<_>>().join(", ");
    let written: Vec<String> = norms.iter().map(|n| format!(
        "  {{ measurement: {}, sex: {}, ageFrom: {}, ageTo: {},\n    percentiles: [{}],\n    values: [{}] }}",
        quote(n.measurement), quote(n.sex), n.age_from, n.age_to.map_or("null".into(), |t| t.to_string()),
        list(&n.percentiles), list(&n.values),
    )).collect();
    let _ = write!(out, "{}\n] AS norm
MATCH (m:PhysicalMeasurement {{name: norm.measurement}})
CREATE (m)-[:HAS_NORM]->(:MeasurementNorm {{
  sex: norm.sex, ageFrom: norm.ageFrom, ageTo: norm.ageTo,
  percentiles: norm.percentiles, values: norm.values
}});
", written.join(",\n"));
    out
}

//a description written across lines in the source, as one line
fn words(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn quote(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
}
