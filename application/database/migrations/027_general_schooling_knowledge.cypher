// =============================================================================
// Atlas of Us — Migration 027: General Schooling Knowledge
//
// The collection of topics most people were taught at school is General
// Schooling Knowledge, by the id general-schooling-knowledge. This gives the
// existing collection that id and name, keeping its topics. Run it, then
// collections/general_schooling_knowledge.cypher.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (c:Collection {id: "common-knowledge"})
SET c.id = "general-schooling-knowledge",
    c.name = "General Schooling Knowledge";
