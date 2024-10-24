// Ensure the 'Mind' node exists or is created with the L1Domain label and description
MERGE (m:L1Domain {name: 'Mind'})
SET m:Mind

// Mental Abilities
MERGE (ma:L1Domain {name: 'Mental Abilities'})
SET ma:Mind, ma.description = 'Cognitive capacities to perform mental processes'
MERGE (m)-[:HAS_SUBDOMAIN]->(ma)

// Mental Habits
MERGE (mh:L1Domain {name: 'Mental Habits'})
SET mh:Mind, mh.description = 'Habits that influence cognitive processes and patterns of thinking'
MERGE (m)-[:HAS_SUBDOMAIN]->(mh)

// Knowledge
MERGE (k:L1Domain {name: 'Knowledge'})
SET k:Mind, k.description = 'Facts and information acquired through experience or education'
MERGE (m)-[:HAS_SUBDOMAIN]->(k)

// Beliefs
MERGE (b:L1Domain {name: 'Beliefs'})
SET b:Mind, b.description = 'Acceptance that something exists or is true, especially one without proof'
MERGE (m)-[:HAS_SUBDOMAIN]->(b)
