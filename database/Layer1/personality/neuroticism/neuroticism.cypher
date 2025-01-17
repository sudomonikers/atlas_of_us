// Personality Trait nodes for Neuroticism
MATCH (ne:Personality {name: 'Neuroticism'})

MERGE (attr1 {name: 'Anxiety'})
SET attr1:Personality:Trait:Neuroticism, attr1.description = 'Feeling of worry, nervousness, or unease about something with an uncertain outcome.'
MERGE (ne)-[:HAS_TRAIT]->(attr1)

MERGE (attr2 {name: 'Moodiness'})
SET attr2:Personality:Trait:Neuroticism, attr2.description = 'Frequent changes in mood; tendency to experience feelings that are easily changed.'
MERGE (ne)-[:HAS_TRAIT]->(attr2)

MERGE (attr3 {name: 'Vulnerability to Stress'})
SET attr3:Personality:Trait:Neuroticism, attr3.description = 'Susceptibility to being easily stressed or overwhelmed by challenging situations.'
MERGE (ne)-[:HAS_TRAIT]->(attr3)

MERGE (attr4 {name: 'Emotional Instability'})
SET attr4:Personality:Trait:Neuroticism, attr4.description = 'Tendency to have unpredictable and rapid changes in emotions.'
MERGE (ne)-[:HAS_TRAIT]->(attr4)

MERGE (attr5 {name: 'Anger'})
SET attr5:Personality:Trait:Neuroticism, attr5.description = 'Feeling or showing strong annoyance, displeasure, or hostility; frustration.'
MERGE (ne)-[:HAS_TRAIT]->(attr5)

MERGE (attr6 {name: 'Self-Consciousness'})
SET attr6:Personality:Trait:Neuroticism, attr6.description = 'Acute awareness of oneself, leading to feelings of shyness or embarrassment.'
MERGE (ne)-[:HAS_TRAIT]->(attr6)

MERGE (attr7 {name: 'Immoderation'})
SET attr7:Personality:Trait:Neuroticism, attr7.description = 'Lack of restraint in controlling one\'s desires or feelings.'
MERGE (ne)-[:HAS_TRAIT]->(attr7)

MERGE (attr8 {name: 'Depression'})
SET attr8:Personality:Trait:Neuroticism, attr8.description = 'Feeling of severe despondency and dejection.'
MERGE (ne)-[:HAS_TRAIT]->(attr8)