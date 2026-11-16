// =============================================================================
// Atlas of Us — Migration 013: credits
//
// Credits pay for Atlas's written summaries (documentation/architecture/credits.md).
// Every account made before them gets the 3 a new account starts with, each
// Stripe checkout is kept once by its id, and the chip-in setting the credits
// replace is dropped. Run it before deploying the atlas-api with /credits.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT checkout_id IF NOT EXISTS FOR (c:Checkout) REQUIRE c.id IS UNIQUE;

MATCH (p:Person) WHERE p.credits IS NULL
SET p.credits = 3;

MATCH (c:PersonConfig) WHERE c.supportAsked IS NOT NULL
REMOVE c.supportAsked;
