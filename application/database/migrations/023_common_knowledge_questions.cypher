// =============================================================================
// Atlas of Us — Migration 023: common knowledge questions, written again
//
// The first common knowledge questions were written from each topic's name
// alone, and too many tested how a topic is taught rather than the topic, or
// had more than one defensible answer. This deletes them, with everyone's
// answers to them and whether they said they know each topic, so
// collections/common_knowledge.cypher writes the new ones. Run it, then the
// seed.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (q:QuizQuestion)
DETACH DELETE q;

MATCH (:Person)-[r:RECALLED]->(:Topic)
DELETE r;
