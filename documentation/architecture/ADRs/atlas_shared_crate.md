# ADR: One crate for the code the API and atlas-jobs share

**Status:** Accepted, 26 Oct 2026
**Where it lives:** `application/apis/atlas-shared/`, a library crate that `atlas-api` and `atlas-jobs` each depend on
by path (`atlas-shared = { path = "../atlas-shared" }`)

## Context
The resolver decides whether a skill name is one we already have, and creates a stub when it isn't (see "The resolver"
in `../skills.md`). Each skill existing once depends on it. Two things run it:

- **The API,** on what a user asks for, after the gates.
- **The prerequisites job** in atlas-jobs, on every skill a filled level needs.

Both have to give the same answer for the same name, or the prerequisites job would make duplicates that the API never
would. The resolver calls a fast model and the embedding model on Bedrock, and a new stub publishes `SkillCreated` to the
event bus, so that code is needed in both places too.

## Decision
The code both crates run lives once, in `atlas-shared`:

| Module | What it is |
|---|---|
| `bedrock` | `answer` (a forced tool call on `SMALL_MODEL`, Claude Haiku 4.5) and `embed` (Titan Text Embeddings V2) |
| `events` | The `Bus` and `publish`, which adds `eventId`, `schemaVersion` and `occurredAt` and logs the event when there's no bus |
| `skills::resolver` | `resolve`, `create_stub`, `embedding_text` and `MIN_SCORE` |
| `topics::resolver` | The same for topics, used by the API's topic gates and the `SkillFilled-Topics` job, with `BLOOM_LEVELS` in `topics` |

Functions take the graph, the Bedrock client and the bus they need as arguments, so they work the same in either
crate. Code only one crate runs stays in it: the gates in the API (`domains/skills/gates.rs`), and atlas-jobs' own
`bedrock::invoke`, which retries when throttled and keeps the `BedrockCutoff` node for the long Sonnet calls.

The crates are separate packages with their own `Cargo.lock`, not a Cargo workspace, so each still builds and deploys
on its own. Each `deploy.sh` mounts `apis/` into the build container and builds from the crate's folder inside it, so
the path dependency is there to build.

## Consequences
- A change to the resolver reaches both the API and atlas-jobs, and both are deployed for it to take effect everywhere.
- A new piece of shared code goes in `atlas-shared` only once a second crate needs it.
