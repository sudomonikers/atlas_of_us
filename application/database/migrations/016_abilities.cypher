// =============================================================================
// Atlas of Us — Migration 016: Abilities
//
// The module about a person's body and mind is Abilities. Renames its
// measurement label to Measurement, with its constraints, and the properties a
// Person and their PersonConfig keep for it: the summary Atlas writes and
// whether they've been through the story that opens it. Run it with the
// atlas-api and atlas-jobs that serve /abilities.
//
// Idempotent: safe to re-run.
// =============================================================================

DROP CONSTRAINT physicalmeasurement_name_unique IF EXISTS;
DROP CONSTRAINT physicalmeasurement_id_unique IF EXISTS;

MATCH (m:PhysicalMeasurement)
SET m:Measurement
REMOVE m:PhysicalMeasurement;

CREATE CONSTRAINT measurement_name_unique IF NOT EXISTS
FOR (m:Measurement) REQUIRE m.name IS UNIQUE;
CREATE CONSTRAINT measurement_id_unique IF NOT EXISTS
FOR (m:Measurement) REQUIRE m.id IS UNIQUE;

MATCH (p:Person)
WHERE p.physicalSummary IS NOT NULL OR p.physicalSummaryInput IS NOT NULL OR p.physicalSummaryAt IS NOT NULL
   OR p.physicalSummaryAskedAt IS NOT NULL OR p.physicalSummaryFailedAt IS NOT NULL OR p.physicalSummaryCharged IS NOT NULL
SET p.abilitiesSummary = coalesce(p.abilitiesSummary, p.physicalSummary),
    p.abilitiesSummaryInput = coalesce(p.abilitiesSummaryInput, p.physicalSummaryInput),
    p.abilitiesSummaryAt = coalesce(p.abilitiesSummaryAt, p.physicalSummaryAt),
    p.abilitiesSummaryAskedAt = coalesce(p.abilitiesSummaryAskedAt, p.physicalSummaryAskedAt),
    p.abilitiesSummaryFailedAt = coalesce(p.abilitiesSummaryFailedAt, p.physicalSummaryFailedAt),
    p.abilitiesSummaryCharged = coalesce(p.abilitiesSummaryCharged, p.physicalSummaryCharged)
REMOVE p.physicalSummary, p.physicalSummaryInput, p.physicalSummaryAt, p.physicalSummaryAskedAt,
       p.physicalSummaryFailedAt, p.physicalSummaryCharged;

MATCH (c:PersonConfig)
WHERE c.physicalIntroSeen IS NOT NULL
SET c.abilitiesIntroSeen = coalesce(c.abilitiesIntroSeen, c.physicalIntroSeen)
REMOVE c.physicalIntroSeen;
