MATCH (c:Personality {name: 'Conscientiousness'})

MERGE (attr1 {name: 'Self-Efficacy'})
SET attr1:Personality:L1:Trait,
    attr1.description = 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'
MERGE (attr1)-[:IS_TRAIT_TYPE]->(c)

MERGE (attr2 {name: 'Orderliness'})
SET attr2:Personality:L1:Trait,
    attr2.description = 'The quality or habit of being orderly and systematic.'
MERGE (attr2)-[:IS_TRAIT_TYPE]->(c)

MERGE (attr3 {name: 'Dutifulness'})
SET attr3:Personality:L1:Trait,
    attr3.description = 'Conscientiously or obediently fulfilling one\'s duty.'
MERGE (attr3)-[:IS_TRAIT_TYPE]->(c)

MERGE (attr4 {name: 'Achievement-Striving'})
SET attr4:Personality:L1:Trait,
    attr4.description = 'A strong desire to accomplish significant goals, often through hard work and determination.'
MERGE (attr4)-[:IS_TRAIT_TYPE]->(c)

MERGE (attr5 {name: 'Self-Discipline'})
SET attr5:Personality:L1:Trait,
    attr5.description = 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'
MERGE (attr5)-[:IS_TRAIT_TYPE]->(c)

MERGE (attr6 {name: 'Cautiousness'})
SET attr6:Personality:L1:Trait,
    attr6.description = 'The quality of being careful, prudent, and thoughtful before acting.'
MERGE (attr6)-[:IS_TRAIT_TYPE]->(c)