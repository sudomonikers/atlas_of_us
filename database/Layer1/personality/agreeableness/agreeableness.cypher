// Personality Attribute nodes for Agreeableness
MERGE (a {name: 'Agreeableness'})
SET a:Agreeableness

MERGE (attr1:Attribute {name: 'Trust'})
SET attr1:Agreeableness, attr1.description = 'Belief in the reliability, truth, ability, or strength of others.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Morality'})
SET attr2:Agreeableness, attr2.description = 'The differentiation of intentions, decisions, and actions between those that are distinguished as proper and those that are improper.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Altruism'})
SET attr3:Agreeableness, attr3.description = 'The belief in or practice of disinterested and selfless concern for the well-being of others.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Cooperation'})
SET attr4:Agreeableness, attr4.description = 'The process of working together to the same end.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Modesty'})
SET attr5:Agreeableness, attr5.description = 'The quality of being modest; freedom from vanity, boastfulness, etc.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Sympathy'})
SET attr6:Agreeableness, attr6.description = 'Feelings of pity and sorrow for someone else\'s misfortune.'
MERGE (a)-[:HAS_ATTRIBUTE]->(attr6)
