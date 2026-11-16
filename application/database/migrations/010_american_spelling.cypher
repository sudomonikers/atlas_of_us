// =============================================================================
// Atlas of Us — Migration 010: American spelling
//
// The Atlas is written in American English, so Odd Colour Out is Odd Color Out,
// run by the app's `colors` test. The measurement keeps its id, readings and
// norms. Run it once, before physical_norms_seed.cypher, which matches
// measurements by name.
// =============================================================================

MATCH (m:PhysicalMeasurement {name: "Odd Colour Out"})
SET m.name = "Odd Color Out",
    m.test = "colors";
