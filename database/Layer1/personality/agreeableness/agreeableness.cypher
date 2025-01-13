// Personality Trait nodes for Agreeableness
MATCH (a:Personality {name: 'Agreeableness'})

MERGE (attr1 {name: 'Trust'})
SET attr1:Personality:Trait, attr1.description = 'Belief in the reliability, truth, ability, or strength of others.'
MERGE (a)-[:HAS_TRAIT]->(attr1)

MERGE (attr2 {name: 'Morality'})
SET attr2:Personality:Trait, attr2.description = 'The differentiation of intentions, decisions, and actions between those that are distinguished as proper and those that are improper.'
MERGE (a)-[:HAS_TRAIT]->(attr2)

MERGE (attr3 {name: 'Altruism'})
SET attr3:Personality:Trait, attr3.description = 'The belief in or practice of disinterested and selfless concern for the well-being of others.'
MERGE (a)-[:HAS_TRAIT]->(attr3)

MERGE (attr4 {name: 'Cooperation'})
SET attr4:Personality:Trait, attr4.description = 'The process of working together to the same end.'
MERGE (a)-[:HAS_TRAIT]->(attr4)

MERGE (attr5 {name: 'Modesty'})
SET attr5:Personality:Trait, attr5.description = 'The quality of being modest; freedom from vanity, boastfulness, etc.'
MERGE (a)-[:HAS_TRAIT]->(attr5)

MERGE (attr6 {name: 'Sympathy'})
SET attr6:Personality:Trait, attr6.description = 'Feelings of pity and sorrow for someone else\'s misfortune.'
MERGE (a)-[:HAS_TRAIT]->(attr6)