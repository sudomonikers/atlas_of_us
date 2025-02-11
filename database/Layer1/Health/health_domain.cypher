MATCH (n:CoreDomain {name: 'Health'})

MERGE (h0 {name: 'Cardiovascular System'})
SET h0:Health:L1,
    h0.description = 'The system responsible for circulating blood and delivering nutrients throughout the body.'
MERGE (h0)-[:IS_SUB_TYPE]->(n)

MERGE (h1 {name: 'Digestive System'})
SET h1:Health:L1,
    h1.description = 'The system that processes food, extracts nutrients, and expels waste.'
MERGE (h1)-[:IS_SUB_TYPE]->(n)

MERGE (h2 {name: 'Endocrine System'})
SET h2:Health:L1,
    h2.description = 'The system of glands that secrete hormones regulating metabolism and growth.'
MERGE (h2)-[:IS_SUB_TYPE]->(n)

MERGE (h3 {name: 'Exocrine System'})
SET h3:Health:L1,
    h3.description = 'The system that produces secretions via glands for external functions.'
MERGE (h3)-[:IS_SUB_TYPE]->(n)

MERGE (h4 {name: 'Immune System'})
SET h4:Health:L1,
    h4.description = 'The system that defends against infections and foreign invaders.'
MERGE (h4)-[:IS_SUB_TYPE]->(n)

MERGE (h5 {name: 'Integumentary System'})
SET h5:Health:L1,
    h5.description = 'The system comprising the skin and its appendages, providing protection and regulation.'
MERGE (h5)-[:IS_SUB_TYPE]->(n)

MERGE (h6 {name: 'Muscular System'})
SET h6:Health:L1,
    h6.description = 'The system responsible for movement and force generation in the body.'
MERGE (h6)-[:IS_SUB_TYPE]->(n)

MERGE (h7 {name: 'Nervous System'})
SET h7:Health:L1,
    h7.description = 'The system that transmits signals and coordinates bodily functions.'
MERGE (h7)-[:IS_SUB_TYPE]->(n)

MERGE (h8 {name: 'Renal System'})
SET h8:Health:L1,
    h8.description = 'The system that filters blood and removes waste products through urine.'
MERGE (h8)-[:IS_SUB_TYPE]->(n)

MERGE (h9 {name: 'Reproductive System'})
SET h9:Health:L1,
    h9.description = 'The system involved in producing offspring.'
MERGE (h9)-[:IS_SUB_TYPE]->(n)

MERGE (h10 {name: 'Respiratory System'})
SET h10:Health:L1,
    h10.description = 'The system responsible for gas exchange, supplying oxygen and removing carbon dioxide.'
MERGE (h10)-[:IS_SUB_TYPE]->(n)

MERGE (h11 {name: 'Skeletal System'})
SET h11:Health:L1,
    h11.description = 'The system that provides structural support and protection for the body.'
MERGE (h11)-[:IS_SUB_TYPE]->(n)