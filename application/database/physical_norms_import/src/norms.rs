//survey weighted percentiles. Each NHANES respondent stands for a number of people in the US population, their exam
//weight, so a percentile is where that share of the weight falls, not that share of the respondents

//the percentiles each norm gives a value for
pub const PERCENTILES: [f64; 23] = [1., 3., 5., 10., 15., 20., 25., 30., 35., 40., 45., 50., 55., 60., 65., 70., 75., 80., 85., 90., 95., 97., 99.];

//the value at each of PERCENTILES, from (value, weight) pairs. Each respondent sits at the middle of their weight, and
//values between them are interpolated
pub fn percentiles(mut samples: Vec<(f64, f64)>) -> Vec<f64> {
    samples.sort_by(|a, b| a.0.total_cmp(&b.0));
    let total: f64 = samples.iter().map(|s| s.1).sum();
    let mut below = 0.0;
    let positions: Vec<(f64, f64)> = samples.iter().map(|(value, weight)| {
        let at = (below + weight / 2.0) / total * 100.0;
        below += weight;
        (at, *value)
    }).collect();
    PERCENTILES.iter().map(|p| {
        let i = positions.partition_point(|(at, _)| at < p);
        let value = match i {
            0 => positions[0].1,
            i if i == positions.len() => positions[i - 1].1,
            i => {
                let (a, b) = (positions[i - 1], positions[i]);
                a.1 + (b.1 - a.1) * (p - a.0) / (b.0 - a.0)
            }
        };
        (value * 10.0).round() / 10.0
    }).collect()
}
