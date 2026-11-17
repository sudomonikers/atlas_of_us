// =============================================================================
// Atlas of Us — Migration 014: no ability ratings
//
// A person's place on an ability comes only from their readings of the
// measurements that show it (documentation/architecture/physical.md). Their
// own ratings of themselves on an ability's examples are dropped, along with
// any place on an ability that came from one: a place that came from a rating
// has the ability's own name in its basis. Run it before deploying the
// atlas-api without /physical/abilities/{id}/rating.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (:Person)-[r:RATED_ABILITY]->(:Ability)
DELETE r;

MATCH (:Person)-[h:HAS_ABILITY]->(a:Ability)
WHERE a.name IN h.basis
DELETE h;
