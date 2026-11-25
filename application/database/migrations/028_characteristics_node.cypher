// =============================================================================
// Atlas of Us — Migration 028: Characteristics node
//
// Characteristics are their own sub-graph: each Person's answers are properties
// of one Characteristics node, (Person)-[:HAS_CHARACTERISTICS]->(Characteristics),
// and the questions and choices live in the api. This moves every
// HAS_CHARACTERISTIC answer onto it, then drops the seeded Characteristic nodes
// and their constraints. abilities_characteristics_seed.cypher is gone.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (p:Person)-[h:HAS_CHARACTERISTIC]->(c:Characteristic)
WITH p, collect([c.name, h.value]) AS said, max(h.setAt) AS setAt
MERGE (p)-[:HAS_CHARACTERISTICS]->(n:Characteristics)
SET n += {
      sex: [s IN said WHERE s[0] = "Sex" | s[1]][0],
      handedness: [s IN said WHERE s[0] = "Handedness" | s[1]][0],
      eyeColor: [s IN said WHERE s[0] = "Eye Color" | s[1]][0],
      hairColor: [s IN said WHERE s[0] = "Hair Color" | s[1]][0],
      bloodType: [s IN said WHERE s[0] = "Blood Type" | s[1]][0]
    },
    n.updatedAt = setAt;

MATCH (c:Characteristic)
DETACH DELETE c;

DROP CONSTRAINT characteristic_name_unique IF EXISTS;
DROP CONSTRAINT characteristic_id_unique IF EXISTS;
