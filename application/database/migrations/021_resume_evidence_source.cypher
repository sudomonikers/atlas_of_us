// =============================================================================
// Atlas of Us — Migration 021: where resume evidence came from
//
// A resume imported as evidence (documentation/architecture/resume_import.md)
// is marked source: 'resume', so a newer resume replaces it as the evidence
// about what it shows. The resume evidence confirmed before this is the files
// that are evidence about more than one thing, which only a resume import
// makes. Run it before deploying the atlas-api that replaces resume evidence.
//
// It also clears what an import confirmed before then left on the Person:
// the time it was asked for, which made it look still being read and then
// failed, giving back the credit spent on it.
//
// Idempotent: safe to re-run.
// =============================================================================

MATCH (p:Person)-[:GAVE_EVIDENCE]->(e:Evidence)
WHERE e.key IS NOT NULL AND e.source IS NULL
WITH p, e.key AS key, collect(e) AS evidence
WHERE size(evidence) > 1
FOREACH (e IN evidence | SET e.source = 'resume');

MATCH (p:Person)
WHERE p.resumeImportAskedAt IS NOT NULL AND p.resumeImportKey IS NULL
SET p.resumeImportCharged = false
REMOVE p.resumeImportAskedAt, p.resumeImportFailedAt;
