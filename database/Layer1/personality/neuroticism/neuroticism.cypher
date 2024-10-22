// Personality Attribute nodes for Neuroticism
MERGE (ne:Personality {name: 'Neuroticism'})
SET ne:Neuroticism

MERGE (attr1:Attribute {name: 'Anxiety'})
SET attr1:Neuroticism, attr1.description = 'Feeling of worry, nervousness, or unease about something with an uncertain outcome.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Moodiness'})
SET attr2:Neuroticism, attr2.description = 'Frequent changes in mood; tendency to experience feelings that are easily changed.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Vulnerability to Stress'})
SET attr3:Neuroticism, attr3.description = 'Susceptibility to being easily stressed or overwhelmed by challenging situations.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Emotional Instability'})
SET attr4:Neuroticism, attr4.description = 'Tendency to have unpredictable and rapid changes in emotions.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Anger'})
SET attr5:Neuroticism, attr5.description = 'Feeling or showing strong annoyance, displeasure, or hostility; frustration.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Self-Consciousness'})
SET attr6:Neuroticism, attr6.description = 'Acute awareness of oneself, leading to feelings of shyness or embarrassment.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr6)

MERGE (attr7:Attribute {name: 'Immoderation'})
SET attr7:Neuroticism, attr7.description = 'Lack of restraint in controlling one\'s desires or feelings.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr7)

MERGE (attr8:Attribute {name: 'Depression'})
SET attr8:Neuroticism, attr8.description = 'Feeling of severe despondency and dejection.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr8)
