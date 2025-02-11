MATCH (o:Personality {name: 'Openness'})

MERGE (attr1 {name: 'Creativity'})
SET attr1:Personality:L1:Trait,
    attr1.description = 'The ability to think about things in novel ways and to come up with original solutions to problems.'
MERGE (attr1)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr2 {name: 'Curiosity'})
SET attr2:Personality:L1:Trait,
    attr2.description = 'A strong desire to learn or know something, leading to exploration of new ideas and experiences.'
MERGE (attr2)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr3 {name: 'Imagination'})
SET attr3:Personality:L1:Trait,
    attr3.description = 'The capacity to create ideas or pictures in your mind, associated with creativity and artistic expression.'
MERGE (attr3)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr4 {name: 'Daringness'})
SET attr4:Personality:L1:Trait,
    attr4.description = 'A willingness to take risks or try out new and challenging experiences.'
MERGE (attr4)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr5 {name: 'Preference for Variety'})
SET attr5:Personality:L1:Trait,
    attr5.description = 'A tendency to seek out new experiences and changes in routine, avoiding monotony.'
MERGE (attr5)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr6 {name: 'Intellectualism'})
SET attr6:Personality:L1:Trait,
    attr6.description = 'A preference for dealing with complex, abstract ideas over simple, practical details.'
MERGE (attr6)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr7 {name: 'Adventurousness'})
SET attr7:Personality:L1:Trait,
    attr7.description = 'Eagerness to trying new activities and experiencing different things.'
MERGE (attr7)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr8 {name: 'Liberalism'})
SET attr8:Personality:L1:Trait,
    attr8.description = 'Openness to reexamine traditional values and to be accepting of change.'
MERGE (attr8)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr9 {name: 'Artistic Interests'})
SET attr9:Personality:L1:Trait,
    attr9.description = 'Appreciation for art, beauty, and aesthetic experiences.'
MERGE (attr9)-[:IS_TRAIT_TYPE]->(o)

MERGE (attr10 {name: 'Emotionality'})
SET attr10:Personality:L1:Trait,
    attr10.description = 'Awareness of and expression of one\'s own feelings.'
MERGE (attr10)-[:IS_TRAIT_TYPE]->(o)