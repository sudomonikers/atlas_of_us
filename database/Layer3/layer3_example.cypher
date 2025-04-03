//PEOPLE LEVEL NODES (Layer 3) 
//The basic node here is Person, but each Person node may have relationships with other
//layer 3 specific nodes, like personal achievements or notable history noes
MATCH (p:Person) 
WHERE p.username = 'sudomoniker'
WITH p

MERGE (p)-[:HAS_SKILL {strength: 100}]-(n)
