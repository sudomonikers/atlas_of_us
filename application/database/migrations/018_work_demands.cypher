// =============================================================================
// Atlas of Us — Migration 018: work demands
//
// The constraints for the physical demands of work (WorkDemand), such as
// standing or loud noise, which occupations have and which strain body
// functions and parts (documentation/data_model/occupations/occupations.md).
// Run it before onet_occupations_seed.cypher.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT work_demand_id IF NOT EXISTS FOR (d:WorkDemand) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT work_demand_onet_id IF NOT EXISTS FOR (d:WorkDemand) REQUIRE d.onetId IS UNIQUE;
