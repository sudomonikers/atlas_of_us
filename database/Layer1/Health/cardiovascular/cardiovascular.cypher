// Main System Node
MATCH (cardio {name: 'Cardiovascular System'})

// Major Organs and Structures
MERGE (heart {name: 'Heart'})
SET heart:L1:Health:Organ,
    heart.description = 'Four-chambered muscular organ that pumps blood throughout the body'

MERGE (arteries {name: 'Arterial System'})
SET arteries:L1:Structure:Health,
    arteries.description = 'Network of blood vessels that carry oxygenated blood away from the heart to body tissues'

MERGE (veins {name: 'Venous System'})
SET veins:L1:Structure:Health,
    veins.description = 'Network of blood vessels that return deoxygenated blood from body tissues back to the heart'

MERGE (capillaries {name: 'Capillary System'})
SET capillaries:L1:Structure:Health,
    capillaries.description = 'Microscopic blood vessels that enable exchange of oxygen, nutrients, and waste between blood and tissues'

// Connect major structures to system
MERGE (heart)-[:MAKES_UP]->(cardio)
MERGE (arteries)-[:MAKES_UP]->(cardio)
MERGE (veins)-[:MAKES_UP]->(cardio)
MERGE (capillaries)-[:MAKES_UP]->(cardio)

// Break down of major organs and structures (Heart Components)
MERGE (leftAtrium {name: 'Left Atrium'})
SET leftAtrium:L1:Structure:Health,
    leftAtrium.description = 'Upper left chamber of the heart that receives oxygenated blood from the lungs'

MERGE (rightAtrium {name: 'Right Atrium'})
SET rightAtrium:L1:Structure:Health,
    rightAtrium.description = 'Upper right chamber of the heart that receives deoxygenated blood from the body'

MERGE (leftVentricle {name: 'Left Ventricle'})
SET leftVentricle:L1:Structure:Health,
    leftVentricle.description = 'Lower left chamber of the heart that pumps oxygenated blood to the body'

MERGE (rightVentricle {name: 'Right Ventricle'})
SET rightVentricle:L1:Structure:Health,
    rightVentricle.description = 'Lower right chamber of the heart that pumps deoxygenated blood to the lungs'

MERGE (heartValves {name: 'Heart Valves'})
SET heartValves:L1:Structure:Health,
    heartValves.description = 'Structures that control unidirectional blood flow through the heart chambers'

MERGE (cardiacMuscle {name: 'Cardiac Muscle'})
SET cardiacMuscle:L1:Tissue:Health,
    cardiacMuscle.description = 'Specialized muscle tissue that forms the heart wall and enables pumping action'

MERGE (conductionSystem {name: 'Cardiac Conduction System'})
SET conductionSystem:L1:Structure:Health,
    conductionSystem.description = 'Electrical system that coordinates heart contractions'

// Connect heart components
MERGE (heart)-[:CONTAINS]->(leftAtrium)
MERGE (heart)-[:CONTAINS]->(rightAtrium)
MERGE (heart)-[:CONTAINS]->(leftVentricle)
MERGE (heart)-[:CONTAINS]->(rightVentricle)
MERGE (heart)-[:CONTAINS]->(heartValves)
MERGE (heart)-[:CONTAINS]->(cardiacMuscle)
MERGE (heart)-[:CONTAINS]->(conductionSystem)

// Blood and its components
MERGE (blood {name: 'Blood'})
SET blood:Tissue:Health, blood.description = 'Fluid tissue that transports oxygen, nutrients, hormones, and waste throughout the body'

MERGE (redCells {name: 'Red Blood Cells'})
SET redCells:Component:Health, redCells.description = 'Blood cells responsible for oxygen transport'

MERGE (whiteCells {name: 'White Blood Cells'})
SET whiteCells:Component:Health, whiteCells.description = 'Blood cells responsible for immune defense'

MERGE (platelets {name: 'Platelets'})
SET platelets:Component:Health, platelets.description = 'Cell fragments essential for blood clotting'

MERGE (plasma {name: 'Plasma'})
SET plasma:Component:Health, plasma.description = 'Liquid component of blood that carries cells, proteins, and other substances'

// Connect blood components
MERGE (cardio)-[:CONTAINS]->(blood)
MERGE (blood)-[:COMPOSED_OF]->(redCells)
MERGE (blood)-[:COMPOSED_OF]->(whiteCells)
MERGE (blood)-[:COMPOSED_OF]->(platelets)
MERGE (blood)-[:COMPOSED_OF]->(plasma)

// Vessel Wall Tissues
MERGE (endothelium {name: 'Endothelium'})
SET endothelium:Tissue:Health, endothelium.description = 'Inner lining of blood vessels that regulates exchange and blood flow'

MERGE (smoothMuscle {name: 'Vascular Smooth Muscle'})
SET smoothMuscle:Tissue:Health, smoothMuscle.description = 'Muscle tissue in vessel walls that controls vessel diameter'

MERGE (elasticTissue {name: 'Elastic Tissue'})
SET elasticTissue:Tissue:Health, elasticTissue.description = 'Flexible tissue in vessel walls that maintains blood pressure'

// Connect vessel tissues to structures
MERGE (arteries)-[:CONTAINS]->(endothelium)
MERGE (arteries)-[:CONTAINS]->(smoothMuscle)
MERGE (arteries)-[:CONTAINS]->(elasticTissue)
MERGE (veins)-[:CONTAINS]->(endothelium)
MERGE (veins)-[:CONTAINS]->(smoothMuscle)
MERGE (veins)-[:CONTAINS]->(elasticTissue)



// Create measurable properties
MERGE (bloodPressure {name: 'Blood Pressure'})
SET bloodPressure:Measurement:Health, bloodPressure.description = 'Force of blood against vessel walls',
    bloodPressure.units = 'mmHg',
    bloodPressure.normalRange = '90/60 - 120/80'

MERGE (heartRate {name: 'Heart Rate'})
SET heartRate:Measurement:Health, heartRate.description = 'Number of heartbeats per minute',
    heartRate.units = 'bpm',
    heartRate.normalRange = '60-100'

MERGE (ejectionFraction {name: 'Ejection Fraction'})
SET ejectionFraction:Measurement:Health, ejectionFraction.description = 'Percentage of blood pumped out of ventricles with each contraction',
    ejectionFraction.units = 'percentage',
    ejectionFraction.normalRange = '55-70'

// Connect measurements to appropriate structures
MERGE (cardio)-[:HAS_MEASUREMENT]->(bloodPressure)
MERGE (heart)-[:HAS_MEASUREMENT]->(heartRate)
MERGE (heart)-[:HAS_MEASUREMENT]->(ejectionFraction)