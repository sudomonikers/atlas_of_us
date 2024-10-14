// Ensure the 'Body' node exists or is created with the L1Domain label and description
MERGE (b:L1Domain {name: 'Body'})

// Genetics
MERGE (g:L1Domain {name: 'Genetics'})
SET g:BodySubdomain, g.description = 'Biological inheritance and variations of organisms'
MERGE (b)-[:HAS_SUBDOMAIN]->(g)

// Physical Abilities
MERGE (pa:L1Domain {name: 'Physical Abilities'})
SET pa:BodySubdomain, pa.description = 'The capacity to perform physical tasks and activities'
MERGE (b)-[:HAS_SUBDOMAIN]->(pa)

// Physical Habits
MERGE (ph:L1Domain {name: 'Physical Habits'})
SET ph:BodySubdomain, ph.description = 'Habits related to physical health and activity'
MERGE (b)-[:HAS_SUBDOMAIN]->(ph)

// Attributes
MERGE (a:L1Domain {name: 'Attributes'})
SET a:BodySubdomain, a.description = 'Physical characteristics or qualities of a person'
MERGE (b)-[:HAS_SUBDOMAIN]->(a)

// Health
MERGE (h:L1Domain {name: 'Health'})
SET h:BodySubdomain, h.description = 'The state of being free from illness or injury'
MERGE (b)-[:HAS_SUBDOMAIN]->(h)
