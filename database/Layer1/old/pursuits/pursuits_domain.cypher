// PURSUITS SUBDOMAINS
// Ensure the 'Pursuits' node exists or is created with the L1Domain label and description
MERGE (p:L1Domain {name: 'Pursuits'})
SET p:Pursuit

// Ensure subdomain nodes exist or are created, add the Pursuit label if missing, and create relationships with descriptions
// Hobbies
MERGE (h:L1Domain {name: 'Hobbies'})
SET h:Pursuit, h.description = 'Leisure activities engaged in for pleasure'
MERGE (p)-[:HAS_SUBDOMAIN]->(h)

// Education
MERGE (e:L1Domain {name: 'Education'})
SET e:Pursuit, e.description = 'Formal process of acquiring knowledge and skills'
MERGE (p)-[:HAS_SUBDOMAIN]->(e)

// Lifestyle
MERGE (l:L1Domain {name: 'Lifestyle'})
SET l:Pursuit, l.description = 'The way in which a person or group lives'
MERGE (p)-[:HAS_SUBDOMAIN]->(l)

// Jobs
MERGE (j:L1Domain {name: 'Jobs'})
SET j:Pursuit, j.description = 'Paid positions of regular employment'
MERGE (p)-[:HAS_SUBDOMAIN]->(j)
