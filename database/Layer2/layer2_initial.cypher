//ENVIRONMENT LEVEL NODES (Layer 2)
MERGE (e:L2Domain {name: 'Environment'})
WITH e 
MERGE (e)-[:HAS_SUBDOMAIN]->(:L2Domain {name: 'Societies'})
MERGE (e)-[:HAS_SUBDOMAIN]->(:L2Domain {name: 'Locations'});