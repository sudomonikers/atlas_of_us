// Main System Node
MERGE (cardio {name: 'Cardiovascular System'})
SET cardio:System:Health, cardio.description = 'Primary system responsible for blood circulation, oxygen delivery, and waste removal throughout the body'

// Major Organs and Structures
MERGE (heart {name: 'Heart'})
SET heart:Organ:Health, heart.description = 'Four-chambered muscular organ that pumps blood throughout the body'

MERGE (arteries {name: 'Arterial System'})
SET arteries:Structure:Health, arteries.description = 'Network of blood vessels that carry oxygenated blood away from the heart to body tissues'

MERGE (veins {name: 'Venous System'})
SET veins:Structure:Health, veins.description = 'Network of blood vessels that return deoxygenated blood from body tissues back to the heart'

MERGE (capillaries {name: 'Capillary System'})
SET capillaries:Structure:Health, capillaries.description = 'Microscopic blood vessels that enable exchange of oxygen, nutrients, and waste between blood and tissues'

// Connect major structures to system
MERGE (cardio)-[:CONTAINS]->(heart)
MERGE (cardio)-[:CONTAINS]->(arteries)
MERGE (cardio)-[:CONTAINS]->(veins)
MERGE (cardio)-[:CONTAINS]->(capillaries)

// Heart Components
MERGE (leftAtrium {name: 'Left Atrium'})
SET leftAtrium:Structure:Health, leftAtrium.description = 'Upper left chamber of the heart that receives oxygenated blood from the lungs'

MERGE (rightAtrium {name: 'Right Atrium'})
SET rightAtrium:Structure:Health, rightAtrium.description = 'Upper right chamber of the heart that receives deoxygenated blood from the body'

MERGE (leftVentricle {name: 'Left Ventricle'})
SET leftVentricle:Structure:Health, leftVentricle.description = 'Lower left chamber of the heart that pumps oxygenated blood to the body'

MERGE (rightVentricle {name: 'Right Ventricle'})
SET rightVentricle:Structure:Health, rightVentricle.description = 'Lower right chamber of the heart that pumps deoxygenated blood to the lungs'

MERGE (heartValves {name: 'Heart Valves'})
SET heartValves:Structure:Health, heartValves.description = 'Structures that control unidirectional blood flow through the heart chambers'

MERGE (cardiacMuscle {name: 'Cardiac Muscle'})
SET cardiacMuscle:Tissue:Health, cardiacMuscle.description = 'Specialized muscle tissue that forms the heart wall and enables pumping action'

MERGE (conductionSystem {name: 'Cardiac Conduction System'})
SET conductionSystem:Structure:Health, conductionSystem.description = 'Electrical system that coordinates heart contractions'

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

// Conditions/Variations at System Level
MERGE (hypertension {name: 'Hypertension'})
SET hypertension:Condition:Health:Health, hypertension.description = 'Chronic elevation of blood pressure above 130/80 mmHg',
    hypertension.affects = 'system-wide',
    hypertension.measurements = ['systolic pressure', 'diastolic pressure']

MERGE (hypotension {name: 'Hypotension'})
SET hypotension:Condition:Health:Health, hypotension.description = 'Chronic low blood pressure below 90/60 mmHg',
    hypotension.affects = 'system-wide'

// Heart Conditions
MERGE (chd {name: 'Coronary Heart Disease'})
SET chd:Condition:Health:Health, chd.description = 'Narrowing or blockage of coronary arteries due to atherosclerosis'

MERGE (arrhythmia {name: 'Cardiac Arrhythmia'})
SET arrhythmia:Condition:Health:Health, arrhythmia.description = 'Abnormal heart rhythm due to electrical conduction problems',
    arrhythmia.types = ['bradycardia', 'tachycardia', 'fibrillation']

MERGE (heartFailure {name: 'Heart Failure'})
SET heartFailure:Condition:Health:Health, heartFailure.description = 'Condition where heart cannot pump blood efficiently',
    heartFailure.types = ['systolic', 'diastolic']

MERGE (valveDisease {name: 'Valve Disease'})
SET valveDisease:Condition:Health:Health, valveDisease.description = 'Dysfunction of heart valves affecting blood flow',
    valveDisease.types = ['stenosis', 'regurgitation']

// Blood Vessel Conditions
MERGE (atherosclerosis {name: 'Atherosclerosis'})
SET atherosclerosis:Condition:Health:Health, atherosclerosis.description = 'Buildup of plaque inside artery walls'

MERGE (varicoseVeins {name: 'Varicose Veins'})
SET varicoseVeins:Condition:Health:Health, varicoseVeins.description = 'Enlarged and twisted veins, usually in legs'

MERGE (aneurysm {name: 'Aneurysm'})
SET aneurysm:Condition:Health:Health, aneurysm.description = 'Dangerous bulging of vessel wall due to weakness'

// Blood Conditions
MERGE (anemia {name: 'Anemia'})
SET anemia:Condition:Health:Health, anemia.description = 'Insufficient red blood cells or hemoglobin',
    anemia.types = ['iron-deficiency', 'sickle-cell', 'aplastic']

MERGE (leukemia {name: 'Leukemia'})
SET leukemia:Condition:Health:Health, leukemia.description = 'Cancer of blood-forming tissues',
    leukemia.types = ['acute', 'chronic']

MERGE (hemophilia {name: 'Hemophilia'})
SET hemophilia:Condition:Health:Health, hemophilia.description = 'Inherited disorder affecting blood\'s ability to clot'

// Connect conditions to appropriate structures
MERGE (cardio)-[:CAN_HAVE]->(hypertension)
MERGE (cardio)-[:CAN_HAVE]->(hypotension)
MERGE (heart)-[:CAN_HAVE]->(chd)
MERGE (heart)-[:CAN_HAVE]->(arrhythmia)
MERGE (heart)-[:CAN_HAVE]->(heartFailure)
MERGE (heartValves)-[:CAN_HAVE]->(valveDisease)
MERGE (arteries)-[:CAN_HAVE]->(atherosclerosis)
MERGE (veins)-[:CAN_HAVE]->(varicoseVeins)
MERGE (arteries)-[:CAN_HAVE]->(aneurysm)
MERGE (veins)-[:CAN_HAVE]->(aneurysm)
MERGE (blood)-[:CAN_HAVE]->(anemia)
MERGE (blood)-[:CAN_HAVE]->(leukemia)
MERGE (blood)-[:CAN_HAVE]->(hemophilia)

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