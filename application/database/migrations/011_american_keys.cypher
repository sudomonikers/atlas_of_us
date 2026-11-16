// =============================================================================
// Atlas of Us — Migration 011: American spelling in seed keys
//
// Eye Color and Hair Color are characteristics, and the_programs and the_favor
// are questions in The Committee and The Feud. Each one becomes a single node
// under its American name, keeping its id and every answer. Where a seed run
// already made the American node next to the British one, the answers move onto
// it and the British node goes. Run it once, before
// physical_characteristics_seed.cypher and personality_scenarios_seed.cypher.
// =============================================================================

// Characteristics: answers move onto the American node where both exist
UNWIND [["Eye Colour", "Eye Color"], ["Hair Colour", "Hair Color"]] AS r
MATCH (old:Characteristic {name: r[0]}), (new:Characteristic {name: r[1]})
MATCH (p:Person)-[h:HAS_CHARACTERISTIC]->(old)
MERGE (p)-[n:HAS_CHARACTERISTIC]->(new)
ON CREATE SET n.value = h.value, n.setAt = h.setAt
DELETE h;

UNWIND [["Eye Colour", "Eye Color"], ["Hair Colour", "Hair Color"]] AS r
MATCH (old:Characteristic {name: r[0]}), (:Characteristic {name: r[1]})
DETACH DELETE old;

UNWIND [["Eye Colour", "Eye Color"], ["Hair Colour", "Hair Color"]] AS r
MATCH (old:Characteristic {name: r[0]})
SET old.name = r[1];

MATCH (:Person)-[h:HAS_CHARACTERISTIC]->(:Characteristic)
WHERE h.value = "Grey"
SET h.value = "Gray";

// Scenario questions: answers move onto the American question where both exist
UNWIND [["the_programmes", "the_programs"], ["the_favour", "the_favor"]] AS r
MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion {key: r[0]}),
      (s)-[:HAS_QUESTION]->(new:PersonalityScenarioQuestion {key: r[1]})
MATCH (p:Person)-[a:ANSWERED]->(old)
WHERE NOT (p)-[:ANSWERED]->(new)
CREATE (p)-[b:ANSWERED]->(new)
SET b = properties(a);

UNWIND [["the_programmes", "the_programs"], ["the_favour", "the_favor"]] AS r
MATCH (s:PersonalityScenario)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion {key: r[0]}),
      (s)-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key: r[1]})
DETACH DELETE old;

UNWIND [["the_programmes", "the_programs"], ["the_favour", "the_favor"]] AS r
MATCH (old:PersonalityScenarioQuestion {key: r[0]})
SET old.key = r[1];
