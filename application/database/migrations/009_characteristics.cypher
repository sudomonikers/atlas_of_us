// =============================================================================
// Atlas of Us — Migration 009: characteristics
//
// A person's sex and which hand they use are characteristics, answered with
// HAS_CHARACTERISTIC, like eye color and blood type. The sex they were compared
// with and a handedness kept on the Person move onto them. Run it once, after
// physical_characteristics_seed.cypher, which adds the characteristics.
// =============================================================================

MATCH (p:Person) WHERE p.handedness IS NOT NULL
MATCH (c:Characteristic {name: "Handedness"})
MERGE (p)-[h:HAS_CHARACTERISTIC]->(c)
SET h.value = CASE p.handedness WHEN "left" THEN "Left" WHEN "right" THEN "Right" ELSE "Both" END,
    h.setAt = datetime()
REMOVE p.handedness;

MATCH (p:Person) WHERE p.normSex IS NOT NULL
MATCH (c:Characteristic {name: "Sex"})
MERGE (p)-[h:HAS_CHARACTERISTIC]->(c)
SET h.value = CASE p.normSex WHEN "male" THEN "Male" ELSE "Female" END,
    h.setAt = datetime()
REMOVE p.normSex;
