// =============================================================================
// Atlas of Us — Migration 028: no scene clocks
//
// Personality scenes no longer run a real clock (documentation/architecture/ADRs/
// personality_no_scene_clocks.md), so answers stop recording where it stood.
// This removes clockSeconds, clockLeft and clockRanOut from every ANSWERED.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (:Person)-[a:ANSWERED]->(:PersonalityScenarioQuestion)
WHERE a.clockSeconds IS NOT NULL OR a.clockLeft IS NOT NULL OR a.clockRanOut IS NOT NULL
CALL (a) { REMOVE a.clockSeconds, a.clockLeft, a.clockRanOut } IN TRANSACTIONS OF 1000 ROWS;
