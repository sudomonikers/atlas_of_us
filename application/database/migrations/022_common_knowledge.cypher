// =============================================================================
// Atlas of Us — Migration 022: common knowledge
//
// The questions the common knowledge walkthrough asks about its topics, each a
// QuizQuestion that TESTS one of a topic's levels
// (documentation/data_model/topics/topics.md). Run it
// before collections/common_knowledge.cypher.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT quiz_question_id IF NOT EXISTS FOR (q:QuizQuestion) REQUIRE q.id IS UNIQUE;
