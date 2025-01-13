// Ensure the 'Abilities' node exists or is created with the L1Domain label and description
MERGE (a:L1Domain {name: 'Abilities'})
SET a:Ability

// Mental Abilities
MERGE (ma:L1Domain {name: 'Mental Abilities'})
SET ma:Ability, ma.description = 'Cognitive capacities to perform mental processes'
MERGE (a)-[:HAS_SUBDOMAIN]->(ma)

// Physical Abilities
MERGE (pa:L1Domain {name: 'Physical Abilities'})
SET pa:Ability, pa.description = 'The capacity to perform physical tasks and activities'
MERGE (a)-[:HAS_SUBDOMAIN]->(pa)

// Social Abilities
MERGE (sa:L1Domain {name: 'Social Abilities'})
SET sa:Ability, sa.description = 'Skills in interacting and communicating with others effectively'
MERGE (a)-[:HAS_SUBDOMAIN]->(sa)

// Emotional Abilities
MERGE (ea:L1Domain {name: 'Emotional Abilities'})
SET ea:Ability, ea.description = 'The capacity to understand, use, and manage emotions in positive ways'
MERGE (a)-[:HAS_SUBDOMAIN]->(ea)
