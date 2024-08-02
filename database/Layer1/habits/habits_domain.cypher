//HABITS SUBDOMAINS
// Ensure the 'Habits' node exists or is created with description
MERGE (h:L1Domain {name: 'Habits'})

// For each subdomain, ensure it exists with the L1Domain label, add the Habit label if missing, and create relationships with descriptions
// Mental Habits
MERGE (mh:L1Domain {name: 'Mental Habits', description: 'Habits that influence cognitive processes and patterns of thinking'})
ON CREATE SET mh:Habit
ON MATCH SET mh:Habit
MERGE (h)-[:HAS_SUBDOMAIN]->(mh)

// Physical Habits
MERGE (ph:L1Domain {name: 'Physical Habits', description: 'Habits related to physical health and activity'})
ON CREATE SET ph:Habit
ON MATCH SET ph:Habit
MERGE (h)-[:HAS_SUBDOMAIN]->(ph)

// Social Habits
MERGE (sh:L1Domain {name: 'Social Habits', description: 'Habits that affect how we interact with others in social contexts'})
ON CREATE SET sh:Habit
ON MATCH SET sh:Habit
MERGE (h)-[:HAS_SUBDOMAIN]->(sh);