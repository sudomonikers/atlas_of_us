//PURSUITS SUBDOMAINS
// Ensure the 'Pursuits' node exists or is created with the L1Domain label and description
MERGE (p:L1Domain {name: 'Pursuits'})

// Ensure subdomain nodes exist or are created, add the Pursuit label if missing, and create relationships with descriptions
// Hobbies
MERGE (h:L1Domain {name: 'Hobbies', description: 'Leisure activities engaged in for pleasure'})
ON CREATE SET h:Pursuit
ON MATCH SET h:Pursuit
MERGE (p)-[:HAS_SUBDOMAIN]->(h)

// Education
MERGE (e:L1Domain {name: 'Education', description: 'Formal process of acquiring knowledge and skills'})
ON CREATE SET e:Pursuit
ON MATCH SET e:Pursuit
MERGE (p)-[:HAS_SUBDOMAIN]->(e)

// Lifestyle
MERGE (l:L1Domain {name: 'Lifestyle', description: 'The way in which a person or group lives'})
ON CREATE SET l:Pursuit
ON MATCH SET l:Pursuit
MERGE (p)-[:HAS_SUBDOMAIN]->(l)

// Jobs
MERGE (j:L1Domain {name: 'Jobs', description: 'Paid positions of regular employment'})
ON CREATE SET j:Pursuit
ON MATCH SET j:Pursuit
MERGE (p)-[:HAS_SUBDOMAIN]->(j);