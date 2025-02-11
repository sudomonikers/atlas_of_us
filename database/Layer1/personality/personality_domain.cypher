MATCH (p:CoreDomain {name: 'Personality'})

MERGE (o {name: 'Openness'})
SET o:Personality:L1,
    o.description = 'Willingness to try new things and be open to new experiences.'
MERGE (o)-[:IS_SUB_TYPE]->(p)

MERGE (ne {name: 'Neuroticism'})
SET ne:Personality:L1,
    ne.description = 'Tendency towards emotional instability, anxiety, and moodiness.'
MERGE (ne)-[:IS_SUB_TYPE]->(p)

MERGE (e {name: 'Extraversion'})
SET e:Personality:L1,
    e.description = 'Preference for being around other people and engaging in social situations.'
MERGE (e)-[:IS_SUB_TYPE]->(p)

MERGE (a {name: 'Agreeableness'})
SET a:Personality:L1,
    a.description = 'Tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'
MERGE (a)-[:IS_SUB_TYPE]->(p)

MERGE (c {name: 'Conscientiousness'})
SET c:Personality:L1,
    c.description = 'A tendency to show self-discipline, act dutifully, and aim for achievement; planned rather than spontaneous behavior.'
MERGE (c)-[:IS_SUB_TYPE]->(p)