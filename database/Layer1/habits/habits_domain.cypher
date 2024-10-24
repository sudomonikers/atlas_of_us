// Ensure the 'Habits' node exists or is created with description
MERGE (h:L1Domain {name: 'Habits'})
SET h:Habits

// Mental Habits
MERGE (mh:L1Domain {name: 'Mental Habits'})
SET mh:Habits, mh.description = 'Habits that influence cognitive processes and patterns of thinking'
MERGE (h)-[:HAS_SUBDOMAIN]->(mh)

// Physical Habits
MERGE (ph:L1Domain {name: 'Physical Habits'})
SET ph:Habits, ph.description = 'Habits related to physical health and activity'
MERGE (h)-[:HAS_SUBDOMAIN]->(ph)

// Social Habits
MERGE (sh:L1Domain {name: 'Social Habits'})
SET sh:Habits, sh.description = 'Habits that affect how we interact with others in social contexts'
MERGE (h)-[:HAS_SUBDOMAIN]->(sh)
