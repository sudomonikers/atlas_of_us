// =============================================================================
// Atlas of Us — Migration 024: general schooling knowledge Apply questions, written again
//
// Many Apply questions asked what would happen or why, which shows
// Understand. This deletes every Apply question, with everyone's answers to
// it, so collections/general_schooling_knowledge.cypher writes the new ones, each asking what
// to do or to carry out one of the topic's methods. Run it, then the seed.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (q:QuizQuestion)-[:TESTS]->(:BloomLevel {rank: 3})
DETACH DELETE q;
