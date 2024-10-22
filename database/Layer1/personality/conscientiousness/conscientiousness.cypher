// Personality Attribute nodes for Conscientiousness
MERGE (c:Personality {name: 'Conscientiousness'})
SET c:Conscientiousness

MERGE (attr1:Attribute {name: 'Self-Efficacy'})
SET attr1:Conscientiousness, attr1.description = 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Orderliness'})
SET attr2:Conscientiousness, attr2.description = 'The quality or habit of being orderly and systematic.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Dutifulness'})
SET attr3:Conscientiousness, attr3.description = 'Conscientiously or obediently fulfilling one\'s duty.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Achievement-Striving'})
SET attr4:Conscientiousness, attr4.description = 'A strong desire to accomplish significant goals, often through hard work and determination.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Self-Discipline'})
SET attr5:Conscientiousness, attr5.description = 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Cautiousness'})
SET attr6:Conscientiousness, attr6.description = 'The quality of being careful, prudent, and thoughtful before acting.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr6)
