// =============================================================================
// Atlas of Us — Migration 008: design fluency
//
// Fluency of Ideas is measured by Design Fluency, joining five dots into as many
// different designs as can be made in a minute. Animal Naming goes, with its
// readings. Run it once, with physical_norms_seed.cypher, which adds Design
// Fluency.
// =============================================================================

MATCH (m:PhysicalMeasurement {name: "Animal Naming"})
DETACH DELETE m;
