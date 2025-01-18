// Main System Node
MERGE (endocrine {name: 'Endocrine System'})
SET endocrine:System,
    endocrine.description = 'System of glands that produce and secrete hormones directly into the bloodstream to regulate body functions'

// Major Glands
MERGE (pituitary {name: 'Pituitary Gland'})
SET pituitary:Organ,
    pituitary.description = 'Master gland that controls other endocrine glands through hormone secretion'

MERGE (hypothalamus {name: 'Hypothalamus'})
SET hypothalamus:Organ,
    hypothalamus.description = 'Brain region that controls pituitary gland and maintains homeostasis'

MERGE (thyroid {name: 'Thyroid Gland'})
SET thyroid:Organ,
    thyroid.description = 'Butterfly-shaped gland in neck that regulates metabolism and growth'

MERGE (parathyroid {name: 'Parathyroid Glands'})
SET parathyroid:Organ,
    parathyroid.description = 'Four small glands behind thyroid that regulate calcium levels'

MERGE (adrenal {name: 'Adrenal Glands'})
SET adrenal:Organ,
    adrenal.description = 'Glands atop kidneys that produce stress hormones and regulate metabolism'

MERGE (pancreas {name: 'Pancreas'})
SET pancreas:Organ,
    pancreas.description = 'Organ producing hormones for blood sugar regulation and digestive enzymes'

MERGE (gonads {name: 'Gonads'})
SET gonads:Organ,
    gonads.description = 'Sex organs (ovaries/testes) that produce reproductive hormones'

MERGE (thymus {name: 'Thymus'})
SET thymus:Organ,
    thymus.description = 'Gland that produces T-lymphocytes and hormones for immune system development'

MERGE (pineal {name: 'Pineal Gland'})
SET pineal:Organ,
    pineal.description = 'Brain gland that produces melatonin and regulates sleep-wake cycles'

// Pituitary Components
MERGE (anteriorPituitary {name: 'Anterior Pituitary'})
SET anteriorPituitary:Structure,
    anteriorPituitary.description = 'Front portion of pituitary that produces multiple crucial hormones'

MERGE (posteriorPituitary {name: 'Posterior Pituitary'})
SET posteriorPituitary:Structure,
    posteriorPituitary.description = 'Back portion of pituitary that stores and releases hormones'

// Adrenal Components
MERGE (adrenalCortex {name: 'Adrenal Cortex'})
SET adrenalCortex:Structure,
    adrenalCortex.description = 'Outer region of adrenal gland producing steroid hormones'

MERGE (adrenalMedulla {name: 'Adrenal Medulla'})
SET adrenalMedulla:Structure,
    adrenalMedulla.description = 'Inner region of adrenal gland producing adrenaline and noradrenaline'

// Pancreatic Components
MERGE (isletsLangerhans {name: 'Islets of Langerhans'})
SET isletsLangerhans:Structure,
    isletsLangerhans.description = 'Clusters of hormone-producing cells in pancreas'

// Major Hormones (as Components)
MERGE (gh {name: 'Growth Hormone'})
SET gh:Component,
    gh.description = 'Promotes growth and cell reproduction'

MERGE (tsh {name: 'Thyroid Stimulating Hormone'})
SET tsh:Component,
    tsh.description = 'Controls thyroid gland function'

MERGE (acth {name: 'Adrenocorticotropic Hormone'})
SET acth:Component,
    acth.description = 'Stimulates cortisol production'

MERGE (insulin {name: 'Insulin'})
SET insulin:Component,
    insulin.description = 'Reduces blood glucose levels'

MERGE (glucagon {name: 'Glucagon'})
SET glucagon:Component,
    glucagon.description = 'Increases blood glucose levels'

MERGE (cortisol {name: 'Cortisol'})
SET cortisol:Component,
    cortisol.description = 'Stress hormone affecting metabolism and immune response'

MERGE (thyroxine {name: 'Thyroxine'})
SET thyroxine:Component,
    thyroxine.description = 'Regulates metabolism and development'

// Tissues
MERGE (endocrineGlandularTissue {name: 'Endocrine Glandular Tissue'})
SET endocrineGlandularTissue:Tissue,
    endocrineGlandularTissue.description = 'Specialized tissue that produces hormones'

MERGE (neuroendocrineTissue {name: 'Neuroendocrine Tissue'})
SET neuroendocrineTissue:Tissue,
    neuroendocrineTissue.description = 'Tissue that combines neural and hormonal signaling'

// Connect organs to system
MERGE (endocrine)-[:CONTAINS]->(pituitary)
MERGE (endocrine)-[:CONTAINS]->(hypothalamus)
MERGE (endocrine)-[:CONTAINS]->(thyroid)
MERGE (endocrine)-[:CONTAINS]->(parathyroid)
MERGE (endocrine)-[:CONTAINS]->(adrenal)
MERGE (endocrine)-[:CONTAINS]->(pancreas)
MERGE (endocrine)-[:CONTAINS]->(gonads)
MERGE (endocrine)-[:CONTAINS]->(thymus)
MERGE (endocrine)-[:CONTAINS]->(pineal)

// Connect structures to organs
MERGE (pituitary)-[:CONTAINS]->(anteriorPituitary)
MERGE (pituitary)-[:CONTAINS]->(posteriorPituitary)
MERGE (adrenal)-[:CONTAINS]->(adrenalCortex)
MERGE (adrenal)-[:CONTAINS]->(adrenalMedulla)
MERGE (pancreas)-[:CONTAINS]->(isletsLangerhans)

//connect tissues to what they make up


// Connect hormones to their source glands
MERGE (anteriorPituitary)-[:PRODUCES]->(gh)
MERGE (anteriorPituitary)-[:PRODUCES]->(tsh)
MERGE (anteriorPituitary)-[:PRODUCES]->(acth)
MERGE (isletsLangerhans)-[:PRODUCES]->(insulin)
MERGE (isletsLangerhans)-[:PRODUCES]->(glucagon)
MERGE (adrenalCortex)-[:PRODUCES]->(cortisol)
MERGE (thyroid)-[:PRODUCES]->(thyroxine)

// Sample Conditions
MERGE (diabetes {name: 'Diabetes Mellitus'})
SET diabetes:Condition,
    diabetes.description = 'Condition affecting blood glucose regulation',
    diabetes.types = ['Type 1', 'Type 2']

MERGE (hypothyroidism {name: 'Hypothyroidism'})
SET hypothyroidism:Condition,
    hypothyroidism.description = 'Underactive thyroid gland'

MERGE (cushings {name: 'Cushing\'s Syndrome'})
SET cushings:Condition,
    cushings.description = 'Excessive cortisol levels'

// Connect conditions
MERGE (pancreas)-[:CAN_HAVE]->(diabetes)
MERGE (thyroid)-[:CAN_HAVE]->(hypothyroidism)
MERGE (adrenal)-[:CAN_HAVE]->(cushings)

// Measurements
MERGE (hormoneLevel {name: 'Hormone Level'})
SET hormoneLevel:Measurement,
    hormoneLevel.description = 'Concentration of specific hormones in blood',
    hormoneLevel.units = 'varies by hormone'

MERGE (bloodGlucose {name: 'Blood Glucose'})
SET bloodGlucose:Measurement,
    bloodGlucose.description = 'Level of glucose in blood',
    bloodGlucose.units = 'mg/dL',
    bloodGlucose.normalRange = '70-99 mg/dL (fasting)'

// Connect measurements
MERGE (endocrine)-[:HAS_MEASUREMENT]->(hormoneLevel)
MERGE (endocrine)-[:HAS_MEASUREMENT]->(bloodGlucose)