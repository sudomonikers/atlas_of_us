MATCH (e:Personality {name: 'Extraversion'})

MERGE (attr1 {name: 'Sociability'})
SET attr1:Personality:L1:Trait,
    attr1.description = 'Enjoyment of being with people and seeking out company and social interactions.'
MERGE (attr1)-[:IS_TRAIT_TYPE]->(e)

MERGE (attr2 {name: 'Assertiveness'})
SET attr2:Personality:L1:Trait,
    attr2.description = 'The willingness to express oneself and one\'s rights without undue anxiety.'
MERGE (attr2)-[:IS_TRAIT_TYPE]->(e)

MERGE (attr3 {name: 'Excitement-Seeking'})
SET attr3:Personality:L1:Trait,
    attr3.description = 'A desire to seek out activities where there is a thrill or high level of stimulation.'
MERGE (attr3)-[:IS_TRAIT_TYPE]->(e)

MERGE (attr4 {name: 'Cheerfulness'})
SET attr4:Personality:L1:Trait,
    attr4.description = 'Tendency to experience joy and to be optimistic.'
MERGE (attr4)-[:IS_TRAIT_TYPE]->(e)

MERGE (attr5 {name: 'Activity Level'})
SET attr5:Personality:L1:Trait,
    attr5.description = 'A tendency to be busy and engaged in activities.'
MERGE (attr5)-[:IS_TRAIT_TYPE]->(e)

MERGE (attr6 {name: 'Friendliness'})
SET attr6:Personality:L1:Trait,
    attr6.description = 'Being kind and pleasant towards others.'
MERGE (attr6)-[:IS_TRAIT_TYPE]->(e)