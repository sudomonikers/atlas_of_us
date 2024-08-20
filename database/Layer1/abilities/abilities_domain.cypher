//ABILITIES SUBDOMAINS
// Ensure the 'Abilities' node exists or is created with the L1Domain label and description
MERGE (a:L1Domain {name: 'Abilities'})

// For each subdomain, ensure it exists with the L1Domain label, add the Ability label if missing, and create relationships with descriptions
// Mental Abilities
MERGE (ma:L1Domain:Ability {name: 'Mental Abilities', description: 'Cognitive capacities to perform mental processes'})
ON CREATE SET ma:Ability
ON MATCH SET ma:Ability
MERGE (a)-[:HAS_SUBDOMAIN]->(ma)

// Physical Abilities
MERGE (pa:L1Domain:Ability {name: 'Physical Abilities', description: 'The capacity to perform physical tasks and activities'})
ON CREATE SET pa:Ability
ON MATCH SET pa:Ability
MERGE (a)-[:HAS_SUBDOMAIN]->(pa)

// Social Abilities
MERGE (sa:L1Domain:Ability {name: 'Social Abilities', description: 'Skills in interacting and communicating with others effectively'})
ON CREATE SET sa:Ability
ON MATCH SET sa:Ability
MERGE (a)-[:HAS_SUBDOMAIN]->(sa);

// Emotional Abilities
MERGE (ea:L1Domain:Ability {name: 'Emotional Abilities', description: 'The capacity to understand, use, and manage emotions in positive ways'})
ON CREATE SET ea:Ability
ON MATCH SET ea:Ability
MERGE (a)-[:HAS_SUBDOMAIN]->(ea);