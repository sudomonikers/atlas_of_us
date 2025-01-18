// Main System Node
MERGE (endocrine {name: 'Endocrine System'})
SET endocrine:System,
    endocrine.description = 'System of glands that produce and secrete hormones directly into the bloodstream to regulate body functions'

// Major Glands
MERGE (pituitary {name: 'Pituitary Gland'})
SET pituitary:Organ:Health,
    pituitary.description = 'Master gland that controls other endocrine glands through hormone secretion'

MERGE (hypothalamus {name: 'Hypothalamus'})
SET hypothalamus:Organ:Health,
    hypothalamus.description = 'Brain region that controls pituitary gland and maintains homeostasis'

MERGE (thyroid {name: 'Thyroid Gland'})
SET thyroid:Organ:Health,
    thyroid.description = 'Butterfly-shaped gland in neck that regulates metabolism and growth'

MERGE (parathyroid {name: 'Parathyroid Glands'})
SET parathyroid:Organ:Health,
    parathyroid.description = 'Four small glands behind thyroid that regulate calcium levels'

MERGE (adrenal {name: 'Adrenal Glands'})
SET adrenal:Organ:Health,
    adrenal.description = 'Glands atop kidneys that produce stress hormones and regulate metabolism'

MERGE (pancreas {name: 'Pancreas'})
SET pancreas:Organ:Health,
    pancreas.description = 'Organ producing hormones for blood sugar regulation and digestive enzymes'

MERGE (gonads {name: 'Gonads'})
SET gonads:Organ:Health,
    gonads.description = 'Sex organs (ovaries/testes) that produce reproductive hormones'

MERGE (thymus {name: 'Thymus'})
SET thymus:Organ:Health,
    thymus.description = 'Gland that produces T-lymphocytes and hormones for immune system development'

MERGE (pineal {name: 'Pineal Gland'})
SET pineal:Organ:Health,
    pineal.description = 'Brain gland that produces melatonin and regulates sleep-wake cycles'

// Pituitary Components
MERGE (anteriorPituitary {name: 'Anterior Pituitary'})
SET anteriorPituitary:Structure:Health,
    anteriorPituitary.description = 'Front portion of pituitary that produces multiple crucial hormones'

MERGE (posteriorPituitary {name: 'Posterior Pituitary'})
SET posteriorPituitary:Structure:Health,
    posteriorPituitary.description = 'Back portion of pituitary that stores and releases hormones'

// Adrenal Components
MERGE (adrenalCortex {name: 'Adrenal Cortex'})
SET adrenalCortex:Structure:Health,
    adrenalCortex.description = 'Outer region of adrenal gland producing steroid hormones'

MERGE (adrenalMedulla {name: 'Adrenal Medulla'})
SET adrenalMedulla:Structure:Health,
    adrenalMedulla.description = 'Inner region of adrenal gland producing adrenaline and noradrenaline'

// Pancreatic Components
MERGE (isletsLangerhans {name: 'Islets of Langerhans'})
SET isletsLangerhans:Structure:Health,
    isletsLangerhans.description = 'Clusters of hormone-producing cells in pancreas'

// Expanded Hormone List
MERGE (gh {name: 'Growth Hormone'})
SET gh:Component:Health, gh.type = 'Hormone',
    gh.description = 'Promotes growth and cell reproduction',
    gh.circadianPattern = 'Pulsatile, peaks during sleep',
    gh.halfLife = '15-20 minutes'

MERGE (tsh {name: 'Thyroid Stimulating Hormone'})
SET tsh:Component:Health, tsh.type = 'Hormone',
    tsh.description = 'Controls thyroid gland function',
    tsh.circadianPattern = 'Peaks at night',
    tsh.halfLife = '60 minutes'

MERGE (acth {name: 'Adrenocorticotropic Hormone'})
SET acth:Component:Health, acth.type = 'Hormone',
    acth.description = 'Stimulates cortisol production',
    acth.circadianPattern = 'Peaks in early morning',
    acth.halfLife = '10 minutes'

MERGE (crh {name: 'Corticotropin-Releasing Hormone'})
SET crh:Component:Health, crh.type = 'Hormone',
    crh.description = 'Stimulates ACTH release',
    crh.circadianPattern = 'Follows ACTH pattern',
    crh.halfLife = '30 minutes'

MERGE (trh {name: 'Thyrotropin-Releasing Hormone'})
SET trh:Component:Health, trh.type = 'Hormone',
    trh.description = 'Stimulates TSH release',
    trh.circadianPattern = 'Pulsatile',
    trh.halfLife = '5 minutes'

MERGE (insulin {name: 'Insulin'})
SET insulin:Component:Health, insulin.type = 'Hormone',
    insulin.description = 'Reduces blood glucose levels',
    insulin.circadianPattern = 'Meal-dependent',
    insulin.halfLife = '5-6 minutes'

MERGE (glucagon {name: 'Glucagon'})
SET glucagon:Component:Health, glucagon.type = 'Hormone',
    glucagon.description = 'Increases blood glucose levels',
    glucagon.circadianPattern = 'Counter-regulatory to insulin',
    glucagon.halfLife = '3-6 minutes'

MERGE (cortisol {name: 'Cortisol'})
SET cortisol:Component:Health, cortisol.type = 'Hormone',
    cortisol.description = 'Stress hormone affecting metabolism and immune response',
    cortisol.circadianPattern = 'Peaks in early morning',
    cortisol.halfLife = '60-90 minutes'

MERGE (thyroxine {name: 'Thyroxine'})
SET thyroxine:Component:Health, thyroxine.type = 'Hormone',
    thyroxine.description = 'Regulates metabolism and development',
    thyroxine.circadianPattern = 'Relatively stable',
    thyroxine.halfLife = '7 days'

MERGE (melatonin {name: 'Melatonin'})
SET melatonin:Component:Health, melatonin.type = 'Hormone',
    melatonin.description = 'Regulates sleep-wake cycle',
    melatonin.circadianPattern = 'Peaks at night',
    melatonin.halfLife = '40-50 minutes'

// Expanded Tissue Types
MERGE (endocrineGlandularTissue {name: 'Endocrine Glandular Tissue'})
SET endocrineGlandularTissue:Tissue:Health,
    endocrineGlandularTissue.description = 'Specialized tissue that produces hormones',
    endocrineGlandularTissue.cellTypes = ['Chief cells', 'Chromaffin cells', 'Beta cells']

MERGE (neuroendocrineTissue {name: 'Neuroendocrine Tissue'})
SET neuroendocrineTissue:Tissue:Health,
    neuroendocrineTissue.description = 'Tissue that combines neural and hormonal signaling',
    neuroendocrineTissue.cellTypes = ['Neurosecretory cells', 'Peptidergic neurons']

MERGE (connectiveTissue {name: 'Connective Tissue'})
SET connectiveTissue:Tissue:Health,
    connectiveTissue.description = 'Supporting tissue that provides structure and blood supply',
    connectiveTissue.cellTypes = ['Fibroblasts', 'Blood vessels', 'Immune cells']

// Temporal Properties Node
MERGE (temporalPatterns {name: 'Temporal Patterns'})
SET temporalPatterns:Properties,
    temporalPatterns.circadian = 'Daily rhythms',
    temporalPatterns.ultradian = 'Multiple cycles per day',
    temporalPatterns.infradian = 'Cycles longer than a day',
    temporalPatterns.pulsatile = 'Episodic secretion'

// Connect tissues to organs
MERGE (pituitary)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (pituitary)-[:COMPOSED_OF]->(connectiveTissue)
MERGE (hypothalamus)-[:COMPOSED_OF]->(neuroendocrineTissue)
MERGE (thyroid)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (thyroid)-[:COMPOSED_OF]->(connectiveTissue)
MERGE (parathyroid)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (adrenal)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (adrenal)-[:COMPOSED_OF]->(connectiveTissue)
MERGE (pancreas)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (pancreas)-[:COMPOSED_OF]->(connectiveTissue)
MERGE (gonads)-[:COMPOSED_OF]->(endocrineGlandularTissue)
MERGE (gonads)-[:COMPOSED_OF]->(connectiveTissue)

// Hormonal Feedback Loops
MERGE (hypothalamus)-[:RELEASES]->(crh)
MERGE (crh)-[:STIMULATES]->(acth)
MERGE (acth)-[:STIMULATES]->(cortisol)
MERGE (cortisol)-[:INHIBITS]->(crh)
MERGE (cortisol)-[:INHIBITS]->(acth)

MERGE (hypothalamus)-[:RELEASES]->(trh)
MERGE (trh)-[:STIMULATES]->(tsh)
MERGE (tsh)-[:STIMULATES]->(thyroxine)
MERGE (thyroxine)-[:INHIBITS]->(trh)
MERGE (thyroxine)-[:INHIBITS]->(tsh)

MERGE (glucagon)-[:INHIBITS]->(insulin)
MERGE (insulin)-[:INHIBITS]->(glucagon)

// Temporal Relationships
MERGE (gh)-[:FOLLOWS]->(temporalPatterns)
MERGE (cortisol)-[:FOLLOWS]->(temporalPatterns)
MERGE (melatonin)-[:FOLLOWS]->(temporalPatterns)
MERGE (insulin)-[:FOLLOWS]->(temporalPatterns)

// Original relationships maintained
MERGE (endocrine)-[:CONTAINS]->(pituitary)
MERGE (endocrine)-[:CONTAINS]->(hypothalamus)
MERGE (endocrine)-[:CONTAINS]->(thyroid)
MERGE (endocrine)-[:CONTAINS]->(parathyroid)
MERGE (endocrine)-[:CONTAINS]->(adrenal)
MERGE (endocrine)-[:CONTAINS]->(pancreas)
MERGE (endocrine)-[:CONTAINS]->(gonads)
MERGE (endocrine)-[:CONTAINS]->(thymus)
MERGE (endocrine)-[:CONTAINS]->(pineal)

MERGE (pituitary)-[:CONTAINS]->(anteriorPituitary)
MERGE (pituitary)-[:CONTAINS]->(posteriorPituitary)
MERGE (adrenal)-[:CONTAINS]->(adrenalCortex)
MERGE (adrenal)-[:CONTAINS]->(adrenalMedulla)
MERGE (pancreas)-[:CONTAINS]->(isletsLangerhans)

MERGE (anteriorPituitary)-[:PRODUCES]->(gh)
MERGE (anteriorPituitary)-[:PRODUCES]->(tsh)
MERGE (anteriorPituitary)-[:PRODUCES]->(acth)
MERGE (isletsLangerhans)-[:PRODUCES]->(insulin)
MERGE (isletsLangerhans)-[:PRODUCES]->(glucagon)
MERGE (adrenalCortex)-[:PRODUCES]->(cortisol)
MERGE (thyroid)-[:PRODUCES]->(thyroxine)
MERGE (pineal)-[:PRODUCES]->(melatonin)

// Conditions maintained and expanded
MERGE (diabetes {name: 'Diabetes Mellitus'})
SET diabetes:Condition:Health,
    diabetes.description = 'Condition affecting blood glucose regulation',
    diabetes.types = ['Type 1', 'Type 2'],
    diabetes.temporalFactors = ['Time of day', 'Meal timing', 'Exercise timing']

MERGE (hypothyroidism {name: 'Hypothyroidism'})
SET hypothyroidism:Condition:Health,
    hypothyroidism.description = 'Underactive thyroid gland',
    hypothyroidism.temporalFactors = ['Seasonal variation', 'Circadian rhythm disruption']

MERGE (cushings {name: 'Cushing\'s Syndrome'})
SET cushings:Condition:Health,
    cushings.description = 'Excessive cortisol levels',
    cushings.temporalFactors = ['Diurnal variation', 'Stress response timing']

// Connect conditions
MERGE (pancreas)-[:CAN_HAVE]->(diabetes)
MERGE (thyroid)-[:CAN_HAVE]->(hypothyroidism)
MERGE (adrenal)-[:CAN_HAVE]->(cushings)

// Measurements with temporal aspects
MERGE (hormoneLevel {name: 'Hormone Level'})
SET hormoneLevel:Measurement,
    hormoneLevel.description = 'Concentration of specific hormones in blood',
    hormoneLevel.units = 'varies by hormone',
    hormoneLevel.samplingFrequency = 'Depends on hormone and condition',
    hormoneLevel.timeFactors = ['Time of day', 'Fasting status', 'Recent activity']

MERGE (bloodGlucose {name: 'Blood Glucose'})
SET bloodGlucose:Measurement,
    bloodGlucose.description = 'Level of glucose in blood',
    bloodGlucose.units = 'mg/dL',
    bloodGlucose.normalRange = '70-99 mg/dL (fasting)',
    bloodGlucose.samplingFrequency = 'Multiple times daily',
    bloodGlucose.timeFactors = ['Meal timing', 'Exercise', 'Sleep schedule']

// Connect measurements
MERGE (endocrine)-[:HAS_MEASUREMENT]->(hormoneLevel)
MERGE (endocrine)-[:HAS_MEASUREMENT]->(bloodGlucose)