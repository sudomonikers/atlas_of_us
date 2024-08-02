//BODY SUBDOMAINS
// Ensure the 'Body' node exists or is created with the L1Domain label and description
MERGE (b:L1Domain {name: 'Body'})

// Ensure subdomain nodes exist or are created, add the BodySubdomain label if missing, and create relationships with descriptions
// Genetics
MERGE (g:L1Domain {name: 'Genetics', description: 'Biological inheritance and variations of organisms'})
ON CREATE SET g:BodySubdomain
ON MATCH SET g:BodySubdomain
MERGE (b)-[:HAS_SUBDOMAIN]->(g)

// Physical Abilities
MERGE (pa:L1Domain {name: 'Physical Abilities', description: 'The capacity to perform physical tasks and activities'})
ON CREATE SET pa:BodySubdomain
ON MATCH SET pa:BodySubdomain
MERGE (b)-[:HAS_SUBDOMAIN]->(pa)

// Physical Habits
MERGE (ph:L1Domain {name: 'Physical Habits', description: 'Habits related to physical health and activity'})
ON CREATE SET ph:BodySubdomain
ON MATCH SET ph:BodySubdomain
MERGE (b)-[:HAS_SUBDOMAIN]->(ph)

// Attributes
MERGE (a:L1Domain {name: 'Attributes', description: 'Physical characteristics or qualities of a person'})
ON CREATE SET a:BodySubdomain
ON MATCH SET a:BodySubdomain
MERGE (b)-[:HAS_SUBDOMAIN]->(a)

// Health
MERGE (h:L1Domain {name: 'Health', description: 'The state of being free from illness or injury'})
ON CREATE SET h:BodySubdomain
ON MATCH SET h:BodySubdomain
MERGE (b)-[:HAS_SUBDOMAIN]->(h);