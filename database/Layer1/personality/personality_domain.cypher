// PERSONALITY SUBDOMAINS
MERGE (p:CoreDomain {name: 'Personality'})
SET p:Personality

// Openness
MERGE (o:Domain {name: 'Openness'})
SET o:Personality, o.description = 'Willingness to try new things and be open to new experiences.'
MERGE (p)-[:HAS_SUBDOMAIN]->(o)

// Neuroticism
MERGE (ne:Domain {name: 'Neuroticism'})
SET ne:Personality, ne.description = 'Tendency towards emotional instability, anxiety, and moodiness.'
MERGE (p)-[:HAS_SUBDOMAIN]->(ne)

// Extraversion
MERGE (e:Domain {name: 'Extraversion'})
SET e:Personality, e.description = 'Preference for being around other people and engaging in social situations.'
MERGE (p)-[:HAS_SUBDOMAIN]->(e)

// Agreeableness
MERGE (a:Domain {name: 'Agreeableness'})
SET a:Personality, a.description = 'Tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'
MERGE (p)-[:HAS_SUBDOMAIN]->(a)

// Conscientiousness
MERGE (c:Domain {name: 'Conscientiousness'})
SET c:Personality, c.description = 'A tendency to show self-discipline, act dutifully, and aim for achievement; planned rather than spontaneous behavior.'
MERGE (p)-[:HAS_SUBDOMAIN]->(c)
