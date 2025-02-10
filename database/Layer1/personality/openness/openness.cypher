// Personality Trait nodes for Openness
MATCH (o:Personality {name: 'Openness'})

MERGE (attr1:Personality:L1 {name: 'Creativity', description: 'The ability to think about things in novel ways and to come up with original solutions to problems.'})-[:IS_TRAIT]-(o)
MERGE (attr2:Personality:L1 {name: 'Curiosity', description: 'A strong desire to learn or know something, leading to exploration of new ideas and experiences.'})-[:IS_TRAIT]-(o)
MERGE (attr3:Personality:L1 {name: 'Imagination', description: 'The capacity to create ideas or pictures in your mind, associated with creativity and artistic expression.'})-[:IS_TRAIT]-(o)
MERGE (attr4:Personality:L1 {name: 'Daringness', description: 'A willingness to take risks or try out new and challenging experiences.'})-[:IS_TRAIT]-(o)
MERGE (attr5:Personality:L1 {name: 'Preference for Variety', description: 'A tendency to seek out new experiences and changes in routine, avoiding monotony.'})-[:IS_TRAIT]-(o)
MERGE (attr6:Personality:L1 {name: 'Intellectualism', description: 'A preference for dealing with complex, abstract ideas over simple, practical details.'})-[:IS_TRAIT]-(o)
MERGE (attr7:Personality:L1 {name: 'Adventurousness', description: 'Eagerness to trying new activities and experiencing different things.'})-[:IS_TRAIT]-(o)
MERGE (attr8:Personality:L1 {name: 'Liberalism', description: 'Openness to reexamine traditional values and to be accepting of change.'})-[:IS_TRAIT]-(o)
MERGE (attr9:Personality:L1 {name: 'Artistic Interests', description: 'Appreciation for art, beauty, and aesthetic experiences.'})-[:IS_TRAIT]-(o)
MERGE (attr10:Personality:L1 {name: 'Emotionality', description: 'Awareness of and expression of one\'s own feelings.'})-[:IS_TRAIT]-(o)
