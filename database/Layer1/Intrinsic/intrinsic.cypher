MATCH (i {name: 'Intrinsic'})

MERGE (h {name: 'Height'})
SET h:Intrinsic:L1,
    h.description = 'Length of human from the bottom of the feet to the top of the head in cm.'
MERGE (i)-[:HAS_TRAIT]->(h)

MERGE (g {name: 'Gender'})
SET g:Intrinsic:L1,
    g.description = 'Sex of the individual.'
MERGE (i)-[:HAS_TRAIT]->(g)

MERGE (b {name: 'Birthday'})
SET b:Intrinsic:L1,
    b.description = 'Date of birth in YYYY-MM-DD format.'
MERGE (i)-[:HAS_TRAIT]->(b)