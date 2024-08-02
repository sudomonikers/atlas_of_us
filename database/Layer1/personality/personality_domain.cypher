//PERSONALITY SUBDOMAINS
// Ensure the 'Personality' node exists or is created with the L1Domain label
MERGE (p:L1Domain {name: 'Personality'})

// Ensure subdomain nodes exist or are created, add the PersonalitySubdomain label if missing, and create relationships
// Openness
MERGE (o:L1Domain {name: 'Openness', description: 'Willingness to try new things and be open to new experiences.'})
ON CREATE SET o:Personality
ON MATCH SET o:Personality
MERGE (p)-[:HAS_SUBDOMAIN]->(o)

// Neuroticism
MERGE (ne:L1Domain {name: 'Neuroticism', description: 'Tendency towards emotional instability, anxiety, and moodiness.'})
ON CREATE SET ne:Personality
ON MATCH SET ne:Personality
MERGE (p)-[:HAS_SUBDOMAIN]->(ne)

// Extraversion
MERGE (e:L1Domain {name: 'Extraversion', description: 'Preference for being around other people and engaging in social situations.'})
ON CREATE SET e:Personality
ON MATCH SET e:Personality
MERGE (p)-[:HAS_SUBDOMAIN]->(e)

// Agreeableness
MERGE (a:L1Domain {name: 'Agreeableness', description: 'Tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'})
ON CREATE SET a:Personality
ON MATCH SET a:Personality
MERGE (p)-[:HAS_SUBDOMAIN]->(a)

// Conscientiousness
MERGE (c:L1Domain {name: 'Conscientiousness', description: 'A tendency to show self-discipline, act dutifully, and aim for achievement; planned rather than spontaneous behavior.'})
ON CREATE SET c:Personality
ON MATCH SET c:Personality
MERGE (p)-[:HAS_SUBDOMAIN]->(c);