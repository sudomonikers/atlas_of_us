//the self-tests: measurements a person takes themselves, at home or in the app, whose norms come from published studies
//and surveys rather than NHANES. Each one's norms are written as the source gives them: values at percentiles, or a
//mean and standard deviation for each group, which are turned into values at the seed's percentiles
use crate::norms::PERCENTILES;

//one group's norm: sex (male, female or all), the ages it covers, from and to inclusive, and its numbers
pub type Group<T> = (&'static str, u32, Option<u32>, T);

pub enum Norms {
    //the value at each of `percentiles`, for each group
    Table { percentiles: &'static [f64], groups: &'static [Group<&'static [f64]>] },
    //the mean and standard deviation of a value spread evenly either side of its mean, for each group
    Normal(&'static [Group<(f64, f64)>]),
    //the mean and standard deviation of a value bunched near zero with a long tail, such as seconds balanced on one
    //leg, for each group. It's fitted as log-normal, so it never goes below zero
    LogNormal(&'static [Group<(f64, f64)>]),
    //none to start with: the api works out its norms from Atlas users' readings once enough people have taken it
    Atlas,
}

pub struct Test {
    pub name: &'static str,
    pub unit: &'static str,
    pub better: &'static str,
    pub group: &'static str,
    pub range: (f64, f64),
    pub description: &'static str,
    pub abilities: &'static [&'static str],
    pub confidence: f64,
    pub test: &'static str, //home, or the test the app runs
    pub timer: Option<u32>, //for a home test of how many in a set time, the seconds the ui's countdown runs
    pub protocol: &'static [&'static str], //the steps of a home test, in order
    pub source: &'static str,
    pub norms: Norms,
}

//the percentiles of the Canadian Health Measures Survey tables
const CHMS: &[f64] = &[5., 10., 20., 30., 40., 50., 60., 70., 80., 90., 95.];
//the boundaries of the CSEP-PATH ratings, read as the percentiles that split people into fifths
const CSEP: &[f64] = &[20., 40., 60., 80.];
//the age groups of Woods and colleagues' studies of reaction time. The papers print the fifth and sixth as 46 to 51 and
//51 to 58
//the percentiles of Tombaugh's Trail Making table
const TOMBAUGH: &[f64] = &[10., 20., 30., 40., 50., 60., 70., 80., 90.];
const WOODS: [(u32, u32); 7] = [(18, 24), (25, 31), (32, 38), (39, 45), (46, 51), (52, 58), (59, 65)];

pub const TESTS: &[Test] = &[
    Test {
        name: "Sit and Reach", unit: "cm", better: "higher", group: "Fitness", range: (0.0, 70.0),
        description: "How far forward you can reach sitting with your legs straight, where touching your toes is 26 cm.",
        abilities: &["Extent Flexibility"], confidence: 0.6, test: "home", timer: None,
        protocol: &[
            "Warm up first: two gentle 20 second stretches for each leg.",
            "Sit on the floor with your shoes off and your legs straight out, soles flat against the bottom stair or a box.",
            "Lay a ruler or tape along the floor between your legs, with the 26 cm mark level with your soles.",
            "With one hand on top of the other and your knees straight, reach forward slowly as far as you can and hold for two seconds.",
            "Read the mark under your fingertips. Do it twice and record the better reach.",
        ],
        source: "Canadian Health Measures Survey cycle 5 (2016 to 2017), from Hoffmann and colleagues, \"Normative-referenced \
            percentile values for physical fitness among Canadians\", Health Reports, Statistics Canada, 2019. Statistics \
            Canada Open Licence.",
        norms: Norms::Table { percentiles: CHMS, groups: &[
            ("male", 12, Some(13), &[8.8, 11.8, 15.7, 18.8, 21.6, 24.3, 27.0, 29.7, 32.7, 36.6, 39.5]),
            ("male", 14, Some(15), &[8.8, 11.7, 15.6, 18.7, 21.6, 24.4, 27.1, 29.9, 33.0, 36.8, 39.6]),
            ("male", 16, Some(17), &[8.8, 11.7, 15.6, 18.7, 21.6, 24.4, 27.3, 30.1, 33.2, 37.0, 39.7]),
            ("male", 18, Some(19), &[8.8, 11.7, 15.6, 18.7, 21.6, 24.5, 27.4, 30.3, 33.4, 37.1, 39.8]),
            ("male", 20, Some(24), &[8.9, 11.7, 15.5, 18.7, 21.7, 24.6, 27.5, 30.4, 33.5, 37.2, 39.9]),
            ("male", 25, Some(29), &[8.8, 11.6, 15.4, 18.6, 21.6, 24.5, 27.4, 30.3, 33.4, 37.1, 39.7]),
            ("male", 30, Some(34), &[8.7, 11.5, 15.3, 18.4, 21.3, 24.2, 27.0, 29.9, 32.9, 36.6, 39.3]),
            ("male", 35, Some(39), &[8.6, 11.3, 15.1, 18.2, 21.0, 23.8, 26.5, 29.3, 32.3, 36.0, 38.6]),
            ("male", 40, Some(44), &[8.4, 11.1, 14.9, 17.8, 20.6, 23.3, 25.9, 28.6, 31.6, 35.2, 37.8]),
            ("male", 45, Some(49), &[8.2, 10.9, 14.6, 17.5, 20.1, 22.7, 25.3, 27.9, 30.7, 34.3, 36.9]),
            ("male", 50, Some(54), &[8.0, 10.7, 14.3, 17.1, 19.7, 22.1, 24.6, 27.1, 29.8, 33.4, 36.0]),
            ("male", 55, Some(59), &[7.8, 10.5, 14.0, 16.7, 19.2, 21.5, 23.9, 26.3, 28.9, 32.4, 35.1]),
            ("male", 60, Some(64), &[7.6, 10.3, 13.7, 16.4, 18.7, 20.9, 23.1, 25.5, 28.0, 31.4, 34.1]),
            ("male", 65, Some(69), &[7.4, 10.1, 13.4, 16.0, 18.2, 20.3, 22.4, 24.6, 27.1, 30.5, 33.1]),
            ("female", 12, Some(13), &[14.9, 18.9, 23.5, 26.5, 28.9, 31.0, 33.1, 35.3, 38.1, 42.0, 45.3]),
            ("female", 14, Some(15), &[14.8, 18.8, 23.4, 26.4, 28.9, 31.0, 33.1, 35.5, 38.2, 42.1, 45.4]),
            ("female", 16, Some(17), &[14.7, 18.7, 23.3, 26.4, 28.8, 31.1, 33.2, 35.6, 38.4, 42.3, 45.5]),
            ("female", 18, Some(19), &[14.6, 18.6, 23.1, 26.3, 28.8, 31.1, 33.3, 35.7, 38.5, 42.4, 45.6]),
            ("female", 20, Some(24), &[14.4, 18.3, 22.9, 26.1, 28.7, 31.1, 33.5, 36.0, 38.8, 42.6, 45.7]),
            ("female", 25, Some(29), &[14.1, 17.9, 22.5, 25.8, 28.5, 31.1, 33.7, 36.2, 39.1, 42.9, 45.8]),
            ("female", 30, Some(34), &[13.8, 17.5, 22.0, 25.4, 28.3, 31.0, 33.7, 36.4, 39.3, 43.0, 45.7]),
            ("female", 35, Some(39), &[13.5, 17.0, 21.4, 24.8, 27.8, 30.7, 33.5, 36.2, 39.2, 42.8, 45.4]),
            ("female", 40, Some(44), &[13.0, 16.4, 20.8, 24.2, 27.3, 30.2, 33.1, 35.9, 38.8, 42.3, 44.8]),
            ("female", 45, Some(49), &[12.5, 15.8, 20.1, 23.5, 26.6, 29.6, 32.5, 35.4, 38.3, 41.7, 44.1]),
            ("female", 50, Some(54), &[12.0, 15.3, 19.6, 23.0, 26.1, 29.1, 32.0, 34.9, 37.8, 41.1, 43.5]),
            ("female", 55, Some(59), &[11.6, 14.9, 19.2, 22.6, 25.8, 28.8, 31.7, 34.6, 37.5, 40.9, 43.2]),
            ("female", 60, Some(64), &[11.3, 14.7, 19.1, 22.5, 25.7, 28.8, 31.7, 34.6, 37.6, 41.0, 43.4]),
            ("female", 65, Some(69), &[11.1, 14.5, 19.0, 22.6, 25.8, 28.9, 31.8, 34.7, 37.7, 41.3, 43.8]),
        ] },
    },
    Test {
        name: "Vertical Jump", unit: "cm", better: "higher", group: "Fitness", range: (1.0, 120.0),
        description: "How high you can jump from standing, swinging your arms. The survey measured it on a force plate, \
            so a mark on a wall is a close but rougher reading.",
        abilities: &["Explosive Strength"], confidence: 0.5, test: "home", timer: None,
        protocol: &[
            "Stand side on to a wall with chalk or a little water on your fingertips.",
            "With your feet flat, reach up as high as you can and mark the wall.",
            "Dip and jump as high as you can, swinging your arms, and mark the wall at the top of the jump.",
            "Measure from the first mark to the second. Jump three times and record the best.",
        ],
        source: "Canadian Health Measures Survey cycle 5 (2016 to 2017), from Hoffmann and colleagues, \"Normative-referenced \
            percentile values for physical fitness among Canadians\", Health Reports, Statistics Canada, 2019. Statistics \
            Canada Open Licence.",
        norms: Norms::Table { percentiles: CHMS, groups: &[
            ("male", 12, Some(13), &[27.9, 30.5, 33.6, 35.9, 38.0, 39.9, 41.8, 43.9, 46.3, 49.8, 52.7]),
            ("male", 14, Some(15), &[30.2, 33.3, 37.0, 39.6, 41.9, 44.0, 46.1, 48.3, 51.0, 54.6, 57.6]),
            ("male", 16, Some(17), &[31.8, 35.2, 39.3, 42.2, 44.7, 46.9, 49.2, 51.5, 54.3, 58.1, 61.1]),
            ("male", 18, Some(19), &[32.6, 36.3, 40.7, 43.8, 46.3, 48.7, 51.0, 53.5, 56.3, 60.1, 63.2]),
            ("male", 20, Some(24), &[32.6, 36.6, 41.2, 44.3, 47.0, 49.4, 51.7, 54.1, 56.9, 60.7, 63.8]),
            ("male", 25, Some(29), &[31.5, 35.5, 40.0, 43.1, 45.7, 48.0, 50.3, 52.6, 55.3, 59.0, 61.9]),
            ("male", 30, Some(34), &[30.1, 33.9, 38.2, 41.1, 43.6, 45.8, 47.9, 50.2, 52.8, 56.3, 59.1]),
            ("male", 35, Some(39), &[28.8, 32.3, 36.3, 39.1, 41.4, 43.5, 45.5, 47.7, 50.2, 53.5, 56.2]),
            ("male", 40, Some(44), &[27.5, 30.7, 34.4, 37.0, 39.1, 41.1, 43.1, 45.1, 47.5, 50.7, 53.3]),
            ("male", 45, Some(49), &[26.2, 29.1, 32.5, 34.9, 36.9, 38.8, 40.6, 42.6, 44.9, 48.0, 50.5]),
            ("male", 50, Some(54), &[24.8, 27.4, 30.6, 32.8, 34.7, 36.4, 38.2, 40.0, 42.2, 45.1, 47.6]),
            ("male", 55, Some(59), &[23.4, 25.7, 28.5, 30.6, 32.3, 33.9, 35.6, 37.3, 39.3, 42.2, 44.5]),
            ("male", 60, Some(64), &[21.7, 23.8, 26.4, 28.2, 29.8, 31.3, 32.8, 34.4, 36.3, 39.0, 41.2]),
            ("male", 65, Some(69), &[19.9, 21.7, 24.0, 25.7, 27.1, 28.5, 29.8, 31.3, 33.1, 35.5, 37.6]),
            ("female", 12, Some(13), &[25.5, 27.6, 30.0, 31.9, 33.4, 34.9, 36.3, 37.9, 39.7, 42.3, 44.4]),
            ("female", 14, Some(15), &[25.3, 27.3, 29.9, 31.7, 33.3, 34.7, 36.2, 37.8, 39.7, 42.3, 44.5]),
            ("female", 16, Some(17), &[24.5, 26.5, 28.9, 30.7, 32.3, 33.7, 35.2, 36.8, 38.7, 41.3, 43.5]),
            ("female", 18, Some(19), &[23.6, 25.6, 28.0, 29.8, 31.3, 32.8, 34.2, 35.8, 37.6, 40.2, 42.4]),
            ("female", 20, Some(24), &[22.8, 24.7, 27.1, 28.9, 30.4, 31.8, 33.3, 34.8, 36.7, 39.3, 41.4]),
            ("female", 25, Some(29), &[22.2, 24.1, 26.5, 28.3, 29.9, 31.3, 32.8, 34.3, 36.2, 38.8, 41.0]),
            ("female", 30, Some(34), &[21.7, 23.6, 26.1, 27.9, 29.4, 30.9, 32.3, 33.9, 35.8, 38.5, 40.7]),
            ("female", 35, Some(39), &[21.0, 22.9, 25.4, 27.2, 28.7, 30.2, 31.6, 33.2, 35.1, 37.8, 40.0]),
            ("female", 40, Some(44), &[20.1, 22.0, 24.4, 26.1, 27.7, 29.1, 30.5, 32.1, 34.0, 36.6, 38.7]),
            ("female", 45, Some(49), &[19.0, 20.8, 23.1, 24.8, 26.3, 27.7, 29.1, 30.6, 32.4, 34.9, 37.0]),
            ("female", 50, Some(54), &[17.7, 19.5, 21.7, 23.3, 24.7, 26.1, 27.4, 28.8, 30.5, 32.9, 34.9]),
            ("female", 55, Some(59), &[16.4, 18.1, 20.2, 21.8, 23.1, 24.4, 25.6, 27.0, 28.6, 30.9, 32.7]),
            ("female", 60, Some(64), &[15.2, 16.8, 18.8, 20.2, 21.5, 22.7, 23.9, 25.2, 26.7, 28.8, 30.6]),
            ("female", 65, Some(69), &[14.1, 15.6, 17.4, 18.8, 20.0, 21.1, 22.2, 23.4, 24.9, 26.9, 28.5]),
        ] },
    },
    Test {
        name: "Push-Ups", unit: "push-ups", better: "higher", group: "Fitness", range: (0.0, 150.0),
        description: "How many push-ups you can do in a row. Men do them from the toes and women from the knees, the way \
            the norms were made, so you're compared with men or with women, not everyone.",
        abilities: &["Dynamic Strength"], confidence: 0.4, test: "home", timer: None,
        protocol: &[
            "Lie face down with your hands under your shoulders. Men go from the toes, women from the knees with the lower legs on the floor.",
            "Put a rolled towel under your chest.",
            "Push up until your arms are straight, keeping your back straight, then lower until your chest touches the towel.",
            "Keep going steadily without resting. Stop when you can't do another, or when your form slips two in a row.",
            "Record how many full push-ups you did.",
        ],
        source: "CSEP-PATH Resource Manual (2nd edition), Canadian Society for Exercise Physiology, 2019, from Payne and \
            colleagues, Canadian Journal of Applied Physiology, 2000. Its five ratings are read as fifths of people, so \
            the comparison is approximate.",
        norms: Norms::Table { percentiles: CSEP, groups: &[
            ("male", 15, Some(19), &[17.5, 22.5, 28.5, 38.5]),
            ("male", 20, Some(29), &[16.5, 21.5, 28.5, 35.5]),
            ("male", 30, Some(39), &[11.5, 16.5, 21.5, 29.5]),
            ("male", 40, Some(49), &[9.5, 12.5, 16.5, 24.5]),
            ("male", 50, Some(59), &[6.5, 9.5, 12.5, 20.5]),
            ("male", 60, Some(69), &[4.5, 7.5, 10.5, 17.5]),
            ("female", 15, Some(19), &[11.5, 17.5, 24.5, 32.5]),
            ("female", 20, Some(29), &[9.5, 14.5, 20.5, 29.5]),
            ("female", 30, Some(39), &[7.5, 12.5, 19.5, 26.5]),
            ("female", 40, Some(49), &[4.5, 10.5, 14.5, 23.5]),
            ("female", 50, Some(59), &[1.5, 6.5, 10.5, 20.5]),
            ("female", 60, Some(69), &[1.5, 4.5, 11.5, 16.5]),
        ] },
    },
    Test {
        name: "One-Leg Stand, Eyes Closed", unit: "s", better: "higher", group: "Fitness", range: (0.0, 45.0),
        description: "How long you can balance on one leg with your eyes shut, up to 45 seconds.",
        abilities: &["Gross Body Equilibrium"], confidence: 0.5, test: "home", timer: None,
        protocol: &[
            "Stand barefoot near a wall or a sturdy chair, in case you need it, with someone to time you if you can.",
            "Cross your arms over your chest, lift one foot so it's near but not touching the other ankle, and close your eyes.",
            "Start the timer as the foot leaves the floor.",
            "Stop when you uncross your arms, the raised foot moves or touches down, the standing foot shifts, you open your eyes, or 45 seconds pass.",
            "Do it three times, resting in between, and record the best time.",
        ],
        source: "Springer and colleagues, \"Normative values for the unipedal stance test with eyes open and closed\", \
            Journal of Geriatric Physical Therapy, 2007: 549 healthy adults, best of three trials. Men and women didn't \
            differ, so everyone is compared together.",
        //the paper's table labels the spread SE, but it's the standard deviation of the group
        norms: Norms::LogNormal(&[
            ("all", 18, Some(39), (15.2, 13.3)),
            ("all", 40, Some(49), (12.7, 12.9)),
            ("all", 50, Some(59), (8.3, 8.4)),
            ("all", 60, Some(69), (4.4, 5.1)),
            ("all", 70, Some(79), (3.1, 4.5)),
            ("all", 80, None, (1.9, 1.0)),
        ]),
    },
    Test {
        name: "Reaction Time", unit: "ms", better: "lower", group: "Reflexes", range: (100.0, 1000.0),
        description: "How fast you press when a target appears, averaged over 30 tries. Screens, mice and touch screens \
            add their own delay, so the same person can score a little slower on a slower device.",
        abilities: &["Reaction Time"], confidence: 0.4, test: "simple_reaction", timer: None, protocol: &[],
        source: "Woods and colleagues, \"Factors influencing the latency of simple reaction time\", Frontiers in Human \
            Neuroscience, 2015: 1,469 adults aged 18 to 65 tested on a lab computer.",
        norms: Norms::Normal(&[
            ("all", WOODS[0].0, Some(WOODS[0].1), (217.9, 19.5)),
            ("all", WOODS[1].0, Some(WOODS[1].1), (221.0, 22.8)),
            ("all", WOODS[2].0, Some(WOODS[2].1), (224.8, 23.4)),
            ("all", WOODS[3].0, Some(WOODS[3].1), (227.7, 26.6)),
            ("all", WOODS[4].0, Some(WOODS[4].1), (233.6, 27.2)),
            ("all", WOODS[5].0, Some(WOODS[5].1), (236.4, 27.0)),
            ("all", WOODS[6].0, Some(WOODS[6].1), (239.1, 28.1)),
        ]),
    },
    Test {
        name: "Choice Reaction Time", unit: "ms", better: "lower", group: "Reflexes", range: (200.0, 1500.0),
        description: "How fast you pick the right one of two buttons for what appears: one for a blue P, the other for \
            anything else. Averaged over the ones you get right.",
        abilities: &["Response Orientation"], confidence: 0.4, test: "choice_reaction", timer: None, protocol: &[],
        source: "Woods and colleagues, \"Age-related slowing of response selection and production in a visual choice \
            reaction time task\", Frontiers in Human Neuroscience, 2015: 1,466 adults aged 18 to 65 tested on a lab \
            computer.",
        norms: Norms::Normal(&[
            ("all", WOODS[0].0, Some(WOODS[0].1), (472.0, 58.8)),
            ("all", WOODS[1].0, Some(WOODS[1].1), (504.0, 65.5)),
            ("all", WOODS[2].0, Some(WOODS[2].1), (521.0, 61.6)),
            ("all", WOODS[3].0, Some(WOODS[3].1), (541.0, 65.5)),
            ("all", WOODS[4].0, Some(WOODS[4].1), (563.0, 65.8)),
            ("all", WOODS[5].0, Some(WOODS[5].1), (575.0, 61.8)),
            ("all", WOODS[6].0, Some(WOODS[6].1), (590.0, 69.0)),
        ]),
    },
    Test {
        name: "Digit Span", unit: "digits", better: "higher", group: "Attention", range: (1.0, 15.0),
        description: "The longest string of digits you can repeat back after seeing them one at a time. The norms come \
            from digits heard rather than seen.",
        abilities: &["Memorization"], confidence: 0.4, test: "digit_span", timer: None, protocol: &[],
        source: "Woods and colleagues, \"Improving digit span assessment of short-term verbal memory\", Journal of \
            Clinical and Experimental Neuropsychology, 2011: 763 adults aged 18 to 65, the longest list repeated \
            forwards. Forward span didn't change with age, so everyone is compared together.",
        norms: Norms::Normal(&[("all", 18, Some(65), (6.77, 1.03))]),
    },
    Test {
        name: "Trail Making", unit: "s", better: "lower", group: "Attention", range: (10.0, 400.0),
        description: "How long it takes to tap 25 circles in order, switching between numbers and letters: 1, A, 2, B, \
            3, C and on to 13. The norms come from people drawing the trail with a pencil on paper.",
        abilities: &["Information Ordering"], confidence: 0.4, test: "trail_making", timer: None, protocol: &[],
        source: "Tombaugh, \"Trail Making Test A and B: normative data stratified by age and education\", Archives of \
            Clinical Neuropsychology, 2004: 911 adults aged 18 to 89, Trail B for all levels of education. The 18 to 24 \
            group were university students.",
        //the paper's percentiles run from fastest to slowest, so its 90th is the 10th here
        norms: Norms::Table { percentiles: TOMBAUGH, groups: &[
            ("all", 18, Some(24), &[35., 38., 41., 44., 47., 49., 54., 61., 66.]),
            ("all", 25, Some(34), &[33., 38., 45., 48., 50., 53., 58., 63., 67.]),
            ("all", 35, Some(44), &[40., 45., 50., 53., 58., 60., 62., 70., 87.]),
            ("all", 45, Some(54), &[42., 50., 59., 62., 64., 68., 72., 75., 84.]),
            ("all", 55, Some(59), &[56., 58., 64., 66., 73., 74., 83., 90., 104.]),
            ("all", 60, Some(64), &[48., 56., 59., 62., 68., 72., 77., 84., 96.]),
            ("all", 65, Some(69), &[56., 62., 70., 73., 76., 83., 91., 104., 121.]),
            ("all", 70, Some(74), &[64., 76., 81., 85., 97., 105., 112., 138., 159.]),
            ("all", 75, Some(79), &[65., 79., 88., 98., 115., 128., 148., 163., 185.]),
            ("all", 80, Some(84), &[84., 101., 111., 116., 133., 144., 159., 193., 241.]),
            ("all", 85, Some(89), &[81., 87., 95., 121., 138., 150., 194., 199., 296.]),
        ] },
    },
    //the Atlas's own reasoning tests. Their items are generated in the ui from fixed seeds, so everyone takes the same
    //test, and the number of items and the time limits here match it (ui/atlas-of-us-ui/src/physical/puzzles.ts)
    Test {
        name: "Matrix Puzzles", unit: "right", better: "higher", group: "Reasoning", range: (0.0, 20.0),
        description: "How many of 20 picture puzzles you solve in 10 minutes. Each is a grid of shapes that change by \
            rules across the rows, with one missing: pick the piece that fits.",
        abilities: &["Inductive Reasoning"], confidence: 0.4, test: "matrices", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Number Series", unit: "right", better: "higher", group: "Reasoning", range: (0.0, 16.0),
        description: "How many of 16 number series you finish in 8 minutes: work out the rule and type the next number.",
        abilities: &["Inductive Reasoning"], confidence: 0.4, test: "series", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Shape Rotation", unit: "right", better: "higher", group: "Reasoning", range: (0.0, 16.0),
        description: "How many of 16 you get right in 7 minutes: pick which of four block shapes is the first one turned \
            around. The others are its mirror image.",
        abilities: &["Visualization"], confidence: 0.4, test: "rotation", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Paper Folding", unit: "right", better: "higher", group: "Reasoning", range: (0.0, 14.0),
        description: "How many of 14 you get right in 7 minutes: a square of paper is folded and a hole punched \
            through it, and you pick where the holes are once it's unfolded.",
        abilities: &["Visualization"], confidence: 0.4, test: "paper_folding", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Perspective Taking", unit: "degrees off", better: "lower", group: "Reasoning", range: (0.0, 180.0),
        description: "How far off you point, on average, over 12 tries in 6 minutes: imagine standing at one thing on a \
            map, facing a second, and point to a third.",
        abilities: &["Spatial Orientation"], confidence: 0.4, test: "perspective", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Syllogisms", unit: "right", better: "higher", group: "Reasoning", range: (0.0, 20.0),
        description: "How many of 20 you judge right in 7 minutes: does the conclusion follow from what's given? The \
            words are made up, so only the logic counts.",
        abilities: &["Deductive Reasoning"], confidence: 0.4, test: "syllogisms", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },

    //the Atlas's own tests of attention, perception, coordination, the senses and ideas, compared with Atlas users
    //like the reasoning tests. Their counts and time limits match the ui (ui/atlas-of-us-ui/src/physical/puzzles.ts)
    Test {
        name: "Symbol Matching", unit: "right", better: "higher", group: "Attention", range: (0.0, 150.0),
        description: "How many symbols you match to their digits in 90 seconds, using a key of nine.",
        abilities: &["Perceptual Speed"], confidence: 0.4, test: "symbols", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Distracting Arrows", unit: "ms slower", better: "lower", group: "Attention", range: (-300.0, 1000.0),
        description: "How much slower you are to say which way the middle arrow points when the arrows around it point \
            the other way, over 48 tries.",
        abilities: &["Selective Attention"], confidence: 0.4, test: "flanker", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Card Sorting", unit: "right", better: "higher", group: "Attention", range: (0.0, 60.0),
        description: "How many of 60 cards you sort right by a hidden rule, by colour, shape or number, that changes \
            without warning.",
        abilities: &["Category Flexibility"], confidence: 0.4, test: "cards", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Broken Words", unit: "right", better: "higher", group: "Attention", range: (0.0, 20.0),
        description: "How many of 20 words you read in 4 minutes with much of each one hidden.",
        abilities: &["Speed of Closure"], confidence: 0.4, test: "broken_words", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Hidden Shapes", unit: "right", better: "higher", group: "Attention", range: (0.0, 16.0),
        description: "How many of 16 you get right in 6 minutes: find which drawing has a simple shape hidden in it.",
        abilities: &["Flexibility of Closure"], confidence: 0.4, test: "hidden_shapes", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Tapping", unit: "taps", better: "higher", group: "Reflexes", range: (0.0, 200.0),
        description: "The most taps you make in 10 seconds with one finger, the best of three tries.",
        abilities: &["Wrist-Finger Speed"], confidence: 0.4, test: "tapping", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Tracking", unit: "% on target", better: "higher", group: "Reflexes", range: (0.0, 100.0),
        description: "How much of 45 seconds you keep the pointer on a dot that drifts unpredictably.",
        abilities: &["Control Precision"], confidence: 0.4, test: "tracking", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Timing", unit: "ms off", better: "lower", group: "Reflexes", range: (0.0, 2000.0),
        description: "How far off you are, on average over 20 tries, stopping a moving dot on a line, some of them \
            with the end of its path hidden.",
        abilities: &["Rate Control"], confidence: 0.4, test: "timing", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Two-Hand Steering", unit: "targets", better: "higher", group: "Reflexes", range: (0.0, 100.0),
        description: "How many targets you reach in 60 seconds steering a dot with both hands, one for up and down and \
            the other for left and right.",
        abilities: &["Multilimb Coordination"], confidence: 0.4, test: "steering", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Track and Count", unit: "points", better: "higher", group: "Reflexes", range: (0.0, 100.0),
        description: "How well you keep the pointer on a drifting dot while counting high beeps, for 60 seconds: half \
            for the tracking, half for the count.",
        abilities: &["Time Sharing"], confidence: 0.4, test: "track_count", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Reading Chart", unit: "20/x", better: "lower", group: "Senses", range: (10.0, 400.0),
        description: "How small you can read up close, at 40 cm with your usual reading glasses, as the bottom of a \
            Snellen fraction. A screen can only draw letters so small, so a sharp phone screen measures furthest.",
        abilities: &["Near Vision"], confidence: 0.4, test: "near_chart", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Odd Colour Out", unit: "hue degrees", better: "lower", group: "Senses", range: (0.5, 180.0),
        description: "The smallest difference in hue you can spot between tiles. Screens show colour differently, so \
            it's rough.",
        abilities: &["Visual Color Discrimination"], confidence: 0.3, test: "colours", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Side Vision", unit: "seen", better: "higher", group: "Senses", range: (0.0, 24.0),
        description: "How many of 24 flashes you notice off to the side while looking at a dot, out to 30 degrees, on a \
            screen at least 25 cm wide.",
        abilities: &["Peripheral Vision"], confidence: 0.3, test: "side_vision", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Animal Naming", unit: "animals", better: "higher", group: "Reasoning", range: (0.0, 100.0),
        description: "How many different animals you can type in 60 seconds. Repeats and anything that isn't an animal \
            don't count.",
        abilities: &["Fluency of Ideas"], confidence: 0.4, test: "animals", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },
    Test {
        name: "Brick Uses", unit: "points", better: "higher", group: "Reasoning", range: (0.0, 100.0),
        description: "How unusual your ideas are for using a brick, in 2 minutes: how far each one is from a brick \
            itself and from the uses people think of most, scored on your three most unusual.",
        abilities: &["Originality"], confidence: 0.3, test: "uses", timer: None, protocol: &[], source: ATLAS,
        norms: Norms::Atlas,
    },

    //home tests with no published norms that fit, compared with Atlas users. A timed one has the ui's stopwatch
    Test {
        name: "Plank Hold", unit: "s", better: "higher", group: "Fitness", range: (0.0, 900.0),
        description: "How long you can hold a forearm plank with your body straight.",
        abilities: &["Trunk Strength"], confidence: 0.4, test: "home", timer: None,
        protocol: &[
            "Lie face down on a mat or carpet. Rest on your forearms, elbows under your shoulders, and come up onto your toes.",
            "Keep a straight line from your head to your heels: hips neither sagging nor raised.",
            "Start the stopwatch when you're in position, and hold as long as you can.",
            "Stop when your hips sag or rise, a knee touches the floor, or you can't hold it any more. Record the time.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
    Test {
        name: "Coin Transfer", unit: "s", better: "lower", group: "Fitness", range: (5.0, 300.0),
        description: "How long it takes to move 20 coins, one at a time, from a pile into a mug with your stronger hand.",
        abilities: &["Manual Dexterity"], confidence: 0.3, test: "home", timer: None,
        protocol: &[
            "Sit at a table. Put 20 small coins in a loose pile in front of you, and a mug about 30 cm (a foot) beyond them.",
            "Use your stronger hand only, and keep the other in your lap.",
            "Start the stopwatch and pick up the coins one at a time, dropping each into the mug.",
            "Stop when the last coin is in. A coin that misses goes back in the pile. Record the time.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
    Test {
        name: "Coin Turning", unit: "s", better: "lower", group: "Fitness", range: (3.0, 180.0),
        description: "How long it takes to turn over 10 coins in a row with the fingers of one hand.",
        abilities: &["Finger Dexterity"], confidence: 0.3, test: "home", timer: None,
        protocol: &[
            "Lay 10 small coins in a row on a table, heads up, about a finger's width apart.",
            "Use your stronger hand only. Turn each coin over where it lies, picking it up with your fingertips, without sliding it to the edge of the table.",
            "Start the stopwatch and turn them over, one after another along the row.",
            "Stop when the last coin is tails up. Record the time.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
    Test {
        name: "Plate Tapping", unit: "s", better: "lower", group: "Fitness", range: (3.0, 60.0),
        description: "How long it takes to tap two marks 80 cm apart 25 times each with one hand, the Eurofit plate \
            tapping test.",
        abilities: &["Speed of Limb Movement"], confidence: 0.3, test: "home", timer: None,
        protocol: &[
            "On a table, put two coasters or paper circles with their centres 80 cm (32 inches) apart, and stand facing the table between them.",
            "Put your weaker hand flat on the table in the middle, and your stronger hand on the coaster on the other side.",
            "Start the stopwatch and tap the two coasters in turn, crossing over your weaker hand, as fast as you can.",
            "Stop after 25 taps on each, 50 in all. Have someone count if you can. Record the time.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
    Test {
        name: "Hexagon Jump", unit: "s", better: "lower", group: "Fitness", range: (5.0, 120.0),
        description: "How long it takes to jump out and back in over each side of a taped hexagon, three times around.",
        abilities: &["Gross Body Coordination"], confidence: 0.3, test: "home", timer: None,
        protocol: &[
            "Clear some floor space and tape a hexagon with sides 60 cm (2 feet) long. Wear shoes with grip.",
            "Stand in the middle facing one side, and keep facing that way the whole time.",
            "Start the stopwatch. Jump with both feet together out over the side in front of you and back into the middle, then over the next side clockwise and back, and on around.",
            "Go around three times, 18 jumps out. If you land on a line or lose your balance, start again. Record the time.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
    Test {
        name: "Bend, Twist and Touch", unit: "touches", better: "higher", group: "Fitness", range: (0.0, 40.0),
        description: "How many times in 20 seconds you can bend to touch the floor, then twist to touch the wall behind \
            you, after Fleishman's test of dynamic flexibility.",
        abilities: &["Dynamic Flexibility"], confidence: 0.3, test: "home", timer: Some(20),
        protocol: &[
            "Stand with your back to a wall, an arm's length from it, feet shoulder width apart. Put a piece of tape on the wall behind you at shoulder height.",
            "Bend and touch the floor between your feet with both hands, then stand, twist and touch the tape with both hands. That's one.",
            "Twist to the other side the next time, and keep alternating.",
            "Start the countdown and do as many as you can before it beeps. Record how many.",
        ],
        source: ATLAS, norms: Norms::Atlas,
    },
];

//where the Atlas's own tests are compared from
const ATLAS: &str = "Made for the Atlas. Compared with Atlas users who've taken it, once enough people of your age have.";

impl Norms {
    //each group's sex, ages, the percentiles it gives values for and the values at them
    pub fn groups(&self) -> Vec<(&'static str, u32, Option<u32>, Vec<f64>, Vec<f64>)> {
        let at = |value: &dyn Fn(f64) -> f64| PERCENTILES.iter().map(|p| round(value(z(p / 100.0)))).collect::<Vec<_>>();
        match self {
            Norms::Table { percentiles, groups } => groups.iter()
                .map(|(sex, from, to, values)| (*sex, *from, *to, percentiles.to_vec(), values.to_vec()))
                .collect(),
            Norms::Normal(groups) => groups.iter()
                .map(|(sex, from, to, (mean, sd))| (*sex, *from, *to, PERCENTILES.to_vec(), at(&|z| (mean + sd * z).max(0.0))))
                .collect(),
            Norms::LogNormal(groups) => groups.iter().map(|(sex, from, to, (mean, sd))| {
                let sigma = (1.0 + (sd / mean).powi(2)).ln().sqrt();
                let mu = mean.ln() - sigma * sigma / 2.0;
                (*sex, *from, *to, PERCENTILES.to_vec(), at(&|z| (mu + sigma * z).exp()))
            }).collect(),
            Norms::Atlas => Vec::new(),
        }
    }
}

fn round(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

//the standard normal value with a share p of the distribution below it (Acklam's approximation, good to about 1e-9)
fn z(p: f64) -> f64 {
    const A: [f64; 6] = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
    const B: [f64; 5] = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const C: [f64; 6] = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const D: [f64; 4] = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    let tail = |q: f64| (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) / ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1.0);
    if p < 0.02425 {
        tail((-2.0 * p.ln()).sqrt())
    } else if p > 1.0 - 0.02425 {
        -tail((-2.0 * (1.0 - p).ln()).sqrt())
    } else {
        let q = p - 0.5;
        let r = q * q;
        (((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) * q / (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1.0)
    }
}
