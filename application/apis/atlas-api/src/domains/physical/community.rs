//norms for the Atlas's own tests (atlasNorms), worked out from the people who've taken them: each person's latest reading,
//at their age when they took it. They're worked out again whenever someone adds or removes a reading of one, and kept as
//MeasurementNorm nodes like any other norm, so readings are compared the same way. An age group only gets a norm once
//enough people are in it, and groups too small on their own are joined to the next
use std::collections::HashMap;

use axum::http::StatusCode;
use neo4rs::{BoltType, query};
use serde::Deserialize;

use crate::state::AppState;

use super::{age_on, date, internal, norms::PERCENTILES};

//the fewest people a norm is worked out from
const MIN_PEOPLE: usize = 100;
//the age groups, youngest first, before small ones are joined. The last has no top
const DECADES: [(i64, Option<i64>); 6] = [(18, Some(29)), (30, Some(39)), (40, Some(49)), (50, Some(59)), (60, Some(69)), (70, None)];

#[derive(Deserialize)]
struct Taken {
    sex: Option<String>, //the sex they're compared with, or None for everyone
    birthday: String,
    value: f64,
    measured_on: String,
}

//one norm to write: who it covers, how many people it's from, and the value at each percentile
struct Group {
    sex: &'static str,
    age_from: i64,
    age_to: Option<i64>,
    people: usize,
    values: Vec<f64>,
}

//works out a measurement's norms again from everyone's latest reading of it, in place of the ones it had
pub async fn renorm(state: &AppState, measurement_id: &str) -> Result<(), (StatusCode, String)> {
    let mut result = state.graph.execute(query("
        MATCH (m:PhysicalMeasurement {id: $id})<-[r:HAS_MEASUREMENT]-(p:Person)
        WHERE p.birthday IS NOT NULL
        WITH p, r ORDER BY r.measuredOn DESC, r.recordedAt DESC
        WITH p, collect(r)[0] AS r
        RETURN p.normSex AS sex, toString(p.birthday) AS birthday, r.value AS value, toString(r.measuredOn) AS measured_on
    ").param("id", measurement_id)).await.map_err(internal)?;
    let mut taken = Vec::new(); //(sex, age, value)
    while let Some(row) = result.next().await.map_err(internal)? {
        let t = row.to::<Taken>().map_err(internal)?;
        if let (Some(b), Some(on)) = (date(&t.birthday), date(&t.measured_on)) {
            taken.push((t.sex, age_on(b, on), t.value));
        }
    }

    let mut groups = Vec::new();
    for sex in ["all", "male", "female"] {
        let people: Vec<(i64, f64)> = taken.iter()
            .filter(|(s, _, _)| sex == "all" || s.as_deref() == Some(sex))
            .map(|(_, age, value)| (*age, *value))
            .collect();
        groups.extend(bands(&people).into_iter().map(|(age_from, age_to, mut values)| {
            values.sort_by(f64::total_cmp);
            Group { sex, age_from, age_to, people: values.len(), values: at_percentiles(&values) }
        }));
    }

    let norms: Vec<HashMap<&str, BoltType>> = groups.iter().map(|g| HashMap::from([
        ("sex", g.sex.into()),
        ("ageFrom", g.age_from.into()),
        ("ageTo", g.age_to.map_or(BoltType::Null(neo4rs::BoltNull), |t| t.into())),
        ("people", (g.people as i64).into()),
        ("percentiles", PERCENTILES.to_vec().into()),
        ("values", g.values.clone().into()),
    ])).collect();
    state.graph.run(query("
        MATCH (m:PhysicalMeasurement {id: $id})
        CALL (m) {
            MATCH (m)-[:HAS_NORM]->(old:MeasurementNorm)
            DETACH DELETE old
        }
        WITH m
        UNWIND $norms AS n
        CREATE (m)-[:HAS_NORM]->(:MeasurementNorm {
            sex: n.sex, ageFrom: n.ageFrom, ageTo: n.ageTo, percentiles: n.percentiles, values: n.values,
            fromAtlas: true, people: n.people
        })
    ").param("id", measurement_id).param("norms", norms)).await.map_err(internal)?;
    Ok(())
}

//people's values split into age groups of at least MIN_PEOPLE, from 18 up: each decade, joined to the next until it's
//big enough, with what's left at the end joined to the last group. None when there aren't enough people at all
fn bands(people: &[(i64, f64)]) -> Vec<(i64, Option<i64>, Vec<f64>)> {
    let mut out: Vec<(i64, Option<i64>, Vec<f64>)> = Vec::new();
    let mut from = DECADES[0].0;
    let mut gathered = Vec::new();
    for (decade_from, decade_to) in DECADES {
        gathered.extend(people.iter().filter(|(age, _)| *age >= decade_from && decade_to.is_none_or(|to| *age <= to)).map(|(_, v)| *v));
        if gathered.len() >= MIN_PEOPLE {
            out.push((from, decade_to, std::mem::take(&mut gathered)));
            from = decade_to.map_or(i64::MAX, |to| to + 1);
        }
    }
    if let Some(last) = out.last_mut() {
        if !gathered.is_empty() || last.1.is_some() {
            last.1 = None;
            last.2.append(&mut gathered);
        }
    }
    out
}

//the value at each of the percentiles, from sorted values, between the two nearest people
fn at_percentiles(sorted: &[f64]) -> Vec<f64> {
    PERCENTILES.iter().map(|p| {
        let at = p / 100.0 * (sorted.len() - 1) as f64;
        let (low, high) = (sorted[at.floor() as usize], sorted[at.ceil() as usize]);
        ((low + (high - low) * at.fract()) * 10.0).round() / 10.0
    }).collect()
}
