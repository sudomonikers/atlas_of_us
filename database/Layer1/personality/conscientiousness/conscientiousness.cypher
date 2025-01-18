// Personality Attribute nodes for Conscientiousness
MERGE (c:Personality {name: 'Conscientiousness'})
SET c:Conscientiousness

MERGE (attr1 {name: 'Self-Efficacy'})
SET attr1:Personality:Trait:Conscientiousness, attr1.description = 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2 {name: 'Orderliness'})
SET attr2:Personality:Trait:Conscientiousness, attr2.description = 'The quality or habit of being orderly and systematic.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3 {name: 'Dutifulness'})
SET attr3:Personality:Trait:Conscientiousness, attr3.description = 'Conscientiously or obediently fulfilling one\'s duty.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4 {name: 'Achievement-Striving'})
SET attr4:Personality:Trait:Conscientiousness, attr4.description = 'A strong desire to accomplish significant goals, often through hard work and determination.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5 {name: 'Self-Discipline'})
SET attr5:Personality:Trait:Conscientiousness, attr5.description = 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6 {name: 'Cautiousness'})
SET attr6:Personality:Trait:Conscientiousness, attr6.description = 'The quality of being careful, prudent, and thoughtful before acting.'
MERGE (c)-[:HAS_ATTRIBUTE]->(attr6)
