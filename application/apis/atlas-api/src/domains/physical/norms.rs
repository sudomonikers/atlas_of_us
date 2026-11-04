//where a reading sits among people of the same sex and age, from a measurement's norms (MeasurementNorm). A norm gives
//the value at each of a list of percentiles, and values in between are interpolated
use serde::{Deserialize, Serialize};

//the percentiles a norm gives values at, as in the norms seed (database/physical_norms_import)
pub const PERCENTILES: [f64; 23] = [1., 3., 5., 10., 15., 20., 25., 30., 35., 40., 45., 50., 55., 60., 65., 70., 75., 80., 85., 90., 95., 97., 99.];

//a measurement's norm for one sex and age band
#[derive(Deserialize, Serialize, Clone)]
pub struct Norm {
    pub sex: String, //male, female or all
    pub age_from: i64,
    pub age_to: Option<i64>, //None on the oldest band
    pub percentiles: Vec<f64>,
    pub values: Vec<f64>,
}

//the norm a reading is compared with: the person's sex for norms, or everyone when they haven't given one or there's no
//norm for their sex at that age. None when no band covers the age
pub fn pick<'a>(norms: &'a [Norm], sex: Option<&str>, age: i64) -> Option<&'a Norm> {
    let fits = |n: &&Norm| n.age_from <= age && n.age_to.is_none_or(|to| age <= to);
    sex.and_then(|sex| norms.iter().filter(fits).find(|n| n.sex == sex))
        .or_else(|| norms.iter().filter(fits).find(|n| n.sex == "all"))
}

//the share of people, 0 to 100, with a lower value than this one. Values often repeat (most young adults see 20/20), so a
//value the norm gives at several percentiles sits in the middle of them. A value below every one the norm gives sits
//halfway below its lowest percentile, and one above every one halfway above its highest
pub fn percentile(norm: &Norm, value: f64) -> f64 {
    let (ps, vs) = (&norm.percentiles, &norm.values);
    let below = vs.iter().rposition(|v| *v < value); //the last point under the value
    let above = vs.iter().position(|v| *v > value); //the first point over it
    let from = below.map_or(0, |i| i + 1);
    let to = above.unwrap_or(vs.len());
    if from < to {
        //the value is at one or more points, so it sits in the middle of where it starts and ends. A run that starts at
        //the first point reaches down to 0, and one that ends at the last reaches up to 100
        let start = if from == 0 { 0.0 } else { ps[from] };
        let end = if to == vs.len() { 100.0 } else { ps[to - 1] };
        return round((start + end) / 2.0);
    }
    round(match (below, above) {
        (None, Some(_)) => ps[0] / 2.0,
        (Some(_), None) => (ps[ps.len() - 1] + 100.0) / 2.0,
        (Some(b), Some(a)) => ps[b] + (ps[a] - ps[b]) * (value - vs[b]) / (vs[a] - vs[b]),
        (None, None) => 50.0, //an empty norm
    })
}

fn round(p: f64) -> f64 {
    (p * 10.0).round() / 10.0
}
