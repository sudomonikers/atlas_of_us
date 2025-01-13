// Personality Trait nodes for Openness
MATCH (o:Personality {name: 'Openness'})

MERGE (attr1 {name: 'Creativity'})
SET attr1:Personality:Trait, attr1.description = 'The ability to think about things in novel ways and to come up with original solutions to problems.'
MERGE (o)-[:HAS_TRAIT]->(attr1)

MERGE (attr2 {name: 'Curiosity'})
SET attr2:Personality:Trait, attr2.description = 'A strong desire to learn or know something, leading to exploration of new ideas and experiences.'
MERGE (o)-[:HAS_TRAIT]->(attr2)

MERGE (attr3 {name: 'Imagination'})
SET attr3:Personality:Trait, attr3.description = 'The capacity to create ideas or pictures in your mind, associated with creativity and artistic expression.'
MERGE (o)-[:HAS_TRAIT]->(attr3)

MERGE (attr4 {name: 'Daringness'})
SET attr4:Personality:Trait, attr4.description = 'A willingness to take risks or try out new and challenging experiences.'
MERGE (o)-[:HAS_TRAIT]->(attr4)

MERGE (attr5 {name: 'Preference for Variety'})
SET attr5:Personality:Trait, attr5.description = 'A tendency to seek out new experiences and changes in routine, avoiding monotony.'
MERGE (o)-[:HAS_TRAIT]->(attr5)

MERGE (attr6 {name: 'Intellectualism'})
SET attr6:Personality:Trait, attr6.description = 'A preference for dealing with complex, abstract ideas over simple, practical details.'
MERGE (o)-[:HAS_TRAIT]->(attr6)

MERGE (attr7 {name: 'Adventurousness'})
SET attr7:Personality:Trait, attr7.description = 'Eagerness to trying new activities and experiencing different things.'
MERGE (o)-[:HAS_TRAIT]->(attr7)

MERGE (attr8 {name: 'Liberalism'})
SET attr8:Personality:Trait, attr8.description = 'Openness to reexamine traditional values and to be accepting of change.'
MERGE (o)-[:HAS_TRAIT]->(attr8)

MERGE (attr9 {name: 'Artistic Interests'})
SET attr9:Personality:Trait, attr9.description = 'Appreciation for art, beauty, and aesthetic experiences.'
MERGE (o)-[:HAS_TRAIT]->(attr9)

MERGE (attr10 {name: 'Emotionality'})
SET attr10:Personality:Trait, attr10.description = 'Awareness of and expression of one\'s own feelings.'
MERGE (o)-[:HAS_TRAIT]->(attr10)
