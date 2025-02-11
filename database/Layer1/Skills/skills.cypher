MATCH (n:CoreDomain {name: 'Skills'})

MERGE (s {name: 'Cognitive'})
SET s:Skills:L1,
    s.description = 'Core mental capabilities for processing and analyzing information'
MERGE (s)-[:IS_SUB_TYPE]->(n)

MERGE (s1 {name: 'Communication'})
SET s1:Skills:L1,
    s1.description = 'Abilities related to information exchange and expression'
MERGE (s1)-[:IS_SUB_TYPE]->(n)

MERGE (s2 {name: 'Social'})
SET s2:Skills:L1,
    s2.description = 'Capabilities for understanding and navigating human relationships'
MERGE (s2)-[:IS_SUB_TYPE]->(n)

MERGE (s3 {name: 'Physical'})
SET s3:Skills:L1,
    s3.description = 'Abilities related to physical movement and body control'
MERGE (s3)-[:IS_SUB_TYPE]->(n)

MERGE (s4 {name: 'Creative'})
SET s4:Skills:L1,
    s4.description = 'Abilities related to generating novel ideas and expressions'
MERGE (s4)-[:IS_SUB_TYPE]->(n)

MERGE (s5 {name: 'Meta'})
SET s5:Skills:L1,
    s5.description = 'Skills related to managing and improving other skills'
MERGE (s5)-[:IS_SUB_TYPE]->(n)

MERGE (s6 {name: 'Practical'})
SET s6:Skills:L1,
    s6.description = 'Concrete abilities needed for daily functioning'
MERGE (s6)-[:IS_SUB_TYPE]->(n)

MERGE (s7 {name: 'Perceptual'})
SET s7:Skills:L1,
    s7.description = 'Refined sensory abilities and discrimination'
MERGE (s7)-[:IS_SUB_TYPE]->(n)

MERGE (s8 {name: 'Integrative'})
SET s8:Skills:L1,
    s8.description = 'Complex abilities that emerge from combining multiple skill domains'
MERGE (s8)-[:IS_SUB_TYPE]->(n)