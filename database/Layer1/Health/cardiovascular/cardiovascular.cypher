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
MERGE (leftAtrium)-[:MAKES_UP]->(heart)
MERGE (rightAtrium)-[:MAKES_UP]->(heart)
MERGE (leftVentricle)-[:MAKES_UP]->(heart)
MERGE (rightVentricle)-[:MAKES_UP]->(heart)
MERGE (heartValves)-[:MAKES_UP]->(heart)
MERGE (cardiacMuscle)-[:MAKES_UP]->(heart)
MERGE (conductionSystem)-[:MAKES_UP]->(heart)

// Blood and its components
MERGE (blood {name: 'Blood'})
SET blood:L1:Tissue:Health, blood.description = 'Fluid tissue that transports oxygen, nutrients, hormones, and waste throughout the body'

MERGE (redCells {name: 'Red Blood Cells'})
SET redCells:L1:Component:Health, redCells.description = 'Blood cells responsible for oxygen transport'

MERGE (whiteCells {name: 'White Blood Cells'})
SET whiteCells:L1:Component:Health, whiteCells.description = 'Blood cells responsible for immune defense'

MERGE (platelets {name: 'Platelets'})
SET platelets:L1:Component:Health, platelets.description = 'Cell fragments essential for blood clotting'

MERGE (plasma {name: 'Plasma'})
SET plasma:L1:Component:Health, plasma.description = 'Liquid component of blood that carries cells, proteins, and other substances'

// Connect blood components
MERGE (blood)-[:MAKES_UP]->(cardio)
MERGE (redCells)-[:MAKES_UP]->(blood)
MERGE (whiteCells)-[:MAKES_UP]->(blood)
MERGE (platelets)-[:MAKES_UP]->(blood)
MERGE (plasma)-[:MAKES_UP]->(blood)

// Vessel Wall Tissues
MERGE (endothelium {name: 'Endothelium'})
SET endothelium:L1:Tissue:Health, endothelium.description = 'Inner lining of blood vessels that regulates exchange and blood flow'

MERGE (smoothMuscle {name: 'Vascular Smooth Muscle'})
SET smoothMuscle:L1:Tissue:Health, smoothMuscle.description = 'Muscle tissue in vessel walls that controls vessel diameter'

MERGE (elasticTissue {name: 'Elastic Tissue'})
SET elasticTissue:L1:Tissue:Health, elasticTissue.description = 'Flexible tissue in vessel walls that maintains blood pressure'

// Connect vessel tissues to structures
MERGE (endothelium)-[:MAKES_UP]->(arteries)
MERGE (smoothMuscle)-[:MAKES_UP]->(arteries)
MERGE (elasticTissue)-[:MAKES_UP]->(arteries)
MERGE (endothelium)-[:MAKES_UP]->(veins)
MERGE (smoothMuscle)-[:MAKES_UP]->(veins)
MERGE (elasticTissue)-[:MAKES_UP]->(veins)

