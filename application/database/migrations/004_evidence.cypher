// =============================================================================
// Atlas of Us — Migration 004: evidence
//
// The constraint on the evidence people give for where they are with a topic
// (documentation/architecture/topics.md). Run it before deploying the
// atlas-api with the evidence routes.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT evidence_id IF NOT EXISTS FOR (e:Evidence) REQUIRE e.id IS UNIQUE;
