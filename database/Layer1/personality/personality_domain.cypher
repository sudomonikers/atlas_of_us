MATCH (p:CoreDomain {name: 'Personality'})

MERGE (o:Personality:L1 {name: 'Openness', description: 'Willingness to try new things and be open to new experiences.'})-[:IS_SUB_TYPE]->(p)
MERGE (ne:Personality:L1 {name: 'Neuroticism', description: 'Tendency towards emotional instability, anxiety, and moodiness.'})-[:IS_SUB_TYPE]->(p)
MERGE (e:Personality:L1 {name: 'Extraversion', description: 'Preference for being around other people and engaging in social situations.'})-[:IS_SUB_TYPE]->(p)
MERGE (a:Personality:L1 {name: 'Agreeableness', description: 'Tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'})-[:IS_SUB_TYPE]->(p)
MERGE (c:Personality:L1 {name: 'Conscientiousness', description: 'A tendency to show self-discipline, act dutifully, and aim for achievement; planned rather than spontaneous behavior.'})-[:IS_SUB_TYPE]->(p)

