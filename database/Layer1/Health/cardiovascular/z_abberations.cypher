// // Conditions/Variations at System Level
// MERGE (hypertension {name: 'Hypertension'})
// SET hypertension:Condition:Health, hypertension.description = 'Chronic elevation of blood pressure above 130/80 mmHg',
//     hypertension.affects = 'system-wide',
//     hypertension.measurements = ['systolic pressure', 'diastolic pressure']

// MERGE (hypotension {name: 'Hypotension'})
// SET hypotension:Condition:Health, hypotension.description = 'Chronic low blood pressure below 90/60 mmHg',
//     hypotension.affects = 'system-wide'

// // Heart Conditions
// MERGE (chd {name: 'Coronary Heart Disease'})
// SET chd:Condition:Health, chd.description = 'Narrowing or blockage of coronary arteries due to atherosclerosis'

// MERGE (arrhythmia {name: 'Cardiac Arrhythmia'})
// SET arrhythmia:Condition:Health, arrhythmia.description = 'Abnormal heart rhythm due to electrical conduction problems',
//     arrhythmia.types = ['bradycardia', 'tachycardia', 'fibrillation']

// MERGE (heartFailure {name: 'Heart Failure'})
// SET heartFailure:Condition:Health, heartFailure.description = 'Condition where heart cannot pump blood efficiently',
//     heartFailure.types = ['systolic', 'diastolic']

// MERGE (valveDisease {name: 'Valve Disease'})
// SET valveDisease:Condition:Health, valveDisease.description = 'Dysfunction of heart valves affecting blood flow',
//     valveDisease.types = ['stenosis', 'regurgitation']

// // Blood Vessel Conditions
// MERGE (atherosclerosis {name: 'Atherosclerosis'})
// SET atherosclerosis:Condition:Health, atherosclerosis.description = 'Buildup of plaque inside artery walls'

// MERGE (varicoseVeins {name: 'Varicose Veins'})
// SET varicoseVeins:Condition:Health, varicoseVeins.description = 'Enlarged and twisted veins, usually in legs'

// MERGE (aneurysm {name: 'Aneurysm'})
// SET aneurysm:Condition:Health, aneurysm.description = 'Dangerous bulging of vessel wall due to weakness'

// // Blood Conditions
// MERGE (anemia {name: 'Anemia'})
// SET anemia:Condition:Health, anemia.description = 'Insufficient red blood cells or hemoglobin',
//     anemia.types = ['iron-deficiency', 'sickle-cell', 'aplastic']

// MERGE (leukemia {name: 'Leukemia'})
// SET leukemia:Condition:Health, leukemia.description = 'Cancer of blood-forming tissues',
//     leukemia.types = ['acute', 'chronic']

// MERGE (hemophilia {name: 'Hemophilia'})
// SET hemophilia:Condition:Health, hemophilia.description = 'Inherited disorder affecting blood\'s ability to clot'

// // Connect conditions to appropriate structures
// MERGE (cardio)-[:CAN_HAVE]->(hypertension)
// MERGE (cardio)-[:CAN_HAVE]->(hypotension)
// MERGE (heart)-[:CAN_HAVE]->(chd)
// MERGE (heart)-[:CAN_HAVE]->(arrhythmia)
// MERGE (heart)-[:CAN_HAVE]->(heartFailure)
// MERGE (heartValves)-[:CAN_HAVE]->(valveDisease)
// MERGE (arteries)-[:CAN_HAVE]->(atherosclerosis)
// MERGE (veins)-[:CAN_HAVE]->(varicoseVeins)
// MERGE (arteries)-[:CAN_HAVE]->(aneurysm)
// MERGE (veins)-[:CAN_HAVE]->(aneurysm)
// MERGE (blood)-[:CAN_HAVE]->(anemia)
// MERGE (blood)-[:CAN_HAVE]->(leukemia)
// MERGE (blood)-[:CAN_HAVE]->(hemophilia)