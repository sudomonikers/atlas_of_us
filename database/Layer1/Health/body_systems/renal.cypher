// Main System Node
MERGE (renal {name: 'Renal System'})
SET renal:System, renal.description = 'System responsible for filtering blood, maintaining fluid balance, and removing waste products through urine production'

// Major Organs and Structures
MERGE (kidneys {name: 'Kidneys'})
SET kidneys:Organ:Health, kidneys.description = 'Pair of bean-shaped organs that filter blood and produce urine'

MERGE (ureters {name: 'Ureters'})
SET ureters:Structure:Health, ureters.description = 'Pair of tubes that carry urine from kidneys to bladder'

MERGE (bladder {name: 'Urinary Bladder'})
SET bladder:Organ:Health, bladder.description = 'Muscular sac that stores urine until elimination'

MERGE (urethra {name: 'Urethra'})
SET urethra:Structure:Health, urethra.description = 'Tube that carries urine from bladder to outside the body'

// Connect major structures to system
MERGE (renal)-[:CONTAINS]->(kidneys)
MERGE (renal)-[:CONTAINS]->(ureters)
MERGE (renal)-[:CONTAINS]->(bladder)
MERGE (renal)-[:CONTAINS]->(urethra)

// Kidney Components
MERGE (cortex {name: 'Renal Cortex'})
SET cortex:Structure:Health, cortex.description = 'Outer region of kidney containing most nephrons'

MERGE (medulla {name: 'Renal Medulla'})
SET medulla:Structure:Health, medulla.description = 'Inner region of kidney containing loop of Henle and collecting ducts'

MERGE (nephron {name: 'Nephron'})
SET nephron:Structure:Health, nephron.description = 'Basic structural and functional unit of kidney responsible for blood filtration'

MERGE (glomerulus {name: 'Glomerulus'})
SET glomerulus:Structure:Health, glomerulus.description = 'Cluster of capillaries in nephron where initial blood filtration occurs'

MERGE (bowman {name: 'Bowmans Capsule'})
SET bowman:Structure:Health, bowman.description = 'Cup-shaped structure surrounding glomerulus that collects filtered fluid'

MERGE (tubules {name: 'Renal Tubules'})
SET tubules:Structure:Health, tubules.description = 'Series of tubes in nephron where filtered fluid is processed into urine'

MERGE (collecting {name: 'Collecting Ducts'})
SET collecting:Structure:Health, collecting.description = 'Tubes that gather processed fluid from multiple nephrons and transport it to renal pelvis'

// Connect kidney components
MERGE (kidneys)-[:CONTAINS]->(cortex)
MERGE (kidneys)-[:CONTAINS]->(medulla)
MERGE (kidneys)-[:CONTAINS]->(nephron)
MERGE (nephron)-[:CONTAINS]->(glomerulus)
MERGE (nephron)-[:CONTAINS]->(bowman)
MERGE (nephron)-[:CONTAINS]->(tubules)
MERGE (kidneys)-[:CONTAINS]->(collecting)

// Tissues
MERGE (transitional {name: 'Transitional Epithelium'})
SET transitional:Tissue:Health, transitional.description = 'Specialized epithelial tissue that can stretch and contract, lines urinary tract'

MERGE (renalMuscle {name: 'Detrusor Muscle'})
SET renalMuscle:Tissue:Health, renalMuscle.description = 'Smooth muscle tissue in bladder wall that contracts during urination'

// Connect tissues to structures
MERGE (bladder)-[:CONTAINS]->(transitional)
MERGE (bladder)-[:CONTAINS]->(renalMuscle)
MERGE (ureters)-[:CONTAINS]->(transitional)
MERGE (urethra)-[:CONTAINS]->(transitional)

// Example Conditions
MERGE (ckd {name: 'Chronic Kidney Disease'})
SET ckd:Condition:Health, ckd.description = 'Progressive loss of kidney function over time',
    ckd.affects = 'kidneys',
    ckd.stages = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']

MERGE (stones {name: 'Kidney Stones'})
SET stones:Condition:Health, stones.description = 'Solid deposits that form in the kidneys',
    stones.types = ['calcium', 'uric acid', 'struvite', 'cystine']

MERGE (uti {name: 'Urinary Tract Infection'})
SET uti:Condition:Health, uti.description = 'Infection in any part of the urinary system',
    uti.types = ['bladder infection', 'kidney infection', 'urethra infection']

// Connect conditions to structures
MERGE (kidneys)-[:CAN_HAVE]->(ckd)
MERGE (kidneys)-[:CAN_HAVE]->(stones)
MERGE (renal)-[:CAN_HAVE]->(uti)

// Measurable Properties
MERGE (gfr {name: 'Glomerular Filtration Rate'})
SET gfr:Measurement:Health, gfr.description = 'Amount of blood filtered by kidneys per minute',
    gfr.units = 'mL/min/1.73m²',
    gfr.normalRange = '90-120'

MERGE (creatinine {name: 'Creatinine Level'})
SET creatinine:Measurement:Health, creatinine.description = 'Waste product level in blood indicating kidney function',
    creatinine.units = 'mg/dL',
    creatinine.normalRange = '0.7-1.3'

MERGE (urineOutput {name: 'Urine Output'})
SET urineOutput:Measurement:Health, urineOutput.description = 'Volume of urine produced per day',
    urineOutput.units = 'mL/day',
    urineOutput.normalRange = '800-2000'

// Connect measurements to system
MERGE (kidneys)-[:HAS_MEASUREMENT]->(gfr)
MERGE (kidneys)-[:HAS_MEASUREMENT]->(creatinine)
MERGE (renal)-[:HAS_MEASUREMENT]->(urineOutput)