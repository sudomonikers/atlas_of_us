// Main System Node
MERGE (nervous {name: 'Nervous System'})
SET nervous:System, nervous.description = 'Master control system of the body responsible for receiving, processing, and responding to information through electrical and chemical signals'

// Major Divisions
MERGE (cns {name: 'Central Nervous System'})
SET cns:Structure:Health, cns.description = 'Primary command center consisting of the brain and spinal cord'

MERGE (pns {name: 'Peripheral Nervous System'})
SET pns:Structure:Health, pns.description = 'Network of nerves that connects the central nervous system to the rest of the body'

// Connect major divisions to system
MERGE (nervous)-[:CONTAINS]->(cns)
MERGE (nervous)-[:CONTAINS]->(pns)

// Brain Components
MERGE (brain {name: 'Brain'})
SET brain:Organ:Health, brain.description = 'Complex organ that serves as the center of the nervous system, controlling thoughts, memory, movement, and bodily functions'

MERGE (cerebrum {name: 'Cerebrum'})
SET cerebrum:Structure:Health, cerebrum.description = 'Largest part of the brain responsible for higher-order thinking, learning, memory, and conscious movement'

MERGE (cerebellum {name: 'Cerebellum'})
SET cerebellum:Structure:Health, cerebellum.description = 'Region responsible for coordination, balance, and fine motor control'

MERGE (brainstem {name: 'Brainstem'})
SET brainstem:Structure:Health, brainstem.description = 'Connects brain to spinal cord and controls automatic functions like breathing and heart rate'

MERGE (hypothalamus {name: 'Hypothalamus'})
SET hypothalamus:Structure:Health, hypothalamus.description = 'Region controlling homeostasis, hormone production, and basic functions like hunger and temperature'

// Connect brain components
MERGE (cns)-[:CONTAINS]->(brain)
MERGE (brain)-[:CONTAINS]->(cerebrum)
MERGE (brain)-[:CONTAINS]->(cerebellum)
MERGE (brain)-[:CONTAINS]->(brainstem)
MERGE (brain)-[:CONTAINS]->(hypothalamus)

// Spinal Cord Components
MERGE (spinalCord {name: 'Spinal Cord'})
SET spinalCord:Organ:Health, spinalCord.description = 'Bundle of nerve tissue that extends from the brain and carries messages between brain and body'

MERGE (greyMatter {name: 'Grey Matter'})
SET greyMatter:Tissue:Health, greyMatter.description = 'Neural tissue containing nerve cell bodies, responsible for processing information'

MERGE (whiteMatter {name: 'White Matter'})
SET whiteMatter:Tissue:Health, whiteMatter.description = 'Neural tissue containing myelinated nerve fibers that transmit signals'

// Connect spinal components
MERGE (cns)-[:CONTAINS]->(spinalCord)
MERGE (spinalCord)-[:CONTAINS]->(greyMatter)
MERGE (spinalCord)-[:CONTAINS]->(whiteMatter)

// Peripheral Components
MERGE (somaticNS {name: 'Somatic Nervous System'})
SET somaticNS:Structure:Health, somaticNS.description = 'Part of PNS controlling voluntary movement and receiving sensory information'

MERGE (autonomicNS {name: 'Autonomic Nervous System'})
SET autonomicNS:Structure:Health, autonomicNS.description = 'Part of PNS controlling involuntary functions and internal organs'

MERGE (nerves {name: 'Nerves'})
SET nerves:Structure:Health, nerves.description = 'Bundles of axons that transmit signals between CNS and body'

// Connect peripheral components
MERGE (pns)-[:CONTAINS]->(somaticNS)
MERGE (pns)-[:CONTAINS]->(autonomicNS)
MERGE (pns)-[:CONTAINS]->(nerves)

// Cellular Components
MERGE (neurons {name: 'Neurons'})
SET neurons:Component:Health, neurons.description = 'Specialized cells that transmit electrical and chemical signals'

MERGE (glia {name: 'Glial Cells'})
SET glia:Component:Health, glia.description = 'Support cells that maintain neural function and provide protection'

MERGE (myelin {name: 'Myelin Sheath'})
SET myelin:Component:Health, myelin.description = 'Insulating layer around nerve fibers that speeds signal transmission'

// Connect cellular components
MERGE (nervous)-[:CONTAINS]->(neurons)
MERGE (nervous)-[:CONTAINS]->(glia)
MERGE (nervous)-[:CONTAINS]->(myelin)

// Example Conditions/Variations
MERGE (ms {name: 'Multiple Sclerosis'})
SET ms:Condition:Health, ms.description = 'Autoimmune condition affecting myelin in the central nervous system',
    ms.affects = 'CNS',
    ms.symptoms = ['vision problems', 'muscle weakness', 'coordination difficulties']

MERGE (epilepsy {name: 'Epilepsy'})
SET epilepsy:Condition:Health, epilepsy.description = 'Neurological disorder characterized by recurrent seizures',
    epilepsy.affects = 'brain',
    epilepsy.types = ['focal', 'generalized']

MERGE (parkinsons {name: 'Parkinson\'s Disease'})
SET parkinsons:Condition:Health, parkinsons.description = 'Progressive nervous system disorder affecting movement',
    parkinsons.affects = 'brain',
    parkinsons.symptoms = ['tremor', 'stiffness', 'balance problems']

// Connect conditions to structures
MERGE (cns)-[:CAN_HAVE]->(ms)
MERGE (brain)-[:CAN_HAVE]->(epilepsy)
MERGE (brain)-[:CAN_HAVE]->(parkinsons)

// Create measurable properties
MERGE (brainWaves {name: 'Brain Waves'})
SET brainWaves:Measurement:Health, brainWaves.description = 'Electrical activity patterns in the brain',
    brainWaves.units = 'Hz',
    brainWaves.types = ['alpha', 'beta', 'theta', 'delta']

MERGE (nerveConduction {name: 'Nerve Conduction'})
SET nerveConduction:Measurement:Health, nerveConduction.description = 'Speed of electrical impulse transmission through nerves',
    nerveConduction.units = 'm/s',
    nerveConduction.normalRange = '50-60'

// Connect measurements
MERGE (brain)-[:HAS_MEASUREMENT]->(brainWaves)
MERGE (nerves)-[:HAS_MEASUREMENT]->(nerveConduction)