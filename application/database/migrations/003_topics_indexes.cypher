// =============================================================================
// Atlas of Us — Migration 003: topics indexes
//
// The constraints and indexes the topics module searches and resolves with
// (documentation/architecture/topics.md). Run it before deploying the
// atlas-api with the topics routes and before running the topics import.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE;

// two requests for the same new topic MERGE onto one node
CREATE CONSTRAINT topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE;

// Idea names repeat across fields (Thermodynamic Entropy and Information Entropy are two Ideas), so only the id is unique
CREATE CONSTRAINT idea_id IF NOT EXISTS FOR (i:Idea) REQUIRE i.id IS UNIQUE;

// search by name and alias
CREATE FULLTEXT INDEX topic_names IF NOT EXISTS FOR (t:Topic) ON EACH [t.name, t.aliases];

// search and the resolvers by meaning. Dimensions match the embedding model (amazon.titan-embed-text-v2:0)
CREATE VECTOR INDEX topic_vector IF NOT EXISTS FOR (t:Topic) ON t.vector
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}};

CREATE VECTOR INDEX idea_vector IF NOT EXISTS FOR (i:Idea) ON i.vector
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}};
