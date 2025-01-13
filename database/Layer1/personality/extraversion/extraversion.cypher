// Personality Trait nodes for Extraversion
MATCH (e:Personality {name: 'Extraversion'})

MERGE (attr1 {name: 'Sociability'})
SET attr1:Personality:Trait, attr1.description = 'Enjoyment of being with people and seeking out company and social interactions.'
MERGE (e)-[:HAS_TRAIT]->(attr1)

MERGE (attr2 {name: 'Assertiveness'})
SET attr2:Personality:Trait, attr2.description = 'The willingness to express oneself and one\'s rights without undue anxiety.'
MERGE (e)-[:HAS_TRAIT]->(attr2)

MERGE (attr3 {name: 'Excitement-Seeking'})
SET attr3:Personality:Trait, attr3.description = 'A desire to seek out activities where there is a thrill or high level of stimulation.'
MERGE (e)-[:HAS_TRAIT]->(attr3)

MERGE (attr4 {name: 'Cheerfulness'})
SET attr4:Personality:Trait, attr4.description = 'Tendency to experience joy and to be optimistic.'
MERGE (e)-[:HAS_TRAIT]->(attr4)

MERGE (attr5 {name: 'Activity Level'})
SET attr5:Personality:Trait, attr5.description = 'A tendency to be busy and engaged in activities.'
MERGE (e)-[:HAS_TRAIT]->(attr5)

MERGE (attr6 {name: 'Friendliness'})
SET attr6:Personality:Trait, attr6.description = 'Being kind and pleasant towards others.'
MERGE (e)-[:HAS_TRAIT]->(attr6)