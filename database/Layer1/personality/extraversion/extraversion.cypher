MATCH (e:Personality {name: 'Extraversion'})

MERGE (attr1:Personality:L1 {name: 'Sociability', description: 'Enjoyment of being with people and seeking out company and social interactions.'})-[:IS_TRAIT]-(e)
MERGE (attr2:Personality:L1 {name: 'Assertiveness', description: 'The willingness to express oneself and one\'s rights without undue anxiety.'})-[:IS_TRAIT]-(e)
MERGE (attr3:Personality:L1 {name: 'Excitement-Seeking', description: 'A desire to seek out activities where there is a thrill or high level of stimulation.'})-[:IS_TRAIT]-(e)
MERGE (attr4:Personality:L1 {name: 'Cheerfulness', description: 'Tendency to experience joy and to be optimistic.'})-[:IS_TRAIT]-(e)
MERGE (attr5:Personality:L1 {name: 'Activity Level', description: 'A tendency to be busy and engaged in activities.'})-[:IS_TRAIT]-(e)
MERGE (attr6:Personality:L1 {name: 'Friendliness', description: 'Being kind and pleasant towards others.'})-[:IS_TRAIT]-(e)