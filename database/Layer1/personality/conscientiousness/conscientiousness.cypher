MATCH (c:Personality {name: 'Conscientiousness'})

MERGE (attr1:Personality:L1 {name: 'Self-Efficacy', description: 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'})-[:IS_TRAIT]-(c)
MERGE (attr2:Personality:L1 {name: 'Orderliness', description: 'The quality or habit of being orderly and systematic.'})-[:IS_TRAIT]-(c)
MERGE (attr3:Personality:L1 {name: 'Dutifulness', description: 'Conscientiously or obediently fulfilling one\'s duty.'})-[:IS_TRAIT]-(c)
MERGE (attr4:Personality:L1 {name: 'Achievement-Striving', description: 'A strong desire to accomplish significant goals, often through hard work and determination.'})-[:IS_TRAIT]-(c)
MERGE (attr5:Personality:L1 {name: 'Self-Discipline', description: 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'})-[:IS_TRAIT]-(c)
MERGE (attr6:Personality:L1 {name: 'Cautiousness', description: 'The quality of being careful, prudent, and thoughtful before acting.'})-[:IS_TRAIT]-(c)
