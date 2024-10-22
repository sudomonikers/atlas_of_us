// Personality Attribute nodes for Extraversion
MERGE (e:Personality {name: 'Extraversion'})
SET e:Extraversion

MERGE (attr1:Attribute {name: 'Sociability'})
SET attr1:Extraversion, attr1.description = 'Enjoyment of being with people and seeking out company and social interactions.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Assertiveness'})
SET attr2:Extraversion, attr2.description = 'The willingness to express oneself and one\'s rights without undue anxiety.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Excitement-Seeking'})
SET attr3:Extraversion, attr3.description = 'A desire to seek out activities where there is a thrill or high level of stimulation.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Cheerfulness'})
SET attr4:Extraversion, attr4.description = 'Tendency to experience joy and to be optimistic.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Activity Level'})
SET attr5:Extraversion, attr5.description = 'A tendency to be busy and engaged in activities.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Friendliness'})
SET attr6:Extraversion, attr6.description = 'Being kind and pleasant towards others.'
MERGE (e)-[:HAS_ATTRIBUTE]->(attr6)
