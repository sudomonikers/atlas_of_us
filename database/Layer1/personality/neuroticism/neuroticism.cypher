// Personality Attribute nodes for Neuroticism
MATCH (ne:Personality {name: 'Neuroticism'})
WITH ne
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Anxiety', description: 'Feeling of worry, nervousness, or unease about something with an uncertain outcome.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Moodiness', description: 'Frequent changes in mood; tendency to experience feelings that are easily changed.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Vulnerability to Stress', description: 'Susceptibility to being easily stressed or overwhelmed by challenging situations.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Emotional Instability', description: 'Tendency to have unpredictable and rapid changes in emotions.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Anger', description: 'Feeling or showing strong annoyance, displeasure, or hostility; frustration.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Self-Consciousness', description: 'Acute awareness of oneself, leading to feelings of shyness or embarrassment.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Immoderation', description: 'Lack of restraint in controlling one\'s desires or feelings.'})
MERGE (ne)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Depression', description: 'Feeling of severe despondency and dejection.'});
