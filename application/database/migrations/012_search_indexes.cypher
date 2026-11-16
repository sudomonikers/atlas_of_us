// =============================================================================
// Atlas of Us — Migration 012: search indexes
//
// The full-text indexes every search runs on, made with the english analyzer,
// so a search finds plurals and possessives of what it names: "allergies" finds
// allergy, and "parkinsons" Parkinson's disease. The skills and topics indexes
// are made again with it, and the physical module's conditions, body functions
// and body parts get theirs (documentation/architecture/physical.md). Neo4j
// fills a new index in the background, and searches by name find nothing in it
// until it's done. Run it before deploying the atlas-api with GET
// /physical/search.
//
// Idempotent: safe to re-run.
// =============================================================================

DROP INDEX skill_names IF EXISTS;
CREATE FULLTEXT INDEX skill_names IF NOT EXISTS FOR (s:Skill) ON EACH [s.name, s.aliases]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};

DROP INDEX topic_names IF EXISTS;
CREATE FULLTEXT INDEX topic_names IF NOT EXISTS FOR (t:Topic) ON EACH [t.name, t.aliases]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};

CREATE FULLTEXT INDEX condition_names IF NOT EXISTS FOR (c:Condition) ON EACH [c.name, c.plainName, c.synonyms, c.everyday]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};

CREATE FULLTEXT INDEX function_names IF NOT EXISTS FOR (f:BodyFunction) ON EACH [f.name, f.includes]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};

CREATE FULLTEXT INDEX part_names IF NOT EXISTS FOR (p:BodyPart) ON EACH [p.name, p.synonyms]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};
