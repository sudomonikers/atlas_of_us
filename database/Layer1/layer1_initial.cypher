//BASIC INDIVIDUAL POSSIBILITIES (Layer 1)
MERGE (p:CoreDomain {name: 'Individual Possibilities'})
WITH p
MERGE (p)-[:HAS_DOMAIN]->(:CoreDomain {name: 'Health', description: 'Health of the body, including physical, mental, and emotional health.'})
MERGE (p)-[:HAS_DOMAIN]->(:CoreDomain {name: 'Knowledge Bases', description: 'The many knowledge bases it is possible to know.'})
MERGE (p)-[:HAS_DOMAIN]->(:CoreDomain {name: 'Beliefs', description: 'The many beliefs it is possible to believe in.'})
MERGE (p)-[:HAS_DOMAIN]->(:CoreDomain {name: 'Pursuits', description: 'Activities and interests pursued for enjoyment or personal development.'})
MERGE (p)-[:HAS_DOMAIN]->(:CoreDomain {name: 'Personality', description: 'Nodes relating to a person\'s personality.'})