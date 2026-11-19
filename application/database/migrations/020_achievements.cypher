// =============================================================================
// Atlas of Us — Migration 020: achievements
//
// A person's noteworthy achievements, such as an award, a certification or a
// result they can point to, each an Achievement that DEMONSTRATES the skills
// and topics it shows (documentation/data_model/achievements/achievements.md).
// Importing a resume adds them. Run it before deploying the atlas-api that
// confirms achievements from a resume.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT achievement_id IF NOT EXISTS FOR (a:Achievement) REQUIRE a.id IS UNIQUE;
