// Main System Node
MERGE (exocrine {name: 'Exocrine System'})
SET exocrine:System,
    exocrine.description = 'System of glands that secrete substances through ducts to specific target locations'

// Major Gland Categories
MERGE (sweatGlands {name: 'Sweat Glands'})
SET sweatGlands:Organ:Health,
    sweatGlands.description = 'Glands in skin that produce and secrete sweat for temperature regulation and waste removal'

MERGE (salivaryGlands {name: 'Salivary Glands'})
SET salivaryGlands:Organ:Health,
    salivaryGlands.description = 'Glands that produce and secrete saliva for digestion and oral health'

MERGE (mammaryGlands {name: 'Mammary Glands'})
SET mammaryGlands:Organ:Health,
    mammaryGlands.description = 'Specialized glands that produce and secrete milk'

MERGE (digestiveGlands {name: 'Digestive Glands'})
SET digestiveGlands:Organ:Health,
    digestiveGlands.description = 'Glands that secrete substances for digestion'

MERGE (mucousGlands {name: 'Mucous Glands'})
SET mucousGlands:Organ:Health,
    mucousGlands.description = 'Glands that produce and secrete mucus throughout various body systems'

MERGE (sebaceousGlands {name: 'Sebaceous Glands'})
SET sebaceousGlands:Organ:Health,
    sebaceousGlands.description = 'Glands that produce and secrete sebum to lubricate and protect skin and hair'

// Specific Gland Types
MERGE (eccrineGlands {name: 'Eccrine Sweat Glands'})
SET eccrineGlands:Structure:Health,
    eccrineGlands.description = 'Primary sweat glands distributed throughout the body'

MERGE (apocrineGlands {name: 'Apocrine Sweat Glands'})
SET apocrineGlands:Structure:Health,
    apocrineGlands.description = 'Specialized sweat glands in armpits and groin areas'

MERGE (parotidGlands {name: 'Parotid Glands'})
SET parotidGlands:Structure:Health,
    parotidGlands.description = 'Largest salivary glands located in front of ears'

MERGE (submandibularGlands {name: 'Submandibular Glands'})
SET submandibularGlands:Structure:Health,
    submandibularGlands.description = 'Salivary glands located beneath the floor of mouth'

MERGE (sublingualGlands {name: 'Sublingual Glands'})
SET sublingualGlands:Structure:Health,
    sublingualGlands.description = 'Smallest of the major salivary glands located under the tongue'

// Secretory Components
MERGE (saliva {name: 'Saliva'})
SET saliva:Component:Health,
    saliva.description = 'Fluid containing enzymes and lubricants for digestion and oral health'

MERGE (sweat {name: 'Sweat'})
SET sweat:Component:Health,
    sweat.description = 'Watery fluid containing salts and waste products'

MERGE (sebum {name: 'Sebum'})
SET sebum:Component:Health,
    sebum.description = 'Oily substance that lubricates and waterproofs skin and hair'

MERGE (mucus {name: 'Mucus'})
SET mucus:Component:Health,
    mucus.description = 'Sticky fluid that traps particles and moistens surfaces'

MERGE (milk {name: 'Breast Milk'})
SET milk:Component:Health,
    milk.description = 'Nutrient-rich fluid produced by mammary glands'

// Tissues
MERGE (secretoryEpithelium {name: 'Secretory Epithelium'})
SET secretoryEpithelium:Tissue:Health,
    secretoryEpithelium.description = 'Specialized tissue that produces secretions'

MERGE (ductTissue {name: 'Duct Tissue'})
SET ductTissue:Tissue:Health,
    ductTissue.description = 'Tissue forming channels for secretion transport'

MERGE (myoepithelialTissue {name: 'Myoepithelial Tissue'})
SET myoepithelialTissue:Tissue:Health,
    myoepithelialTissue.description = 'Contractile tissue that helps expel secretions'

// Connect structures to organs
MERGE (exocrine)-[:CONTAINS]->(sweatGlands)
MERGE (exocrine)-[:CONTAINS]->(salivaryGlands)
MERGE (exocrine)-[:CONTAINS]->(mammaryGlands)
MERGE (exocrine)-[:CONTAINS]->(digestiveGlands)
MERGE (exocrine)-[:CONTAINS]->(mucousGlands)
MERGE (exocrine)-[:CONTAINS]->(sebaceousGlands)

MERGE (sweatGlands)-[:CONTAINS]->(eccrineGlands)
MERGE (sweatGlands)-[:CONTAINS]->(apocrineGlands)
MERGE (salivaryGlands)-[:CONTAINS]->(parotidGlands)
MERGE (salivaryGlands)-[:CONTAINS]->(submandibularGlands)
MERGE (salivaryGlands)-[:CONTAINS]->(sublingualGlands)

// Connect secretions to glands
MERGE (salivaryGlands)-[:PRODUCES]->(saliva)
MERGE (sweatGlands)-[:PRODUCES]->(sweat)
MERGE (sebaceousGlands)-[:PRODUCES]->(sebum)
MERGE (mucousGlands)-[:PRODUCES]->(mucus)
MERGE (mammaryGlands)-[:PRODUCES]->(milk)

// Connect tissues to glands
MERGE (salivaryGlands)-[:CONTAINS]->(secretoryEpithelium)
MERGE (salivaryGlands)-[:CONTAINS]->(ductTissue)
MERGE (salivaryGlands)-[:CONTAINS]->(myoepithelialTissue)

// Sample Conditions
MERGE (hyperhidrosis {name: 'Hyperhidrosis'})
SET hyperhidrosis:Condition:Health,
    hyperhidrosis.description = 'Excessive sweating beyond normal thermoregulatory needs'

MERGE (xerostomia {name: 'Xerostomia'})
SET xerostomia:Condition:Health,
    xerostomia.description = 'Abnormal dryness of the mouth due to reduced saliva production'

MERGE (acne {name: 'Acne'})
SET acne:Condition:Health,
    acne.description = 'Skin condition involving blocked sebaceous glands'

// Connect conditions
MERGE (sweatGlands)-[:CAN_HAVE]->(hyperhidrosis)
MERGE (salivaryGlands)-[:CAN_HAVE]->(xerostomia)
MERGE (sebaceousGlands)-[:CAN_HAVE]->(acne)

// Measurements
MERGE (secretionRate {name: 'Secretion Rate'})
SET secretionRate:Measurement,
    secretionRate.description = 'Volume of secretion produced per unit time',
    secretionRate.units = 'mL/min'

MERGE (secretionPH {name: 'Secretion pH'})
SET secretionPH:Measurement,
    secretionPH.description = 'Acid-base balance of secretions',
    secretionPH.units = 'pH'

// Connect measurements
MERGE (exocrine)-[:HAS_MEASUREMENT]->(secretionRate)
MERGE (exocrine)-[:HAS_MEASUREMENT]->(secretionPH)