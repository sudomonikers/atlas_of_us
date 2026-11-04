//the measurements the seed has norms for, and where in NHANES each one comes from
use std::collections::HashMap;

//one NHANES survey cycle. Its files are <file><suffix>.xpt, with its demographics in DEMO<suffix>.xpt
pub struct Cycle {
    pub years: &'static str,
    pub folder: &'static str, //the cycle's folder on the CDC site, its first year
    pub suffix: &'static str,
}

const C1999: Cycle = Cycle { years: "1999-2000", folder: "1999", suffix: "" };
const C2001: Cycle = Cycle { years: "2001-2002", folder: "2001", suffix: "_B" };
const C2003: Cycle = Cycle { years: "2003-2004", folder: "2003", suffix: "_C" };
const C2005: Cycle = Cycle { years: "2005-2006", folder: "2005", suffix: "_D" };
const C2007: Cycle = Cycle { years: "2007-2008", folder: "2007", suffix: "_E" };
const C2011: Cycle = Cycle { years: "2011-2012", folder: "2011", suffix: "_G" };
const C2013: Cycle = Cycle { years: "2013-2014", folder: "2013", suffix: "_H" };
const C2015: Cycle = Cycle { years: "2015-2016", folder: "2015", suffix: "_I" };
const C2017: Cycle = Cycle { years: "2017-2018", folder: "2017", suffix: "_J" };
const C2021: Cycle = Cycle { years: "2021-2023", folder: "2021", suffix: "_L" };

//how a person's value is read from their row
pub enum Value {
    Var(&'static str),
    Mean(&'static [&'static str]), //the mean of the readings they have, such as three blood pressure readings
    Max(&'static [&'static str]),  //the best of their trials
    BetterEar,                     //the pure tone average of the better ear
    BetterEye,                     //the Snellen denominator of the better eye
}

pub struct Measurement {
    pub name: &'static str,
    pub unit: &'static str,
    pub better: &'static str, //higher, lower or neither
    pub group: &'static str,  //Body, Vitals, Fitness or Senses, how they're grouped on the page
    pub range: (f64, f64),    //the lowest and highest readings anyone could plausibly record
    pub description: &'static str,
    pub abilities: &'static [&'static str], //the abilities it measures
    pub confidence: f64, //how much a reading says about those abilities, 0 to 1
    pub test: Option<&'static str>, //the test the app runs to take a reading, for one a person can take themselves
    pub file: &'static str,
    pub cycles: &'static [Cycle],
    pub value: Value,
}

const BODY: &[Cycle] = &[C2017, C2021];

pub const MEASUREMENTS: &[Measurement] = &[
    Measurement {
        name: "Height", unit: "cm", better: "neither", group: "Body", range: (50.0, 250.0), abilities: &[], confidence: 0.0, test: None,
        description: "Standing height without shoes.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXHT"),
    },
    Measurement {
        name: "Weight", unit: "kg", better: "neither", group: "Body", range: (20.0, 350.0), abilities: &[], confidence: 0.0, test: None,
        description: "Body weight in light clothing.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXWT"),
    },
    Measurement {
        name: "Body Mass Index", unit: "kg/m²", better: "neither", group: "Body", range: (10.0, 80.0), abilities: &[], confidence: 0.0, test: None,
        description: "Weight divided by height squared. A rough guide to body size that can't tell muscle from fat.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXBMI"),
    },
    Measurement {
        name: "Waist Circumference", unit: "cm", better: "neither", group: "Body", range: (40.0, 200.0), abilities: &[], confidence: 0.0, test: None,
        description: "Around the waist, just above the top of the hip bones, at the end of a normal breath out.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXWAIST"),
    },
    Measurement {
        name: "Hip Circumference", unit: "cm", better: "neither", group: "Body", range: (50.0, 200.0), abilities: &[], confidence: 0.0, test: None,
        description: "Around the hips, at the widest part of the buttocks.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXHIP"),
    },
    Measurement {
        name: "Upper Arm Length", unit: "cm", better: "neither", group: "Body", range: (15.0, 55.0), abilities: &[], confidence: 0.0, test: None,
        description: "From the top of the shoulder to the tip of the elbow, with the elbow bent at a right angle.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXARML"),
    },
    Measurement {
        name: "Upper Leg Length", unit: "cm", better: "neither", group: "Body", range: (20.0, 65.0), abilities: &[], confidence: 0.0, test: None,
        description: "From the crease at the top of the thigh to the top of the knee, sitting with the knee bent at a right angle.",
        file: "BMX", cycles: BODY, value: Value::Var("BMXLEG"),
    },
    Measurement {
        name: "Resting Heart Rate", unit: "beats/min", better: "lower", group: "Vitals", range: (25.0, 200.0), abilities: &[], confidence: 0.0, test: None,
        description: "Heartbeats a minute after sitting quietly for a few minutes. Lower usually means a fitter heart.",
        file: "BPXO", cycles: BODY, value: Value::Mean(&["BPXOPLS1", "BPXOPLS2", "BPXOPLS3"]),
    },
    Measurement {
        name: "Systolic Blood Pressure", unit: "mmHg", better: "neither", group: "Vitals", range: (60.0, 260.0), abilities: &[], confidence: 0.0, test: None,
        description: "The top number of a blood pressure reading, the pressure while the heart beats, sitting and rested.",
        file: "BPXO", cycles: BODY, value: Value::Mean(&["BPXOSY1", "BPXOSY2", "BPXOSY3"]),
    },
    Measurement {
        name: "Diastolic Blood Pressure", unit: "mmHg", better: "neither", group: "Vitals", range: (30.0, 160.0), abilities: &[], confidence: 0.0, test: None,
        description: "The bottom number of a blood pressure reading, the pressure between beats, sitting and rested.",
        file: "BPXO", cycles: BODY, value: Value::Mean(&["BPXODI1", "BPXODI2", "BPXODI3"]),
    },
    Measurement {
        name: "Grip Strength", unit: "kg", better: "higher", group: "Fitness", range: (1.0, 150.0), abilities: &["Static Strength"], confidence: 0.6, test: None,
        description: "The hardest squeeze of a hand dynamometer, the best of three tries with each hand.",
        file: "MGX", cycles: &[C2011, C2013],
        value: Value::Max(&["MGXH1T1", "MGXH1T2", "MGXH1T3", "MGXH2T1", "MGXH2T2", "MGXH2T3"]),
    },
    Measurement {
        name: "VO2 Max", unit: "ml/kg/min", better: "higher", group: "Fitness", range: (5.0, 100.0), abilities: &["Stamina"], confidence: 0.7, test: None,
        description: "How much oxygen the body can use at full effort, the standard measure of aerobic fitness. Many \
            fitness watches estimate it. NHANES estimated it from heart rate on a submaximal treadmill test, for ages \
            12 to 49.",
        //CVDESVO2 is the treadmill estimate. CVDVOMAX is only a guess from age, BMI and activity, used to pick the test
        file: "CVX", cycles: &[C1999, C2001, C2003], value: Value::Var("CVDESVO2"),
    },
    Measurement {
        name: "Body Fat", unit: "%", better: "neither", group: "Fitness", range: (2.0, 75.0), abilities: &[], confidence: 0.0, test: None,
        description: "The share of body weight that is fat, from a DXA scan. Smart scales estimate it less precisely.",
        file: "DXX", cycles: &[C2011, C2013, C2015, C2017], value: Value::Var("DXDTOPF"),
    },
    Measurement {
        name: "Hearing Threshold", unit: "dB HL", better: "lower", group: "Senses", range: (-10.0, 120.0), abilities: &["Hearing Sensitivity"], confidence: 0.7, test: None,
        description: "The quietest sound heard, averaged across 500, 1000, 2000 and 4000 Hz, in the better ear. Under \
            25 dB is normal hearing. NHANES tested ages 20 to 69.",
        file: "AUX", cycles: &[C2011, C2015], value: Value::BetterEar,
    },
    Measurement {
        name: "Visual Acuity", unit: "20/x", better: "lower", group: "Senses", range: (10.0, 400.0), abilities: &["Far Vision"], confidence: 0.6, test: Some("eye_chart"),
        description: "How sharply the better eye sees at a distance, with usual glasses or contacts, as the bottom \
            of a Snellen fraction: 20 is 20/20 vision, and 40 is 20/40. The app's eye chart measures it on a screen \
            sized with a bank card, from 3 metres away.",
        file: "VIX", cycles: &[C2005, C2007], value: Value::BetterEye,
    },
];

impl Value {
    pub fn vars(&self) -> Vec<&'static str> {
        match self {
            Value::Var(v) => vec![v],
            Value::Mean(vs) | Value::Max(vs) => vs.to_vec(),
            Value::BetterEar => EARS.iter().flatten().copied().collect(),
            Value::BetterEye => vec!["VIDRVA", "VIDLVA"],
        }
    }

    pub fn read(&self, row: &HashMap<String, f64>) -> Option<f64> {
        let get = |v: &str| row.get(v).copied();
        match self {
            Value::Var(v) => get(v),
            Value::Mean(vs) => {
                let xs: Vec<f64> = vs.iter().filter_map(|v| get(v)).collect();
                (!xs.is_empty()).then(|| xs.iter().sum::<f64>() / xs.len() as f64)
            }
            Value::Max(vs) => vs.iter().filter_map(|v| get(v)).reduce(f64::max),
            //666 is no response, so as deaf as the test goes. 888 couldn't be tested
            Value::BetterEar => EARS.iter().filter_map(|ear| {
                let xs: Vec<f64> = ear.iter().map(|v| get(v).filter(|x| *x != 888.0).map(|x| x.min(120.0))).collect::<Option<_>>()?;
                Some(xs.iter().sum::<f64>() / xs.len() as f64)
            }).reduce(f64::min),
            //666 is worse than 20/200, recorded as 20/400
            Value::BetterEye => ["VIDRVA", "VIDLVA"].iter()
                .filter_map(|v| get(v).map(|x| if x == 666.0 { 400.0 } else { x }))
                .reduce(f64::min),
        }
    }
}

//each ear's thresholds at 500, 1000, 2000 and 4000 Hz
const EARS: [[&str; 4]; 2] = [
    ["AUXU500R", "AUXU1K1R", "AUXU2KR", "AUXU4KR"],
    ["AUXU500L", "AUXU1K1L", "AUXU2KL", "AUXU4KL"],
];
