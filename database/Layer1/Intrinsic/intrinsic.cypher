MATCH (i {name: 'Intrinsic'})

MERGE (h {name: 'Height'})
SET h:Intrinsic:L1:Trait,
    h.description = 'Length of human from the bottom of the feet to the top of the head in cm.'
MERGE (h)-[:IS_TRAIT_TYPE]->(i)

MERGE (w {name: 'Weight'})
SET w:Intrinsic:L1:Trait,
    w.description = 'Mass of the human in kg.'
MERGE (w)-[:IS_TRAIT_TYPE]->(i)

MERGE (g {name: 'Gender'})
SET g:Intrinsic:L1:Trait,
    g.description = 'Sex of the individual.'
MERGE (g)-[:IS_TRAIT_TYPE]->(i)

MERGE (b {name: 'Birthday'})
SET b:Intrinsic:L1:Trait,
    b.description = 'Date of birth in YYYY-MM-DD format.'
MERGE (b)-[:IS_TRAIT_TYPE]->(i)

MERGE (rs {name: 'Race/Ethnicity'})
SET rs:Intrinsic:L1:Trait,
    rs.description = 'Race or ethnic background. Social construct, but has real-world effects.',
MERGE (rs)-[:IS_TRAIT_TYPE]->(i)
