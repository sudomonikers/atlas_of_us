// =============================================================================
// Atlas of Us — Migration 002: skills indexes
//
// The constraints and indexes the skills module searches and resolves with
// (documentation/data_model/skills/skills.md). Run it before deploying the
// atlas-api with skill search and the gates.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;

// two requests for the same new skill MERGE onto one node
CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE;

// search by name and alias
CREATE FULLTEXT INDEX skill_names IF NOT EXISTS FOR (s:Skill) ON EACH [s.name, s.aliases];

// search and the resolver by meaning. Dimensions match the embedding model (amazon.titan-embed-text-v2:0)
CREATE VECTOR INDEX skill_vector IF NOT EXISTS FOR (s:Skill) ON s.vector
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}};
