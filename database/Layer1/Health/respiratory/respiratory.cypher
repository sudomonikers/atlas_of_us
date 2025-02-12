// Main System Node
MERGE (respiratory {name: 'Respiratory System'})
SET respiratory:L1:Health:System,
    respiratory.description = 'System responsible for gas exchange between the body and external environment, primarily oxygen intake and carbon dioxide removal'

// Major Organs and Structures
MERGE (lungs {name: 'Lungs'})
SET lungs:L1:Health:Organ,
    lungs.description = 'Pair of organs responsible for gas exchange, consisting of millions of tiny air sacs called alveoli'

MERGE (upperAirway {name: 'Upper Airway'})
SET upperAirway:L1:Health:Structure,
    upperAirway.description = 'Series of passages in the nose, mouth, and throat that filter, warm, and humidify incoming air'

MERGE (lowerAirway {name: 'Lower Airway'})
SET lowerAirway:L1:Health:Structure,
    lowerAirway.description = 'Airways below the larynx including the trachea, bronchi, and bronchioles'

MERGE (diaphragm {name: 'Diaphragm'})
SET diaphragm:L1:Health:Organ,
    diaphragm.description = 'Primary muscle of respiration that contracts and relaxes to facilitate breathing'

// Connect major structures to system
MERGE (lungs)-[:MAKES_UP]->(respiratory)
MERGE (upperAirway)-[:MAKES_UP]->(respiratory)
MERGE (lowerAirway)-[:MAKES_UP]->(respiratory)
MERGE (diaphragm)-[:MAKES_UP]->(respiratory)

// Upper Airway Components
MERGE (nasalCavity {name: 'Nasal Cavity'})
SET nasalCavity:L1:Health:Structure,
    nasalCavity.description = 'Air passage behind the nose containing structures that filter, warm, and humidify air'

MERGE (pharynx {name: 'Pharynx'})
SET pharynx:L1:Health:Structure,
    pharynx.description = 'Throat region that connects nasal and oral cavities to larynx'

MERGE (larynx {name: 'Larynx'})
SET larynx:L1:Health:Structure,
    larynx.description = 'Voice box containing vocal cords and protecting the entrance to lower airways'

// Connect upper airway components
MERGE (nasalCavity)-[:MAKES_UP]->(upperAirway)
MERGE (pharynx)-[:MAKES_UP]->(upperAirway)
MERGE (larynx)-[:MAKES_UP]->(upperAirway)

// Lower Airway Components
MERGE (trachea {name: 'Trachea'})
SET trachea:L1:Health:Structure,
    trachea.description = 'The main trunk of the respiratory system, extending from the larynx to the bronchi'

MERGE (bronchi {name: 'Bronchi'})
SET bronchi:L1:Health:Structure,
    bronchi.description = 'The two main branches of the trachea that lead into the lungs, providing a passageway for air'

MERGE (bronchioles {name: 'Bronchioles'})
SET bronchioles:L1:Health:Structure,
    bronchioles.description = 'Small branches of the bronchi within the lungs that conduct air to the alveoli'

// Connect lower airway components
MERGE (trachea)-[:MAKES_UP]->(lowerAirway)
MERGE (bronchi)-[:MAKES_UP]->(lowerAirway)
MERGE (bronchioles)-[:MAKES_UP]->(lowerAirway)

// Lung Components
MERGE (alveoli {name: 'Alveoli'})
SET alveoli:L1:Health:Structure,
    alveoli.description = 'Tiny air sacs in the lungs where gas exchange occurs'

MERGE (pleura {name: 'Pleura'})
SET pleura:L1:Health:Structure,
    pleura.description = 'The double-layered membrane surrounding the lungs, protecting and lubricating them during breathing'

// Connect lung components
MERGE (alveoli)-[:MAKES_UP]->(lungs)
MERGE (pleura)-[:MAKES_UP]->(lungs)