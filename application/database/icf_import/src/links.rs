//how ICF body functions link to the rest of the physical graph, chosen by hand. A function underlies the abilities it's
//the basis of, so an impairment in it holds them back, a measurement measures the function it's a reading of, and a
//temperament and personality function corresponds to the Big Five domains and traits it describes

//a body function and the abilities it underlies, by name as the abilities seed has them
pub const UNDERLIES: &[(&str, &[&str])] = &[
    ("b140", &["Selective Attention", "Time Sharing"]),
    ("b144", &["Memorization"]),
    ("b1470", &["Reaction Time", "Response Orientation", "Wrist-Finger Speed", "Speed of Limb Movement"]),
    ("b1561", &["Speed of Closure", "Flexibility of Closure", "Perceptual Speed"]),
    ("b1565", &["Visualization", "Spatial Orientation", "Depth Perception"]),
    ("b1600", &["Fluency of Ideas"]),
    ("b1640", &["Inductive Reasoning"]),
    ("b1641", &["Information Ordering"]),
    ("b1643", &["Category Flexibility", "Originality"]),
    ("b1645", &["Deductive Reasoning"]),
    ("b1646", &["Problem Sensitivity"]),
    ("b2100", &["Near Vision", "Far Vision"]),
    ("b2101", &["Peripheral Vision"]),
    ("b21020", &["Night Vision", "Glare Sensitivity"]),
    ("b21021", &["Visual Color Discrimination"]),
    ("b2300", &["Hearing Sensitivity"]),
    ("b2301", &["Hearing Sensitivity", "Auditory Attention"]),
    ("b2302", &["Sound Localization"]),
    ("b2304", &["Speech Recognition"]),
    ("b2351", &["Gross Body Equilibrium"]),
    ("b310", &["Speech Clarity"]),
    ("b320", &["Speech Clarity"]),
    ("b4550", &["Stamina"]),
    ("b4551", &["Stamina"]),
    ("b710", &["Extent Flexibility", "Dynamic Flexibility"]),
    ("b730", &["Static Strength", "Explosive Strength"]),
    ("b7305", &["Trunk Strength"]),
    ("b740", &["Dynamic Strength"]),
    ("b7600", &["Arm-Hand Steadiness", "Control Precision", "Manual Dexterity", "Finger Dexterity"]),
    ("b7602", &["Multilimb Coordination", "Gross Body Coordination", "Rate Control"]),
    ("b7651", &["Arm-Hand Steadiness"]),
];

//a measurement, by name as the norms seed has it, and the body function it's a reading of
pub const MEASURES: &[(&str, &str)] = &[
    ("Visual Acuity", "b2100"),
    ("Hearing Threshold", "b2300"),
    ("Resting Heart Rate", "b4100"),
    ("Systolic Blood Pressure", "b420"),
    ("Diastolic Blood Pressure", "b420"),
    ("Grip Strength", "b7300"),
    ("VO2 Max", "b4551"),
    ("Weight", "b530"),
    ("Body Mass Index", "b530"),
    ("Body Fat", "b530"),
];


//a temperament and personality function and the Big Five domain or trait it corresponds to, by name as the personality
//seeds have them, and whether it's that domain or trait's opposite end. The five broad ones match the Big Five domains,
//with psychic stability as the calm end of Neuroticism. The three narrower ones match the traits they describe
pub const PERSONALITY: &[(&str, &str, bool)] = &[
    ("b1260", "Extraversion", false),
    ("b1261", "Agreeableness", false),
    ("b1262", "Conscientiousness", false),
    ("b1263", "Neuroticism", true),
    ("b1264", "Openness", false),
    ("b1265", "Cheerfulness", false),
    ("b1265", "Depression", true),
    ("b1266", "Assertiveness", false),
    ("b1266", "Self-Efficacy", false),
    ("b1266", "Self-Consciousness", true),
    ("b1267", "Morality", false),
    ("b1267", "Dutifulness", false),
];
