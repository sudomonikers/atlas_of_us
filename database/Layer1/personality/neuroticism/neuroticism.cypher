MATCH (ne:Personality {name: 'Neuroticism'})

MERGE (attr1 {name: 'Anxiety'})
SET attr1:Personality:L1:Trait,
    attr1.description = 'Feeling of worry, nervousness, or unease about something with an uncertain outcome.'
MERGE (attr1)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr2 {name: 'Moodiness'})
SET attr2:Personality:L1:Trait,
    attr2.description = 'Frequent changes in mood; tendency to experience feelings that are easily changed.'
MERGE (attr2)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr3 {name: 'Vulnerability to Stress'})
SET attr3:Personality:L1:Trait,
    attr3.description = 'Susceptibility to being easily stressed or overwhelmed by challenging situations.'
MERGE (attr3)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr4 {name: 'Emotional Instability'})
SET attr4:Personality:L1:Trait,
    attr4.description = 'Tendency to have unpredictable and rapid changes in emotions.'
MERGE (attr4)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr5 {name: 'Anger'})
SET attr5:Personality:L1:Trait,
    attr5.description = 'Feeling or showing strong annoyance, displeasure, or hostility; frustration.'
MERGE (attr5)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr6 {name: 'Self-Consciousness'})
SET attr6:Personality:L1:Trait,
    attr6.description = 'Acute awareness of oneself, leading to feelings of shyness or embarrassment.'
MERGE (attr6)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr7 {name: 'Immoderation'})
SET attr7:Personality:L1:Trait,
    attr7.description = 'Lack of restraint in controlling one\'s desires or feelings.'
MERGE (attr7)-[:IS_TRAIT_TYPE]->(ne)

MERGE (attr8 {name: 'Depression'})
SET attr8:Personality:L1:Trait,
    attr8.description = 'Feeling of severe despondency and dejection.'
MERGE (attr8)-[:IS_TRAIT_TYPE]->(ne)