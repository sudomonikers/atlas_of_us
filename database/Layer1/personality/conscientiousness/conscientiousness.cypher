MATCH (c:Personality {name: 'Conscientiousness'})

MERGE (attr1 {name: 'Self-Efficacy'})
SET attr1:Personality:L1,
    attr1.description = 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'
MERGE (c)-[:HAS_TRAIT]->(attr1)

MERGE (attr2 {name: 'Orderliness'})
SET attr2:Personality:L1,
    attr2.description = 'The quality or habit of being orderly and systematic.'
MERGE (c)-[:HAS_TRAIT]->(attr2)

MERGE (attr3 {name: 'Dutifulness'})
SET attr3:Personality:L1,
    attr3.description = 'Conscientiously or obediently fulfilling one\'s duty.'
MERGE (c)-[:HAS_TRAIT]->(attr3)

MERGE (attr4 {name: 'Achievement-Striving'})
SET attr4:Personality:L1,
    attr4.description = 'A strong desire to accomplish significant goals, often through hard work and determination.'
MERGE (c)-[:HAS_TRAIT]->(attr4)

MERGE (attr5 {name: 'Self-Discipline'})
SET attr5:Personality:L1,
    attr5.description = 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'
MERGE (c)-[:HAS_TRAIT]->(attr5)

MERGE (attr6 {name: 'Cautiousness'})
SET attr6:Personality:L1,
    attr6.description = 'The quality of being careful, prudent, and thoughtful before acting.'
MERGE (c)-[:HAS_TRAIT]->(attr6)