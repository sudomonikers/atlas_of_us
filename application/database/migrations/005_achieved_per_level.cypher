// =============================================================================
// Atlas of Us — Migration 005: an ACHIEVED per level reached
//
// A person now has an ACHIEVED to each level they've reached in a skill, the
// highest being their level now, each with when they said it (recordedAt). Gives
// every existing ACHIEVED its recordedAt and drops since and updatedAt. Run it
// when deploying the atlas-api with the timeline route.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (:Person)-[a:ACHIEVED]->(:DreyfusLevel)
SET a.recordedAt = coalesce(a.recordedAt, a.updatedAt, a.since, datetime())
REMOVE a.since, a.updatedAt;
