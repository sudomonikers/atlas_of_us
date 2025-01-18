MERGE (h {name: 'Health'})
SET h:Health
WITH h

MERGE (h)-[:HAS_SYSTEM]->(c:Health {name: 'Cardiovascular System'})
MERGE (h)-[:HAS_SYSTEM]->(d:Health {name: 'Digestive System'})
MERGE (h)-[:HAS_SYSTEM]->(endo:Health {name: 'Endocrine System'})
MERGE (h)-[:HAS_SYSTEM]->(exo:Health {name: 'Exocrine System'})
MERGE (h)-[:HAS_SYSTEM]->(i:Health {name: 'Immune System'})
MERGE (h)-[:HAS_SYSTEM]->(inte:Health {name: 'Integumentary System'})
MERGE (h)-[:HAS_SYSTEM]->(m:Health {name: 'Muscular System'})
MERGE (h)-[:HAS_SYSTEM]->(n:Health {name: 'Nervous System'})
MERGE (h)-[:HAS_SYSTEM]->(r:Health {name: 'Renal System'})
MERGE (h)-[:HAS_SYSTEM]->(rep:Health {name: 'Reproductive System'})
MERGE (h)-[:HAS_SYSTEM]->(res:Health {name: 'Respiratory System'})
MERGE (h)-[:HAS_SYSTEM]->(s:Health {name: 'Skeletal System'})