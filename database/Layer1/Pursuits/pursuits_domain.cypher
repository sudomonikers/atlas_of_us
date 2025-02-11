MATCH (n:CoreDomain {name: 'Pursuits'})

MERGE (s {name: 'Social'})
SET s:Pursuits:L1,
    s.description = 'Activities focused on building and maintaining relationships, engaging with communities, and participating in social interactions'
MERGE (s)-[:IS_SUB_TYPE]->(n)

MERGE (s1 {name: 'Professional'})
SET s1:Pursuits:L1,
    s1.description = 'Activities related to career development, work responsibilities, and professional growth within chosen fields'
MERGE (s1)-[:IS_SUB_TYPE]->(n)

MERGE (s2 {name: 'Physical'})
SET s2:Pursuits:L1,
    s2.description = 'Activities involving bodily movement, exercise, sports, and physical wellness maintenance'
MERGE (s2)-[:IS_SUB_TYPE]->(n)

MERGE (s3 {name: 'Leisure'})
SET s3:Pursuits:L1,
    s3.description = 'Recreational activities pursued for enjoyment, relaxation, and personal satisfaction during free time'
MERGE (s3)-[:IS_SUB_TYPE]->(n)

MERGE (s4 {name: 'Intellectual'})
SET s4:Pursuits:L1,
    s4.description = 'Activities focused on learning, academic growth, critical thinking, and expanding mental capabilities'
MERGE (s4)-[:IS_SUB_TYPE]->(n)

MERGE (s5 {name: 'Financial'})
SET s5:Pursuits:L1,
    s5.description = 'Activities related to managing money, investments, budgeting, and building financial security'
MERGE (s5)-[:IS_SUB_TYPE]->(n)

MERGE (s6 {name: 'Creative'})
SET s6:Pursuits:L1,
    s6.description = 'Activities involving artistic expression, innovation, and the generation of original ideas or works'
MERGE (s6)-[:IS_SUB_TYPE]->(n)

MERGE (s7 {name: 'Practical'})
SET s7:Pursuits:L1,
    s7.description = 'Activities focused on maintaining daily life, solving everyday problems, and developing life skills'
MERGE (s7)-[:IS_SUB_TYPE]->(n)