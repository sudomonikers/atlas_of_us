// Main System Node
MATCH (nervous {name: 'Nervous System'})

// Major Divisions
MERGE (cns {name: 'Central Nervous System'})
SET cns:L1:Structure:Health,
    cns.description = 'Primary command center consisting of the brain and spinal cord'

MERGE (pns {name: 'Peripheral Nervous System'})
SET pns:L1:Structure:Health,
    pns.description = 'Network of nerves that connects the central nervous system to the rest of the body'

// Connect major divisions to system
MERGE (cns)-[:MAKES_UP]->(nervous)
MERGE (pns)-[:MAKES_UP]->(nervous)

// Brain Components
MERGE (brain {name: 'Brain'})
SET brain:L1:Organ:Health,
    brain.description = 'Complex organ that serves as the center of the nervous system, controlling thoughts, memory, movement, and bodily functions'

MERGE (cerebrum {name: 'Cerebrum'})
SET cerebrum:L1:Structure:Health,
    cerebrum.description = 'Largest part of the brain responsible for higher-order thinking, learning, memory, and conscious movement'

MERGE (cerebellum {name: 'Cerebellum'})
SET cerebellum:L1:Structure:Health,
    cerebellum.description = 'Region responsible for coordination, balance, and fine motor control'

MERGE (brainstem {name: 'Brainstem'})
SET brainstem:L1:Structure:Health,
    brainstem.description = 'Connects brain to spinal cord and controls automatic functions like breathing and heart rate'

MERGE (hypothalamus {name: 'Hypothalamus'})
SET hypothalamus:L1:Structure:Health,
    hypothalamus.description = 'Region controlling homeostasis, hormone production, and basic functions like hunger and temperature'

// Connect brain components
MERGE (brain)-[:MAKES_UP]->(cns)
MERGE (cerebrum)-[:MAKES_UP]->(brain)
MERGE (cerebellum)-[:MAKES_UP]->(brain)
MERGE (brainstem)-[:MAKES_UP]->(brain)
MERGE (hypothalamus)-[:MAKES_UP]->(brain)

// Spinal Cord Components
MERGE (spinalCord {name: 'Spinal Cord'})
SET spinalCord:L1:Organ:Health,
    spinalCord.description = 'Bundle of nerve tissue that extends from the brain and carries messages between brain and body'

MERGE (greyMatter {name: 'Grey Matter'})
SET greyMatter:L1:Tissue:Health,
    greyMatter.description = 'Neural tissue containing nerve cell bodies, responsible for processing information'

MERGE (whiteMatter {name: 'White Matter'})
SET whiteMatter:L1:Tissue:Health,
    whiteMatter.description = 'Neural tissue containing myelinated nerve fibers that transmit signals'

// Connect spinal components
MERGE (spinalCord)-[:MAKES_UP]->(cns)
MERGE (greyMatter)-[:MAKES_UP]->(spinalCord)
MERGE (whiteMatter)-[:MAKES_UP]->(spinalCord)

// Peripheral Components
MERGE (somaticNS {name: 'Somatic Nervous System'})
SET somaticNS:L1:Structure:Health,
    somaticNS.description = 'Part of PNS controlling voluntary movement and receiving sensory information'

MERGE (autonomicNS {name: 'Autonomic Nervous System'})
SET autonomicNS:L1:Structure:Health,
    autonomicNS.description = 'Part of PNS controlling involuntary functions and internal organs'

MERGE (nerves {name: 'Nerves'})
SET nerves:L1:Structure:Health,
    nerves.description = 'Bundles of axons that transmit signals between CNS and body'

// Connect peripheral components
MERGE (somaticNS)-[:MAKES_UP]->(pns)
MERGE (autonomicNS)-[:MAKES_UP]->(pns)
MERGE (nerves)-[:MAKES_UP]->(pns)

// Cellular Components
MERGE (neurons {name: 'Neurons'})
SET neurons:L1:Component:Health,
    neurons.description = 'Specialized cells that transmit electrical and chemical signals'

MERGE (glia {name: 'Glial Cells'})
SET glia:L1:Component:Health,
    glia.description = 'Support cells that maintain neural function and provide protection'

MERGE (myelin {name: 'Myelin Sheath'})
SET myelin:L1:Component:Health,
    myelin.description = 'Insulating layer around nerve fibers that speeds signal transmission'

// Connect cellular components
MERGE (neurons)-[:MAKES_UP]->(nervous)
MERGE (glia)-[:MAKES_UP]->(nervous)
MERGE (myelin)-[:MAKES_UP]->(nervous)