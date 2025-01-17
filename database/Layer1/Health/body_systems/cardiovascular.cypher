// Main System Node
MERGE (cardio:System {name: 'Cardiovascular System'})
SET cardio.description = 'Primary system responsible for blood circulation, oxygen delivery, and waste removal throughout the body'

// Major Organs and Structures
MERGE (heart:Organ {name: 'Heart'})
SET heart.description = 'Four-chambered muscular organ that pumps blood throughout the body'

MERGE (arteries:Structure {name: 'Arterial System'})
SET arteries.description = 'Network of blood vessels that carry oxygenated blood away from the heart to body tissues'

MERGE (veins:Structure {name: 'Venous System'})
SET veins.description = 'Network of blood vessels that return deoxygenated blood from body tissues back to the heart'

MERGE (capillaries:Structure {name: 'Capillary System'})
SET capillaries.description = 'Microscopic blood vessels that enable exchange of oxygen, nutrients, and waste between blood and tissues'

// Connect major structures to system
MERGE (cardio)-[:CONTAINS]->(heart)
MERGE (cardio)-[:CONTAINS]->(arteries)
MERGE (cardio)-[:CONTAINS]->(veins)
MERGE (cardio)-[:CONTAINS]->(capillaries)

// Heart Components
MERGE (leftAtrium:Structure {name: 'Left Atrium'})
SET leftAtrium.description = 'Upper left chamber of the heart that receives oxygenated blood from the lungs'

MERGE (rightAtrium:Structure {name: 'Right Atrium'})
SET rightAtrium.description = 'Upper right chamber of the heart that receives deoxygenated blood from the body'

MERGE (leftVentricle:Structure {name: 'Left Ventricle'})
SET leftVentricle.description = 'Lower left chamber of the heart that pumps oxygenated blood to the body'

MERGE (rightVentricle:Structure {name: 'Right Ventricle'})
SET rightVentricle.description = 'Lower right chamber of the heart that pumps deoxygenated blood to the lungs'

MERGE (heartValves:Structure {name: 'Heart Valves'})
SET heartValves.description = 'Structures that control unidirectional blood flow through the heart chambers'

MERGE (cardiacMuscle:Tissue {name: 'Cardiac Muscle'})
SET cardiacMuscle.description = 'Specialized muscle tissue that forms the heart wall and enables pumping action'

MERGE (conductionSystem:Structure {name: 'Cardiac Conduction System'})
SET conductionSystem.description = 'Electrical system that coordinates heart contractions'

// Connect heart components
MERGE (heart)-[:CONTAINS]->(leftAtrium)
MERGE (heart)-[:CONTAINS]->(rightAtrium)
MERGE (heart)-[:CONTAINS]->(leftVentricle)
MERGE (heart)-[:CONTAINS]->(rightVentricle)
MERGE (heart)-[:CONTAINS]->(heartValves)
MERGE (heart)-[:CONTAINS]->(cardiacMuscle)
MERGE (heart)-[:CONTAINS]->(conductionSystem)

// Blood and its components
MERGE (blood:Tissue {name: 'Blood'})
SET blood.description = 'Fluid tissue that transports oxygen, nutrients, hormones, and waste throughout the body'

MERGE (redCells:Component {name: 'Red Blood Cells'})
SET redCells.description = 'Blood cells responsible for oxygen transport'

MERGE (whiteCells:Component {name: 'White Blood Cells'})
SET whiteCells.description = 'Blood cells responsible for immune defense'

MERGE (platelets:Component {name: 'Platelets'})
SET platelets.description = 'Cell fragments essential for blood clotting'

MERGE (plasma:Component {name: 'Plasma'})
SET plasma.description = 'Liquid component of blood that carries cells, proteins, and other substances'

// Connect blood components
MERGE (cardio)-[:CONTAINS]->(blood)
MERGE (blood)-[:COMPOSED_OF]->(redCells)
MERGE (blood)-[:COMPOSED_OF]->(whiteCells)
MERGE (blood)-[:COMPOSED_OF]->(platelets)
MERGE (blood)-[:COMPOSED_OF]->(plasma)

// Vessel Wall Tissues
MERGE (endothelium:Tissue {name: 'Endothelium'})
SET endothelium.description = 'Inner lining of blood vessels that regulates exchange and blood flow'

MERGE (smoothMuscle:Tissue {name: 'Vascular Smooth Muscle'})
SET smoothMuscle.description = 'Muscle tissue in vessel walls that controls vessel diameter'

MERGE (elasticTissue:Tissue {name: 'Elastic Tissue'})
SET elasticTissue.description = 'Flexible tissue in vessel walls that maintains blood pressure'

// Connect vessel tissues to structures
MERGE (arteries)-[:CONTAINS]->(endothelium)
MERGE (arteries)-[:CONTAINS]->(smoothMuscle)
MERGE (arteries)-[:CONTAINS]->(elasticTissue)
MERGE (veins)-[:CONTAINS]->(endothelium)
MERGE (veins)-[:CONTAINS]->(smoothMuscle)
MERGE (veins)-[:CONTAINS]->(elasticTissue)

// Conditions/Variations at System Level
MERGE (hypertension:Condition {name: 'Hypertension'})
SET hypertension.description = 'Chronic elevation of blood pressure above 130/80 mmHg',
    hypertension.affects = 'system-wide',
    hypertension.measurements = ['systolic pressure', 'diastolic pressure']

MERGE (hypotension:Condition {name: 'Hypotension'})
SET hypotension.description = 'Chronic low blood pressure below 90/60 mmHg',
    hypotension.affects = 'system-wide'

// Heart Conditions
MERGE (chd:Condition {name: 'Coronary Heart Disease'})
SET chd.description = 'Narrowing or blockage of coronary arteries due to atherosclerosis'

MERGE (arrhythmia:Condition {name: 'Cardiac Arrhythmia'})
SET arrhythmia.description = 'Abnormal heart rhythm due to electrical conduction problems',
    arrhythmia.types = ['bradycardia', 'tachycardia', 'fibrillation']

MERGE (heartFailure:Condition {name: 'Heart Failure'})
SET heartFailure.description = 'Condition where heart cannot pump blood efficiently',
    heartFailure.types = ['systolic', 'diastolic']

MERGE (valveDisease:Condition {name: 'Valve Disease'})
SET valveDisease.description = 'Dysfunction of heart valves affecting blood flow',
    valveDisease.types = ['stenosis', 'regurgitation']

// Blood Vessel Conditions
MERGE (atherosclerosis:Condition {name: 'Atherosclerosis'})
SET atherosclerosis.description = 'Buildup of plaque inside artery walls'

MERGE (varicoseVeins:Condition {name: 'Varicose Veins'})
SET varicoseVeins.description = 'Enlarged and twisted veins, usually in legs'

MERGE (aneurysm:Condition {name: 'Aneurysm'})
SET aneurysm.description = 'Dangerous bulging of vessel wall due to weakness'

// Blood Conditions
MERGE (anemia:Condition {name: 'Anemia'})
SET anemia.description = 'Insufficient red blood cells or hemoglobin',
    anemia.types = ['iron-deficiency', 'sickle-cell', 'aplastic']

MERGE (leukemia:Condition {name: 'Leukemia'})
SET leukemia.description = 'Cancer of blood-forming tissues',
    leukemia.types = ['acute', 'chronic']

MERGE (hemophilia:Condition {name: 'Hemophilia'})
SET hemophilia.description = 'Inherited disorder affecting blood\'s ability to clot'

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
MERGE (bloodPressure:Measurement {name: 'Blood Pressure'})
SET bloodPressure.description = 'Force of blood against vessel walls',
    bloodPressure.units = 'mmHg',
    bloodPressure.normalRange = '90/60 - 120/80'

MERGE (heartRate:Measurement {name: 'Heart Rate'})
SET heartRate.description = 'Number of heartbeats per minute',
    heartRate.units = 'bpm',
    heartRate.normalRange = '60-100'

MERGE (ejectionFraction:Measurement {name: 'Ejection Fraction'})
SET ejectionFraction.description = 'Percentage of blood pumped out of ventricles with each contraction',
    ejectionFraction.units = 'percentage',
    ejectionFraction.normalRange = '55-70'

// Connect measurements to appropriate structures
MERGE (cardio)-[:HAS_MEASUREMENT]->(bloodPressure)
MERGE (heart)-[:HAS_MEASUREMENT]->(heartRate)
MERGE (heart)-[:HAS_MEASUREMENT]->(ejectionFraction)