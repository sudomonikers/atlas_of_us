// =============================================================================
// Atlas of Us — Migration 006: occupations
//
// The constraints and index for O*NET's occupations
// (documentation/data_model/physical_attributes/physical_attributes.md). Skills
// find the occupations like them by meaning, to ground what their levels take.
// Run it before onet_occupations_seed.cypher.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE CONSTRAINT occupation_id IF NOT EXISTS FOR (o:Occupation) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT occupation_onet_soc IF NOT EXISTS FOR (o:Occupation) REQUIRE o.onetSoc IS UNIQUE;

// the occupations like a skill, by meaning. Dimensions match the embedding model (amazon.titan-embed-text-v2:0)
CREATE VECTOR INDEX occupation_vector IF NOT EXISTS FOR (o:Occupation) ON o.vector
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}};
