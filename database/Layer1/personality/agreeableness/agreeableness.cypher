MATCH (a:Personality {name: 'Agreeableness'})

MERGE (attr1:Personality:L1 {name: 'Trust', description: 'Belief in the reliability, truth, ability, or strength of others.'})-[:IS_TRAIT]-(a)
MERGE (attr2:Personality:L1 {name: 'Morality', description: 'The differentiation of intentions, decisions, and actions between those that are distinguished as proper and those that are improper.'})-[:IS_TRAIT]-(a)
MERGE (attr3:Personality:L1 {name: 'Altruism', description: 'The belief in or practice of disinterested and selfless concern for the well-being of others.'})-[:IS_TRAIT]-(a)
MERGE (attr4:Personality:L1 {name: 'Cooperation', description: 'The process of working together to the same end.'})-[:IS_TRAIT]-(a)
MERGE (attr5:Personality:L1 {name: 'Modesty', description: 'The quality of being modest; freedom from vanity, boastfulness, etc.'})-[:IS_TRAIT]-(a)
MERGE (attr6:Personality:L1 {name: 'Sympathy', description: 'Feelings of pity and sorrow for someone else\'s misfortune.'})-[:IS_TRAIT]-(a)