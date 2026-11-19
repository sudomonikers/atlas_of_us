// =============================================================================
// Atlas of Us — Migration 019: occupations people add
//
// People can add an occupation O*NET doesn't have, which is `filling` while
// its modules work out what it takes, then `ready`
// (documentation/architecture/occupations.md). Every occupation has a status,
// so O*NET's are ready, and a title that's unique, which the resolver relies
// on to keep each occupation once. Run it before deploying the atlas-api with
// POST /occupations.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (o:Occupation) WHERE o.status IS NULL
SET o.status = 'ready';

CREATE CONSTRAINT occupation_title IF NOT EXISTS FOR (o:Occupation) REQUIRE o.title IS UNIQUE;
