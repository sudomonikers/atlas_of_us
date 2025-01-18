// Main System Node
MERGE (respiratory {name: 'Respiratory System'})
SET respiratory:System, respiratory.description = 'System responsible for gas exchange between the body and external environment, primarily oxygen intake and carbon dioxide removal'

// Major Organs and Structures
MERGE (lungs {name: 'Lungs'})
SET lungs:Organ, lungs.description = 'Pair of organs responsible for gas exchange, consisting of millions of tiny air sacs called alveoli'

MERGE (upperAirway {name: 'Upper Airway'})
SET upperAirway:Structure, upperAirway.description = 'Series of passages in the nose, mouth, and throat that filter, warm, and humidify incoming air'

MERGE (lowerAirway {name: 'Lower Airway'})
SET lowerAirway:Structure, lowerAirway.description = 'Airways below the larynx including the trachea, bronchi, and bronchioles'

MERGE (diaphragm {name: 'Diaphragm'})
SET diaphragm:Organ, diaphragm.description = 'Primary muscle of respiration that contracts and relaxes to facilitate breathing'

// Connect major structures to system
MERGE (respiratory)-[:CONTAINS]->(lungs)
MERGE (respiratory)-[:CONTAINS]->(upperAirway)
MERGE (respiratory)-[:CONTAINS]->(lowerAirway)
MERGE (respiratory)-[:CONTAINS]->(diaphragm)

// Upper Airway Components
MERGE (nasalCavity {name: 'Nasal Cavity'})
SET nasalCavity:Structure, nasalCavity.description = 'Air passage behind the nose containing structures that filter, warm, and humidify air'

MERGE (pharynx {name: 'Pharynx'})
SET pharynx:Structure, pharynx.description = 'Throat region that connects nasal and oral cavities to larynx'

MERGE (larynx {name: 'Larynx'})
SET larynx:Structure, larynx.description = 'Voice box containing vocal cords and protecting the entrance to lower airways'

// Connect upper airway components
MERGE (upperAirway)-[:CONTAINS]->(nasalCavity)
MERGE (upperAirway)-[:CONTAINS]->(pharynx)
MERGE (upperAirway)-[:CONTAINS]->(larynx)

// Lower Airway Components
MERGE (trachea {name: 'Trachea'})
SET trachea:Structure, trachea.description = 'Windpipe connecting larynx to bronchi, reinforced with cartilage rings'

MERGE (bronchi {name: 'Bronchi'})
SET bronchi:Structure, bronchi.description = 'Large airways that branch from trachea into each lung'

MERGE (bronchioles {name: 'Bronchioles'})
SET bronchioles:Structure, bronchioles.description = 'Smaller airways that branch from bronchi and end in alveoli'

MERGE (alveoli {name: 'Alveoli'})
SET alveoli:Structure, alveoli.description = 'Tiny air sacs where gas exchange occurs between air and blood'

// Connect lower airway components
MERGE (lowerAirway)-[:CONTAINS]->(trachea)
MERGE (lowerAirway)-[:CONTAINS]->(bronchi)
MERGE (lowerAirway)-[:CONTAINS]->(bronchioles)
MERGE (lungs)-[:CONTAINS]->(alveoli)

// Tissues
MERGE (respiratoryMembrane {name: 'Respiratory Membrane'})
SET respiratoryMembrane:Tissue, respiratoryMembrane.description = 'Thin tissue layer in alveoli where gas exchange occurs'

MERGE (cilliatedEpithelium {name: 'Cilliated Epithelium'})
SET cilliatedEpithelium:Tissue, cilliatedEpithelium.description = 'Specialized tissue with hair-like projections that move mucus and trapped particles up and out of airways'

MERGE (smoothMuscle {name: 'Airway Smooth Muscle'})
SET smoothMuscle:Tissue, smoothMuscle.description = 'Muscle tissue that can constrict or dilate airways to control airflow'

// Connect tissues to structures
MERGE (alveoli)-[:CONTAINS]->(respiratoryMembrane)
MERGE (bronchi)-[:CONTAINS]->(cilliatedEpithelium)
MERGE (bronchioles)-[:CONTAINS]->(cilliatedEpithelium)
MERGE (bronchi)-[:CONTAINS]->(smoothMuscle)
MERGE (bronchioles)-[:CONTAINS]->(smoothMuscle)

// Measurements
MERGE (respiratoryRate {name: 'Respiratory Rate'})
SET respiratoryRate:Measurement, respiratoryRate.description = 'Number of breaths taken per minute',
    respiratoryRate.units = 'breaths per minute',
    respiratoryRate.normalRange = '12-20'

MERGE (tidalVolume {name: 'Tidal Volume'})
SET tidalVolume:Measurement, tidalVolume.description = 'Amount of air moved in and out of lungs during normal breathing',
    tidalVolume.units = 'mL',
    tidalVolume.normalRange = '4-8 mL/kg'

MERGE (oxygenSaturation {name: 'Oxygen Saturation'})
SET oxygenSaturation:Measurement, oxygenSaturation.description = 'Percentage of oxygen-saturated hemoglobin relative to total hemoglobin in blood',
    oxygenSaturation.units = 'percentage',
    oxygenSaturation.normalRange = '95-100'

// Connect measurements
MERGE (respiratory)-[:HAS_MEASUREMENT]->(respiratoryRate)
MERGE (lungs)-[:HAS_MEASUREMENT]->(tidalVolume)
MERGE (respiratory)-[:HAS_MEASUREMENT]->(oxygenSaturation)

// Example Conditions/Variations
MERGE (asthma {name: 'Asthma'})
SET asthma:Condition, asthma.description = 'Chronic condition causing airway inflammation and narrowing',
    asthma.affects = 'airways',
    asthma.symptoms = ['wheezing', 'shortness of breath', 'chest tightness']

MERGE (emphysema {name: 'Emphysema'})
SET emphysema:Condition, emphysema.description = 'Condition where alveoli are damaged, reducing gas exchange capacity',
    emphysema.affects = 'alveoli',
    emphysema.type = 'chronic obstructive pulmonary disease'

MERGE (pneumonia {name: 'Pneumonia'})
SET pneumonia:Condition, pneumonia.description = 'Infection causing inflammation of the air sacs in the lungs',
    pneumonia.affects = 'alveoli',
    pneumonia.types = ['bacterial', 'viral', 'fungal']

// Connect conditions to structures
MERGE (bronchi)-[:CAN_HAVE]->(asthma)
MERGE (bronchioles)-[:CAN_HAVE]->(asthma)
MERGE (alveoli)-[:CAN_HAVE]->(emphysema)
MERGE (lungs)-[:CAN_HAVE]->(pneumonia)