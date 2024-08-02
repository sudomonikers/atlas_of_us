// Personality Attribute nodes for Conscientiousness
MATCH (c:Personality {name: 'Conscientiousness'})
WITH c
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Self-Efficacy', description: 'Belief in one\'s ability to succeed in specific situations or accomplish a task.'})
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Orderliness', description: 'The quality or habit of being orderly and systematic.'})
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Dutifulness', description: 'Conscientiously or obediently fulfilling one\'s duty.'})
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Achievement-Striving', description: 'A strong desire to accomplish significant goals, often through hard work and determination.'})
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Self-Discipline', description: 'The ability to control one\'s feelings and overcome one\'s weaknesses; the ability to pursue what one thinks is right despite temptations to abandon it.'})
MERGE (c)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Cautiousness', description: 'The quality of being careful, prudent, and thoughtful before acting.'});