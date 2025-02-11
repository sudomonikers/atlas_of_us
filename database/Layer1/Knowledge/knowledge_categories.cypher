MATCH (n:CoreDomain {name: 'Knowledge'})

MERGE (s {name: 'Factual'})
SET s:Knowledge:L1,
    s.description = 'Concrete, verifiable information and data'
MERGE (s)-[:IS_SUB_TYPE]->(n)

MERGE (s1 {name: 'Conceptual'})
SET s1:Knowledge:L1,
    s1.description = 'Understanding of theories, models, and abstract frameworks'
MERGE (s1)-[:IS_SUB_TYPE]->(n)

MERGE (s2 {name: 'Procedural'})
SET s2:Knowledge:L1,
    s2.description = 'Understanding of how to perform tasks and processes'
MERGE (s2)-[:IS_SUB_TYPE]->(n)

MERGE (s3 {name: 'Experiential'})
SET s3:Knowledge:L1,
    s3.description = 'Understanding gained through direct experience and practice'
MERGE (s3)-[:IS_SUB_TYPE]->(n)

MERGE (s4 {name: 'Cultural'})
SET s4:Knowledge:L1,
    s4.description = 'Understanding of human societies, practices, and beliefs'
MERGE (s4)-[:IS_SUB_TYPE]->(n)

MERGE (s5 {name: 'Systems'})
SET s5:Knowledge:L1,
    s5.description = 'Understanding of complex interconnected systems and their behaviors'
MERGE (s5)-[:IS_SUB_TYPE]->(n)

MERGE (s6 {name: 'Meta'})
SET s6:Knowledge:L1,
    s6.description = 'Knowledge about knowledge itself and how to manage it'
MERGE (s6)-[:IS_SUB_TYPE]->(n)

MERGE (s7 {name: 'Contextual'})
SET s7:Knowledge:L1,
    s7.description = 'Understanding of when and where to apply different types of knowledge'
MERGE (s7)-[:IS_SUB_TYPE]->(n)