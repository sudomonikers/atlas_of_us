// Main System Node
MATCH (renal {name: 'Renal System'})

// Major Organs and Structures
MERGE (kidneys {name: 'Kidneys'})
SET kidneys:L1:Health:Organ,
    kidneys.description = 'Pair of bean-shaped organs that filter blood and produce urine'

MERGE (ureters {name: 'Ureters'})
SET ureters:L1:Health:Structure,
    ureters.description = 'Pair of tubes that carry urine from kidneys to bladder'

MERGE (bladder {name: 'Urinary Bladder'})
SET bladder:L1:Health:Organ,
    bladder.description = 'Muscular sac that stores urine until elimination'

MERGE (urethra {name: 'Urethra'})
SET urethra:L1:Health:Structure,
    urethra.description = 'Tube that carries urine from bladder to outside the body'

// Connect major structures to system
MERGE (kidneys)-[:MAKES_UP]->(renal)
MERGE (ureters)-[:MAKES_UP]->(renal)
MERGE (bladder)-[:MAKES_UP]->(renal)
MERGE (urethra)-[:MAKES_UP]->(renal)

// Kidney Components
MERGE (cortex {name: 'Renal Cortex'})
SET cortex:L1:Health:Structure,
    cortex.description = 'Outer region of kidney containing most nephrons'

MERGE (medulla {name: 'Renal Medulla'})
SET medulla:L1:Health:Structure,
    medulla.description = 'Inner region of kidney containing loop of Henle and collecting ducts'

MERGE (nephron {name: 'Nephron'})
SET nephron:L1:Health:Structure,
    nephron.description = 'Basic structural and functional unit of kidney responsible for blood filtration'

MERGE (glomerulus {name: 'Glomerulus'})
SET glomerulus:L1:Health:Structure,
    glomerulus.description = 'Cluster of capillaries in nephron where initial blood filtration occurs'

MERGE (bowman {name: 'Bowmans Capsule'})
SET bowman:L1:Health:Structure,
    bowman.description = 'Cup-shaped structure surrounding glomerulus that collects filtered fluid'

MERGE (tubules {name: 'Renal Tubules'})
SET tubules:L1:Health:Structure,
    tubules.description = 'Series of tubes in nephron where filtered fluid is processed into urine'

MERGE (collecting {name: 'Collecting Ducts'})
SET collecting:L1:Health:Structure,
    collecting.description = 'Tubes that gather processed fluid from multiple nephrons and transport it to renal pelvis'

// Connect kidney components
MERGE (cortex)-[:MAKES_UP]->(kidneys)
MERGE (medulla)-[:MAKES_UP]->(kidneys)
MERGE (nephron)-[:MAKES_UP]->(kidneys)
MERGE (glomerulus)-[:MAKES_UP]->(nephron)
MERGE (bowman)-[:MAKES_UP]->(nephron)
MERGE (tubules)-[:MAKES_UP]->(nephron)
MERGE (collecting)-[:MAKES_UP]->(kidneys)

// Tissues
MERGE (transitional {name: 'Transitional Epithelium'})
SET transitional:L1:Health:Tissue,
    transitional.description = 'Specialized epithelial tissue that can stretch and contract, lines urinary tract'

MERGE (renalMuscle {name: 'Detrusor Muscle'})
SET renalMuscle:L1:Health:Tissue,
    renalMuscle.description = 'Smooth muscle tissue in bladder wall that contracts during urination'

// Connect tissues to structures
MERGE (transitional)-[:MAKES_UP]->(bladder)
MERGE (renalMuscle)-[:MAKES_UP]->(bladder)
MERGE (transitional)-[:MAKES_UP]->(ureters)
MERGE (transitional)-[:MAKES_UP]->(urethra)