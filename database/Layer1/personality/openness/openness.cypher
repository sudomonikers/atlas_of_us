// Personality Attribute nodes for Openness
MATCH (o:Personality {name: 'Openness'})
WITH o
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Creativity', description: 'The ability to think about things in novel ways and to come up with original solutions to problems.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Curiosity', description: 'A strong desire to learn or know something, leading to exploration of new ideas and experiences.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Imagination', description: 'The capacity to create ideas or pictures in your mind, associated with creativity and artistic expression.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Daringness', description: 'A willingness to take risks or try out new and challenging experiences.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Preference for Variety', description: 'A tendency to seek out new experiences and changes in routine, avoiding monotony.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Intellectualism', description: 'A preference for dealing with complex, abstract ideas over simple, practical details.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Adventurousness', description: 'Eagerness to trying new activities and experiencing different things.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Liberalism', description: 'Openness to reexamine traditional values and to be accepting of change.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Artistic Interests', description: 'Appreciation for art, beauty, and aesthetic experiences.'})
MERGE (o)-[:HAS_ATTRIBUTE]->(:Personality:Attribute {name: 'Emotionality', description: 'Awareness of and expression of one\'s own feelings.'});
