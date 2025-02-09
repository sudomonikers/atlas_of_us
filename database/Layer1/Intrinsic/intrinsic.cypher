MERGE (i {name: 'Intrinsic'})
SET i:L1:Intrinsic

MERGE (i)-[HAS_TRAIT]->(h:Intrinsic {name: 'Height'})