MATCH (a:Personality {name: 'Agreeableness'})

MERGE (attr1 {name: 'Trust'})
SET attr1:Personality:L1:Trait,
    attr1.description = 'Belief in the reliability, truth, ability, or strength of others.'
MERGE (attr1)-[:IS_TRAIT_TYPE]->(a)

MERGE (attr2 {name: 'Morality'})
SET attr2:Personality:L1:Trait,
    attr2.description = 'The differentiation of intentions, decisions, and actions between those that are distinguished as proper and those that are improper.'
MERGE (attr2)-[:IS_TRAIT_TYPE]->(a)

MERGE (attr3 {name: 'Altruism'})
SET attr3:Personality:L1:Trait,
    attr3.description = 'The belief in or practice of disinterested and selfless concern for the well-being of others.'
MERGE (attr3)-[:IS_TRAIT_TYPE]->(a)

MERGE (attr4 {name: 'Cooperation'})
SET attr4:Personality:L1:Trait,
    attr4.description = 'The process of working together to the same end.'
MERGE (attr4)-[:IS_TRAIT_TYPE]->(a)

MERGE (attr5 {name: 'Modesty'})
SET attr5:Personality:L1:Trait,
    attr5.description = 'The quality of being modest; freedom from vanity, boastfulness, etc.'
MERGE (attr5)-[:IS_TRAIT_TYPE]->(a)

MERGE (attr6 {name: 'Sympathy'})
SET attr6:Personality:L1:Trait,
    attr6.description = 'Feelings of pity and sorrow for someone else\'s misfortune.'
MERGE (attr6)-[:IS_TRAIT_TYPE]->(a)