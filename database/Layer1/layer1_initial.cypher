//BASIC INDIVIDUAL POSSIBILITIES (Layer 1)
MERGE (p:CoreDomain {name: 'Individual Possibilities'})
WITH p
MERGE (h:CoreDomain:L1 {name: 'Health', description: 'Health of the body, including physical, mental, and emotional health.'})-[IS_CORE_DOMAIN]->(p)
MERGE (k:CoreDomain:L1 {name: 'Knowledge', description: 'The many things it is possible to know about.'})-[IS_CORE_DOMAIN]->(p)
MERGE (i:CoreDomain:L1 {name: 'Intrinsics', description: 'The many basic facts about people.'})-[IS_CORE_DOMAIN]->(p)
MERGE (p:CoreDomain:L1 {name: 'Pursuits', description: 'Activities and interests pursued for enjoyment or personal development.'})-[IS_CORE_DOMAIN]->(p)
MERGE (pe:CoreDomain:L1 {name: 'Personality', description: 'The aspects that make up a person\'s personality.'})-[IS_CORE_DOMAIN]->(p)
MERGE (s:CoreDomain:L1 {name: 'Skills', description: 'Skills and abilities a person can have.'})-[IS_CORE_DOMAIN]->(p)