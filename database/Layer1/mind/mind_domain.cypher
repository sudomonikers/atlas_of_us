//MIND SUBDOMAINS
// Ensure the 'Mind' node exists or is created with the L1Domain label and description
MERGE (m:L1Domain {name: 'Mind'})

// Ensure subdomain nodes exist or are created, add the MindSubdomain label if missing, and create relationships with descriptions
// Mental Abilities
MERGE (ma:L1Domain {name: 'Mental Abilities', description: 'Cognitive capacities to perform mental processes'})
ON CREATE SET ma:MindSubdomain
ON MATCH SET ma:MindSubdomain
MERGE (m)-[:HAS_SUBDOMAIN]->(ma)

// Mental Habits
MERGE (mh:L1Domain {name: 'Mental Habits', description: 'Habits that influence cognitive processes and patterns of thinking'})
ON CREATE SET mh:MindSubdomain
ON MATCH SET mh:MindSubdomain
MERGE (m)-[:HAS_SUBDOMAIN]->(mh)

// Knowledge
MERGE (k:L1Domain {name: 'Knowledge', description: 'Facts and information acquired through experience or education'})
ON CREATE SET k:MindSubdomain
ON MATCH SET k:MindSubdomain
MERGE (m)-[:HAS_SUBDOMAIN]->(k)

// Beliefs
MERGE (b:L1Domain {name: 'Beliefs', description: 'Acceptance that something exists or is true, especially one without proof'})
ON CREATE SET b:MindSubdomain
ON MATCH SET b:MindSubdomain
MERGE (m)-[:HAS_SUBDOMAIN]->(b);