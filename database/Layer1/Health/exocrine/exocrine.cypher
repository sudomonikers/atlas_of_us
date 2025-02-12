// Main System Node
MATCH (exocrine {name: 'Exocrine System'})

// Major Gland Categories
MERGE (sweatGlands {name: 'Sweat Glands'})
SET sweatGlands:L1:Health:Organ,
    sweatGlands.description = 'Glands in skin that produce and secrete sweat for temperature regulation and waste removal'

MERGE (salivaryGlands {name: 'Salivary Glands'})
SET salivaryGlands:L1:Health:Organ,
    salivaryGlands.description = 'Glands that produce and secrete saliva for digestion and oral health'

MERGE (mammaryGlands {name: 'Mammary Glands'})
SET mammaryGlands:L1:Health:Organ,
    mammaryGlands.description = 'Specialized glands that produce and secrete milk'

MERGE (digestiveGlands {name: 'Digestive Glands'})
SET digestiveGlands:L1:Health:Organ,
    digestiveGlands.description = 'Glands that secrete substances for digestion'

MERGE (mucousGlands {name: 'Mucous Glands'})
SET mucousGlands:L1:Health:Organ,
    mucousGlands.description = 'Glands that produce and secrete mucus throughout various body systems'

MERGE (sebaceousGlands {name: 'Sebaceous Glands'})
SET sebaceousGlands:L1:Health:Organ,
    sebaceousGlands.description = 'Glands that produce and secrete sebum to lubricate and protect skin and hair'

// Connect major glands to system
MERGE (sweatGlands)-[:MAKES_UP]->(exocrine)
MERGE (salivaryGlands)-[:MAKES_UP]->(exocrine)
MERGE (mammaryGlands)-[:MAKES_UP]->(exocrine)
MERGE (digestiveGlands)-[:MAKES_UP]->(exocrine)
MERGE (mucousGlands)-[:MAKES_UP]->(exocrine)
MERGE (sebaceousGlands)-[:MAKES_UP]->(exocrine)

// Specific Gland Types
MERGE (eccrineGlands {name: 'Eccrine Sweat Glands'})
SET eccrineGlands:L1:Health:Structure,
    eccrineGlands.description = 'Primary sweat glands distributed throughout the body'

MERGE (apocrineGlands {name: 'Apocrine Sweat Glands'})
SET apocrineGlands:L1:Health:Structure,
    apocrineGlands.description = 'Specialized sweat glands in armpits and groin areas'

MERGE (parotidGlands {name: 'Parotid Glands'})
SET parotidGlands:L1:Health:Structure,
    parotidGlands.description = 'Largest salivary glands located in front of ears'

MERGE (submandibularGlands {name: 'Submandibular Glands'})
SET submandibularGlands:L1:Health:Structure,
    submandibularGlands.description = 'Salivary glands located beneath the floor of mouth'

MERGE (sublingualGlands {name: 'Sublingual Glands'})
SET sublingualGlands:L1:Health:Structure,
    sublingualGlands.description = 'Smallest of the major salivary glands located under the tongue'

// Connect specific glands to major glands
MERGE (eccrineGlands)-[:MAKES_UP]->(sweatGlands)
MERGE (apocrineGlands)-[:MAKES_UP]->(sweatGlands)
MERGE (parotidGlands)-[:MAKES_UP]->(salivaryGlands)
MERGE (submandibularGlands)-[:MAKES_UP]->(salivaryGlands)
MERGE (sublingualGlands)-[:MAKES_UP]->(salivaryGlands)

// Secretory Components
MERGE (saliva {name: 'Saliva'})
SET saliva:L1:Health:Component,
    saliva.description = 'Fluid containing enzymes and lubricants for digestion and oral health'

MERGE (sweat {name: 'Sweat'})
SET sweat:L1:Health:Component,
    sweat.description = 'Watery fluid containing salts and waste products'

MERGE (sebum {name: 'Sebum'})
SET sebum:L1:Health:Component,
    sebum.description = 'Oily substance that lubricates and waterproofs skin and hair'

MERGE (mucus {name: 'Mucus'})
SET mucus:L1:Health:Component,
    mucus.description = 'Sticky fluid that traps particles and moistens surfaces'

MERGE (milk {name: 'Breast Milk'})
SET milk:L1:Health:Component,
    milk.description = 'Nutrient-rich fluid produced by mammary glands'

// Connect components to glands
MERGE (saliva)-[:MAKES_UP]->(salivaryGlands)
MERGE (sweat)-[:MAKES_UP]->(sweatGlands)
MERGE (sebum)-[:MAKES_UP]->(sebaceousGlands)
MERGE (mucus)-[:MAKES_UP]->(mucousGlands)
MERGE (milk)-[:MAKES_UP]->(mammaryGlands)

// Tissues
MERGE (secretoryEpithelium {name: 'Secretory Epithelium'})
SET secretoryEpithelium:L1:Health:Tissue,
    secretoryEpithelium.description = 'Specialized tissue that produces secretions'

MERGE (ductTissue {name: 'Duct Tissue'})
SET ductTissue:L1:Health:Tissue,
    ductTissue.description = 'Tissue forming channels for secretion transport'

MERGE (myoepithelialTissue {name: 'Myoepithelial Tissue'})
SET myoepithelialTissue:L1:Health:Tissue,
    myoepithelialTissue.description = 'Contractile tissue that helps expel secretions'

// Connect tissues to glands
MERGE (secretoryEpithelium)-[:MAKES_UP]->(salivaryGlands)
MERGE (ductTissue)-[:MAKES_UP]->(salivaryGlands)
MERGE (myoepithelialTissue)-[:MAKES_UP]->(salivaryGlands)