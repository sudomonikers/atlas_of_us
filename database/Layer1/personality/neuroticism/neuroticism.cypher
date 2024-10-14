// Personality Attribute nodes for Neuroticism
MERGE (ne:Personality {name: 'Neuroticism'})

MERGE (attr1:Attribute {name: 'Anxiety'})
SET attr1:Personality, attr1.description = 'Feeling of worry, nervousness, or unease about something with an uncertain outcome.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Moodiness'})
SET attr2:Personality, attr2.description = 'Frequent changes in mood; tendency to experience feelings that are easily changed.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Vulnerability to Stress'})
SET attr3:Personality, attr3.description = 'Susceptibility to being easily stressed or overwhelmed by challenging situations.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Emotional Instability'})
SET attr4:Personality, attr4.description = 'Tendency to have unpredictable and rapid changes in emotions.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Anger'})
SET attr5:Personality, attr5.description = 'Feeling or showing strong annoyance, displeasure, or hostility; frustration.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Self-Consciousness'})
SET attr6:Personality, attr6.description = 'Acute awareness of oneself, leading to feelings of shyness or embarrassment.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr6)

MERGE (attr7:Attribute {name: 'Immoderation'})
SET attr7:Personality, attr7.description = 'Lack of restraint in controlling one\'s desires or feelings.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr7)

MERGE (attr8:Attribute {name: 'Depression'})
SET attr8:Personality, attr8.description = 'Feeling of severe despondency and dejection.'
MERGE (ne)-[:HAS_ATTRIBUTE]->(attr8)
