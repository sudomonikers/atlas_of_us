# ADR: Amazon Titan Text Embeddings V2 for skill search and the resolver

**Status:** Accepted, 24 Oct 2026
**Where it lives:** `application/apis/atlas-api/src/bedrock.rs` (`embed`), and the `skill_vector` index in
`application/database/migrations/002_skills_indexes.cypher`

## Context
The skills module needs text embeddings in two places (see `../skills.md`):

- **Search.** What a user types is embedded and compared against every skill's vector, alongside a full-text search
  of names and aliases. The vector half is what finds "Public Speaking" for "talking in front of a crowd", where no
  words match.
- **The resolver.** A new skill's name and description are embedded to find the eight nearest existing skills, which
  a fast model then judges as the same skill, a broader one, or neither. A skill missing from those eight can't be
  matched, so it becomes a duplicate.

Both run while a user waits, inside the 60 second API request. The graph will start with about 14,000 skills from ESCO
and grow from there. There are no real users yet, so traffic is small and bursty.

We wanted to know whether an open source model, hosted by us, would be cheaper or better than Titan, and whether
all-MiniLM-L6-v2, which an earlier EC2 setup served, is good enough.

## Decision
Skills are embedded with **Amazon Titan Text Embeddings V2** on Bedrock, at **1024 dimensions**, called from the API.

- A skill's vector is an embedding of `"<name>. <description>. Also known as <alias>, <alias>."`, and a search is an
  embedding of what was typed. Titan takes no prompts, so both are embedded the same way.
- The `skill_vector` index is 1024 dimensions, cosine similarity.

## Evidence

### Retrieval quality
We scored six models on 80 skill searches against 170 skills, measuring the vector half of search alone. The 170 skills
are 60 targets and 110 deliberately close distractors (Snowboarding next to Skateboarding, Bass Guitar next to Guitar,
Videography next to Video Editing). The searches are paraphrases ("haggling for a better price"), misspellings
("pyhton"), narrower skills ("pastry lamination") and resolver-style "name. description" inputs. The local models ran
as Q8_0 GGUF files on llama.cpp.

| Model | Dims | Right skill first | In the top 5 | In the top 8 | MRR |
|---|---|---|---|---|---|
| EmbeddingGemma-300M | 768 | 0.91 | 0.99 | 1.00 | 0.948 |
| Qwen3-Embedding-0.6B | 1024 | 0.89 | 0.99 | 0.99 | 0.928 |
| **Titan Text Embeddings V2** | 1024 | 0.86 | 0.97 | 0.97 | 0.907 |
| nomic-embed-text-v1.5 | 768 | 0.85 | 0.99 | 0.99 | 0.903 |
| bge-small-en-v1.5 | 384 | 0.80 | 0.94 | 0.94 | 0.865 |
| all-MiniLM-L6-v2 | 384 | 0.78 | 0.93 | 0.94 | 0.839 |

- Each search is 1.25 points, so the top four are within a few searches of each other. Titan's two misses ("react
  hooks" and "latte art") ranked 44th and 25th.
- MiniLM and bge-small miss on meaning, which the full-text half can't recover: MiniLM ranked Negotiation 60th for
  "haggling for a better price", with Grilling first.
- Every model put the right skill in the resolver's eight candidates for all 15 resolver-style inputs.
- The set is small and written by us. It separates the weak models from the strong ones, but not the strong ones from
  each other.

### Cost
At $0.02 per million tokens, Titan costs about $0.16 per million searches, and about $0.02 to embed all of ESCO.
EmbeddingGemma on Lambda would cost about $10 per million searches, and an always-on EC2 instance about $13 a month.
At any traffic we expect, Titan is the cheapest.

### EmbeddingGemma on Lambda
We built and deployed EmbeddingGemma-300M on Lambda: llama.cpp's server with the model baked into a 469 MB container
image, behind the Lambda Web Adapter, at 3,538 MB (2 vCPUs).

- **Warm, it was fast:** 12 to 16 ms per search inside the function.
- **Cold, it was unusable.** The first call after deploying timed out: the model load passed Lambda's 10 second init
  limit, Lambda restarted the init inside the invoke, and the invoke hit its 30 second timeout. When six new instances
  started at once, five passed the 10 second limit and one started in 2.8 seconds.
- **The time was in reading the model,** not in llama.cpp. The load stalled on the 334 MB weights while Lambda fetched
  the image's uncached chunks, and the same load took 1.3 seconds once they were cached. Lambda's image cache is per
  availability zone and drops images that go unused, so a low-traffic function keeps meeting cold reads.

## Consequences
- **No embedding service to run.** The API calls Bedrock directly, with no container image, ECR repository or extra
  Lambda, and nothing has a cold start of its own.
- **Search and the resolver depend on Bedrock's availability and on Titan staying offered.** If Titan is retired, every
  skill has to be re-embedded with its replacement and the index rebuilt at the new size. With about 14,000 skills that
  costs cents.
- **Quality is a few searches behind the best open source model** on our test set. The full-text half of search, the
  resolver's judge, and aliases recorded from users cover most of that gap.
- **Bedrock's model catalog decides what's available.** It already blocked Claude Haiku 5.5 on this account, so a model
  we want may not be offered.

## Alternatives considered
- **EmbeddingGemma-300M on Lambda.** The best quality on our test, private, and close to free at our traffic. Rejected
  for its cold starts (see above). The ways round them were each a cost Titan doesn't have: loading the model from S3
  into `/tmp` at init (a bucket, a startup script, and still a few seconds per cold start), or keeping one instance
  warm with provisioned concurrency (about $15 to $31 a month).
- **An open source model on EC2.** No cold starts, about $13 a month, and a server to patch, monitor and secure. The
  earlier MiniLM setup served port 8080 publicly with no authentication.
- **all-MiniLM-L6-v2.** The smallest and cheapest to host, and the weakest at the paraphrases search exists for.
- **Qwen3-Embedding-0.6B.** As accurate as EmbeddingGemma, and about 1.5 seconds per search on one CPU with its
  instruction prompt, too slow for search on Lambda.
- **Running a model inside the API Lambda.** It would put the model load on every API cold start and make the API a
  container image too.
