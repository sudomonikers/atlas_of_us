// =============================================================================
// Atlas of Us — Migration 015: explore reading in the ui
//
// The reading at the top of Personality's and Abilities' Explore tabs,
// what the Big Five and the O*NET abilities are, and the overview of each
// ability area, is ui copy. Drops the nodes that held it and their
// constraints. Run it with the atlas-api that serves /personality/domains.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (n)
WHERE n:PersonalityModel OR n:AbilityModel OR n:AbilityArea
DETACH DELETE n;

DROP CONSTRAINT personalitymodel_name_unique IF EXISTS;
DROP CONSTRAINT abilitymodel_name_unique IF EXISTS;
DROP CONSTRAINT abilityarea_category_unique IF EXISTS;
