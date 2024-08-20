MATCH (ma:L1Domain {name: 'Mental Abilities'})
WITH ma
MERGE (ma)-[:HAS_SUBDOMAIN]->(:L1Domain:Ability {name: 'Creativity', description: ''})