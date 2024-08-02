// Personality Attribute nodes for Extraversion
MATCH (e:Personality {name: 'Extraversion'})
WITH e
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Sociability', description: 'Enjoyment of being with people and seeking out company and social interactions.'})
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Assertiveness', description: 'The willingness to express oneself and one\'s rights without undue anxiety.'})
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Excitement-Seeking', description: 'A desire to seek out activities where there is a thrill or high level of stimulation.'})
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Cheerfulness', description: 'Tendency to experience joy and to be optimistic.'})
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Activity Level', description: 'A tendency to be busy and engaged in activities.'})
MERGE (e)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Friendliness', description: 'Being kind and pleasant towards others.'});
