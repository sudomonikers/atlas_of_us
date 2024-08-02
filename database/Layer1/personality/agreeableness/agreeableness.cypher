// Personality Attribute nodes for Agreeableness
MATCH (a:Personality {name: 'Agreeableness'})
WITH a
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Trust', description: 'Belief in the reliability, truth, ability, or strength of others.'})
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Morality', description: 'The differentiation of intentions, decisions, and actions between those that are distinguished as proper and those that are improper.'})
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Altruism', description: 'The belief in or practice of disinterested and selfless concern for the well-being of others.'})
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Cooperation', description: 'The process of working together to the same end.'})
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Modesty', description: 'The quality of being modest; freedom from vanity, boastfulness, etc.'})
MERGE (a)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Sympathy', description: 'Feelings of pity and sorrow for someone else\'s misfortune.'});
