// =============================================================================
// Atlas of Us — Migration 026: questions for the topics moved to Digital Knowledge
//
// Computer Basics, Internet Safety, Computer Networks and Cybersecurity moved
// from Common Knowledge to Digital Knowledge, and their questions were written
// at a school level that overlaps the other Digital Knowledge topics. This
// deletes their questions, with everyone's answers to them, so
// collections/digital_knowledge.cypher writes the new ones. Run it, then the
// seed.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (t:Topic)-[:HAS_LEVEL]->(:BloomLevel)<-[:TESTS]-(q:QuizQuestion)
WHERE t.id IN ["9aa6648a-3e44-4877-b52a-90d8b593d211", "c3faddc6-1066-489f-8c1b-24f1fd2b59f0",
               "6d29d2fc-1c0d-4699-827c-ee02d5326452", "88aa6d52-23ac-4432-abdb-25cd28d111a6"]
DETACH DELETE q;
