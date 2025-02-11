// BASIC INDIVIDUAL POSSIBILITIES (Layer 1)
MERGE (p:CoreDomain {name: 'Individual Possibilities'})
WITH p

MERGE (h {name: 'Health'})
SET h:CoreDomain:L1,
    h.description = 'Health of the body, including physical, mental, and emotional health.'
MERGE (h)-[:IS_CORE_DOMAIN]->(p)

MERGE (k {name: 'Knowledge'})
SET k:CoreDomain:L1,
    k.description = 'The many things it is possible to know about.'
MERGE (k)-[:IS_CORE_DOMAIN]->(p)

MERGE (i {name: 'Intrinsics'})
SET i:CoreDomain:L1,
    i.description = 'The many basic facts about people.'
MERGE (i)-[:IS_CORE_DOMAIN]->(p)

MERGE (pu {name: 'Pursuits'})
SET pu:CoreDomain:L1,
    pu.description = 'Activities and interests pursued for enjoyment or personal development.'
MERGE (pu)-[:IS_CORE_DOMAIN]->(p)

MERGE (pe {name: 'Personality'})
SET pe:CoreDomain:L1,
    pe.description = 'The aspects that make up a person\'s personality.'
MERGE (pe)-[:IS_CORE_DOMAIN]->(p)

MERGE (s {name: 'Skills'})
SET s:CoreDomain:L1,
    s.description = 'Skills and abilities a person can have.'
MERGE (s)-[:IS_CORE_DOMAIN]->(p)