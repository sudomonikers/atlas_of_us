// =============================================================================
// Atlas of Us — Migration 001: stored ids
//
// Every id the app hands out (in the login token, to the UI, on the jobs queue) used
// to be a Neo4j elementId. Neo4j only promises an elementId within one transaction:
// a deleted node's id can be given to a new one, and a dump/restore can renumber
// everything. So anything whose id leaves the database now carries its own id
// property, a uuid set when it's created, and the code matches on that instead.
//
// This gives every existing node and relationship that needs one an id, adds the
// constraints, and clears out scoring jobs that were queued with old ids. Run it
// before deploying the atlas-api and atlas-jobs that use the new ids. Old code
// keeps working after it runs, since it ignores the id property.
//
// Idempotent: safe to re-run. Only things without an id get one.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Backfill ids
// -----------------------------------------------------------------------------

MATCH (n:Person) WHERE n.id IS NULL
CALL { WITH n SET n.id = randomUUID() } IN TRANSACTIONS OF 1000 ROWS;

MATCH (n:PersonalityTrait) WHERE n.id IS NULL
CALL { WITH n SET n.id = randomUUID() } IN TRANSACTIONS OF 1000 ROWS;

MATCH (n:PersonalityScenario) WHERE n.id IS NULL
CALL { WITH n SET n.id = randomUUID() } IN TRANSACTIONS OF 1000 ROWS;

MATCH (n:PersonalityScenarioQuestion) WHERE n.id IS NULL
CALL { WITH n SET n.id = randomUUID() } IN TRANSACTIONS OF 1000 ROWS;

MATCH ()-[a:ANSWERED]->() WHERE a.id IS NULL
CALL { WITH a SET a.id = randomUUID() } IN TRANSACTIONS OF 1000 ROWS;


// -----------------------------------------------------------------------------
// 2. Scoring jobs queued with old ids
// -----------------------------------------------------------------------------

// a JobRunning's elementId is on the queued message, so the new atlas-jobs can't find
// it to clean up. The person can just score again
MATCH (j:JobRunning) WHERE j.id IS NULL
DETACH DELETE j;


// -----------------------------------------------------------------------------
// 3. Constraints (also in auth_constraints.cypher and the personality seeds, for a
//    fresh database)
// -----------------------------------------------------------------------------

CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT personalitytrait_id_unique IF NOT EXISTS
FOR (n:PersonalityTrait) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT personalityscenario_id_unique IF NOT EXISTS
FOR (n:PersonalityScenario) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT personalityscenarioquestion_id_unique IF NOT EXISTS
FOR (n:PersonalityScenarioQuestion) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT answered_id_unique IF NOT EXISTS
FOR ()-[a:ANSWERED]-() REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT jobrunning_id_unique IF NOT EXISTS
FOR (n:JobRunning) REQUIRE n.id IS UNIQUE;
