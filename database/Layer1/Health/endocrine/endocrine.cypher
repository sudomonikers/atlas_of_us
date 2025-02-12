// Main System Node
MATCH (endocrine {name: 'Endocrine System'})

// Major Glands
MERGE (pituitary {name: 'Pituitary Gland'})
SET pituitary:L1:Health:Organ,
    pituitary.description = 'Master gland that controls other endocrine glands through hormone secretion'

MERGE (hypothalamus {name: 'Hypothalamus'})
SET hypothalamus:L1:Health:Organ,
    hypothalamus.description = 'Brain region that controls pituitary gland and maintains homeostasis'

MERGE (thyroid {name: 'Thyroid Gland'})
SET thyroid:L1:Health:Organ,
    thyroid.description = 'Butterfly-shaped gland in neck that regulates metabolism and growth'

MERGE (parathyroid {name: 'Parathyroid Glands'})
SET parathyroid:L1:Health:Organ,
    parathyroid.description = 'Four small glands behind thyroid that regulate calcium levels'

MERGE (adrenal {name: 'Adrenal Glands'})
SET adrenal:L1:Health:Organ,
    adrenal.description = 'Glands atop kidneys that produce stress hormones and regulate metabolism'

MERGE (pancreas {name: 'Pancreas'})
SET pancreas:L1:Health:Organ,
    pancreas.description = 'Organ producing hormones for blood sugar regulation and digestive enzymes'

MERGE (gonads {name: 'Gonads'})
SET gonads:L1:Health:Organ,
    gonads.description = 'Sex organs (ovaries/testes) that produce reproductive hormones'

MERGE (thymus {name: 'Thymus'})
SET thymus:L1:Health:Organ,
    thymus.description = 'Gland that produces T-lymphocytes and hormones for immune system development'

MERGE (pineal {name: 'Pineal Gland'})
SET pineal:L1:Health:Organ,
    pineal.description = 'Brain gland that produces melatonin and regulates sleep-wake cycles'

// Connect major organs to system
MERGE (pituitary)-[:MAKES_UP]->(endocrine)
MERGE (hypothalamus)-[:MAKES_UP]->(endocrine)
MERGE (thyroid)-[:MAKES_UP]->(endocrine)
MERGE (parathyroid)-[:MAKES_UP]->(endocrine)
MERGE (adrenal)-[:MAKES_UP]->(endocrine)
MERGE (pancreas)-[:MAKES_UP]->(endocrine)
MERGE (gonads)-[:MAKES_UP]->(endocrine)
MERGE (thymus)-[:MAKES_UP]->(endocrine)
MERGE (pineal)-[:MAKES_UP]->(endocrine)

// Pituitary Components
MERGE (anteriorPituitary {name: 'Anterior Pituitary'})
SET anteriorPituitary:L1:Health:Structure,
    anteriorPituitary.description = 'Front portion of pituitary that produces multiple crucial hormones'

MERGE (posteriorPituitary {name: 'Posterior Pituitary'})
SET posteriorPituitary:L1:Health:Structure,
    posteriorPituitary.description = 'Back portion of pituitary that stores and releases hormones'

// Connect pituitary components
MERGE (anteriorPituitary)-[:MAKES_UP]->(pituitary)
MERGE (posteriorPituitary)-[:MAKES_UP]->(pituitary)

// Adrenal Components
MERGE (adrenalCortex {name: 'Adrenal Cortex'})
SET adrenalCortex:L1:Health:Structure,
    adrenalCortex.description = 'Outer region of adrenal gland producing steroid hormones'

MERGE (adrenalMedulla {name: 'Adrenal Medulla'})
SET adrenalMedulla:L1:Health:Structure,
    adrenalMedulla.description = 'Inner region of adrenal gland producing adrenaline and noradrenaline'

// Connect adrenal components
MERGE (adrenalCortex)-[:MAKES_UP]->(adrenal)
MERGE (adrenalMedulla)-[:MAKES_UP]->(adrenal)

// Pancreatic Components
MERGE (isletsLangerhans {name: 'Islets of Langerhans'})
SET isletsLangerhans:L1:Health:Structure,
    isletsLangerhans.description = 'Clusters of hormone-producing cells in pancreas'

// Connect pancreatic components
MERGE (isletsLangerhans)-[:MAKES_UP]->(pancreas)

// Hormones
MERGE (gh {name: 'Growth Hormone'})
SET gh:L1:Health:Component,
    gh.description = 'Promotes growth and cell reproduction',
    gh.circadianPattern = 'Pulsatile, peaks during sleep',
    gh.halfLife = '15-20 minutes'

MERGE (tsh {name: 'Thyroid Stimulating Hormone'})
SET tsh:L1:Health:Component,
    tsh.description = 'Controls thyroid gland function',
    tsh.circadianPattern = 'Peaks at night',
    tsh.halfLife = '60 minutes'

MERGE (acth {name: 'Adrenocorticotropic Hormone'})
SET acth:L1:Health:Component,
    acth.description = 'Stimulates cortisol production',
    acth.circadianPattern = 'Peaks in early morning',
    acth.halfLife = '10 minutes'

MERGE (insulin {name: 'Insulin'})
SET insulin:L1:Health:Component,
    insulin.description = 'Reduces blood glucose levels',
    insulin.circadianPattern = 'Meal-dependent',
    insulin.halfLife = '5-6 minutes'

MERGE (glucagon {name: 'Glucagon'})
SET glucagon:L1:Health:Component,
    glucagon.description = 'Increases blood glucose levels',
    glucagon.circadianPattern = 'Counter-regulatory to insulin',
    glucagon.halfLife = '3-6 minutes'

MERGE (cortisol {name: 'Cortisol'})
SET cortisol:L1:Health:Component,
    cortisol.description = 'Stress hormone affecting metabolism and immune response',
    cortisol.circadianPattern = 'Peaks in early morning',
    cortisol.halfLife = '60-90 minutes'

MERGE (thyroxine {name: 'Thyroxine'})
SET thyroxine:L1:Health:Component,
    thyroxine.description = 'Regulates metabolism and development',
    thyroxine.circadianPattern = 'Relatively stable',
    thyroxine.halfLife = '7 days'

MERGE (melatonin {name: 'Melatonin'})
SET melatonin:L1:Health:Component,
    melatonin.description = 'Regulates sleep-wake cycle',
    melatonin.circadianPattern = 'Peaks at night',
    melatonin.halfLife = '40-50 minutes'

// Connect hormones to their source
MERGE (gh)-[:MAKES_UP]->(anteriorPituitary)
MERGE (tsh)-[:MAKES_UP]->(anteriorPituitary)
MERGE (acth)-[:MAKES_UP]->(anteriorPituitary)
MERGE (insulin)-[:MAKES_UP]->(isletsLangerhans)
MERGE (glucagon)-[:MAKES_UP]->(isletsLangerhans)
MERGE (cortisol)-[:MAKES_UP]->(adrenalCortex)
MERGE (thyroxine)-[:MAKES_UP]->(thyroid)
MERGE (melatonin)-[:MAKES_UP]->(pineal)

// Tissues
MERGE (endocrineGlandularTissue {name: 'Endocrine Glandular Tissue'})
SET endocrineGlandularTissue:L1:Health:Tissue,
    endocrineGlandularTissue.description = 'Specialized tissue that produces hormones',
    endocrineGlandularTissue.cellTypes = ['Chief cells', 'Chromaffin cells', 'Beta cells']

MERGE (neuroendocrineTissue {name: 'Neuroendocrine Tissue'})
SET neuroendocrineTissue:L1:Health:Tissue,
    neuroendocrineTissue.description = 'Tissue that combines neural and hormonal signaling',
    neuroendocrineTissue.cellTypes = ['Neurosecretory cells', 'Peptidergic neurons']

MERGE (connectiveTissue {name: 'Connective Tissue'})
SET connectiveTissue:L1:Health:Tissue,
    connectiveTissue.description = 'Supporting tissue that provides structure and blood supply',
    connectiveTissue.cellTypes = ['Fibroblasts', 'Blood vessels', 'Immune cells']

// Connect tissues to organs
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(pituitary)
MERGE (connectiveTissue)-[:MAKES_UP]->(pituitary)
MERGE (neuroendocrineTissue)-[:MAKES_UP]->(hypothalamus)
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(thyroid)
MERGE (connectiveTissue)-[:MAKES_UP]->(thyroid)
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(parathyroid)
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(adrenal)
MERGE (connectiveTissue)-[:MAKES_UP]->(adrenal)
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(pancreas)
MERGE (connectiveTissue)-[:MAKES_UP]->(pancreas)
MERGE (endocrineGlandularTissue)-[:MAKES_UP]->(gonads)
MERGE (connectiveTissue)-[:MAKES_UP]->(gonads)