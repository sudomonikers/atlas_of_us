// Personality Attribute nodes for Openness
MERGE (o:Personality {name: 'Openness'})

MERGE (attr1:Attribute {name: 'Creativity'})
SET attr1:Personality, attr1.description = 'The ability to think about things in novel ways and to come up with original solutions to problems.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr1)

MERGE (attr2:Attribute {name: 'Curiosity'})
SET attr2:Personality, attr2.description = 'A strong desire to learn or know something, leading to exploration of new ideas and experiences.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr2)

MERGE (attr3:Attribute {name: 'Imagination'})
SET attr3:Personality, attr3.description = 'The capacity to create ideas or pictures in your mind, associated with creativity and artistic expression.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr3)

MERGE (attr4:Attribute {name: 'Daringness'})
SET attr4:Personality, attr4.description = 'A willingness to take risks or try out new and challenging experiences.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr4)

MERGE (attr5:Attribute {name: 'Preference for Variety'})
SET attr5:Personality, attr5.description = 'A tendency to seek out new experiences and changes in routine, avoiding monotony.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr5)

MERGE (attr6:Attribute {name: 'Intellectualism'})
SET attr6:Personality, attr6.description = 'A preference for dealing with complex, abstract ideas over simple, practical details.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr6)

MERGE (attr7:Attribute {name: 'Adventurousness'})
SET attr7:Personality, attr7.description = 'Eagerness to trying new activities and experiencing different things.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr7)

MERGE (attr8:Attribute {name: 'Liberalism'})
SET attr8:Personality, attr8.description = 'Openness to reexamine traditional values and to be accepting of change.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr8)

MERGE (attr9:Attribute {name: 'Artistic Interests'})
SET attr9:Personality, attr9.description = 'Appreciation for art, beauty, and aesthetic experiences.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr9)

MERGE (attr10:Attribute {name: 'Emotionality'})
SET attr10:Personality, attr10.description = 'Awareness of and expression of one\'s own feelings.'
MERGE (o)-[:HAS_ATTRIBUTE]->(attr10)
