MERGE (kb {name: 'Knowledge Bases'})
SET kb:KnowledgeBases

MERGE (ns {name: 'Natural Sciences'})
SET ns:KnowledgeBases:NaturalSciences, ns.description = 'The systematic study of the physical and natural world through observation and experimentation.'
MERGE (kb)-[:HAS_SUB_BASE]->(ns)

MERGE (ssh {name: 'Social Sciences & Humanities'})
SET ssh:KnowledgeBases:SocialSciencesHumanities, ssh.description = 'The study of human society and culture, focusing on understanding human behavior, relationships, and cultural expressions.'
MERGE (kb)-[:HAS_SUB_BASE]->(ssh)

MERGE (ast {name: 'Applied Sciences & Technology'})
SET ast:KnowledgeBases:AppliedSciencesTechnology, ast.description = 'The practical application of scientific knowledge to solve real-world problems and develop new technologies.'
MERGE (kb)-[:HAS_SUB_BASE]->(ast)

MERGE (pp {name: 'Practical & Professional'})
SET pp:KnowledgeBases:PracticalProfessional, pp.description = 'Knowledge and skills related to specific professions and practical activities, emphasizing hands-on experience and professional practice.'
MERGE (kb)-[:HAS_SUB_BASE]->(pp)

MERGE (so {name: 'Social & Organizational'})
SET so:KnowledgeBases:SocialOrganizational, so.description = 'The study of social structures, organizations, and the dynamics within them, aiming to understand and improve social and organizational functioning.'
MERGE (kb)-[:HAS_SUB_BASE]->(so)

MERGE (pe {name: 'Personal & Experiential'})
SET pe:KnowledgeBases:PersonalExperiential, pe.description = 'Knowledge derived from personal experiences and individual learning, focusing on personal growth and self-improvement.'
MERGE (kb)-[:HAS_SUB_BASE]->(pe)

MERGE (mk {name: 'Meta-Knowledge'})
SET mk:KnowledgeBases:MetaKnowledge, mk.description = 'Knowledge about the nature, scope, and limitations of knowledge itself, including the study of how knowledge is acquired and validated.'
MERGE (kb)-[:HAS_SUB_BASE]->(mk)