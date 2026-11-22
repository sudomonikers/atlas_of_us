// =============================================================================
// Atlas of Us — Migration 025: collections
//
// A Collection groups topics to go through in order, each one it CONTAINS with
// its `order` (documentation/data_model/topics/topics.md). General Schooling Knowledge is
// one, which collections/general_schooling_knowledge.cypher writes. This adds the constraints and
// removes the order each topic on the general schooling knowledge list carried itself.
// Run it, then the seed.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT collection_id IF NOT EXISTS FOR (c:Collection) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT collection_name IF NOT EXISTS FOR (c:Collection) REQUIRE c.name IS UNIQUE;

MATCH (t:Topic) WHERE t.commonKnowledgeOrder IS NOT NULL
REMOVE t.commonKnowledgeOrder;
