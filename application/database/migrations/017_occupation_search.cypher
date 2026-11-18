// =============================================================================
// Atlas of Us — Migration 017: occupation search
//
// The full-text index that searching for an occupation by title runs on, over
// its title and other titles, made with the english analyzer as every search
// index is (012_search_indexes.cypher). Neo4j fills a new index in the
// background, and searches by title find nothing in it until it's done. Run it
// before deploying the atlas-api with GET /occupations/search.
//
// Idempotent: safe to re-run.
// =============================================================================

CREATE FULLTEXT INDEX occupation_titles IF NOT EXISTS FOR (o:Occupation) ON EACH [o.title, o.alternateTitles]
  OPTIONS {indexConfig: {`fulltext.analyzer`: 'english'}};
