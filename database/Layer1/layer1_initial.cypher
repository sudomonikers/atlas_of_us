//BASIC INDIVIDUAL POSSIBILITIES (Layer 1)
MERGE (p:L1Domain {name: 'Individual Possibilities'})
WITH p
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Body', description: 'Physical aspect of a person, including genetics, health, and physical abilities'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Mind', description: 'The element of a person that enables them to be aware of the world and their experiences, to think, and to feel'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Habits', description: 'Regular practices or routines that are part of one’s lifestyle'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Abilities', description: 'The capacity to perform various tasks and activities across different domains'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Pursuits', description: 'Activities and interests pursued for enjoyment or professional development'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Personality', description: 'Nodes relating to a person\'s personality.'})
MERGE (p)-[:HAS_SUBDOMAIN]->(:L1Domain {name: 'Instincts', description: ''});







