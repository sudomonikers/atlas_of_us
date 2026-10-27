# How the Topics Module Works

This explains how the topics sub-graph gets filled out: where topics come from, how each one is kept unique, how a topic
gets its levels and its Ideas, how skills come to need topics, and the events it publishes. It works the same way as
the Skills module (`skills.md`), and this page covers where it differs. For the graph itself, read
`../data_model/topics/topics.md`.

## The approach in one paragraph
We start from ESCO's knowledge entries and the fields of study they're filed under, so the graph has a backbone on day
one. Every topic starts as a cheap **stub**, and gets its six Bloom levels and its **Ideas** written by an LLM only when
someone asks for it to be filled. Every name, from ESCO, a user or a skill, goes through a **resolver** so each topic
exists once, and every Idea a fill names goes through another, so an Idea shared by several topics exists once too.
Every meaningful change is published as an **event**.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| API | `application/apis/atlas-api/src/domains/topics/mod.rs` | Search, asking for a topic, reading one, and asking for a fill |
| Gates | `application/apis/atlas-api/src/domains/topics/gates.rs` | Normalize and classify what a user asks for, and screen out nonsense |
| Topic resolver | `application/apis/atlas-shared/src/topics/resolver.rs` | Decides whether a topic name is the same as, a subtopic of, or broader than existing topics, and creates stubs. It's in the crate the API and atlas-jobs share (see `ADRs/atlas_shared_crate.md`) |
| Fill job | `application/apis/atlas-jobs/src/events/topic_fill_requested/topics.rs` | Writes a stub's Bloom levels and Ideas with Bedrock |
| Idea resolver | `application/apis/atlas-jobs/src/ideas.rs` | Decides whether each Idea a fill names is one we already have |
| Skill requirements job | `application/apis/atlas-jobs/src/events/skill_filled/topics.rs` | Links a filled skill's levels to the topics they need |
| Event bus | `application/infrastructure/events.tf` | The `TopicFillRequested-Topics` and `SkillFilled-Topics` rules and queues (see `events.md`) |
| Migration | `application/database/migrations/003_topics_indexes.cypher` | The constraints, the full-text index and the vector indexes |
| Taxonomy import | `application/database/topics_import/` | Asks the API for each ESCO field and knowledge entry, broader ones first |

### Models
- **The gates, the topic resolver's judge and the Idea resolver's judge** use the fast model, `SMALL_MODEL` in
  `atlas-shared/src/bedrock.rs` (Claude Haiku 4.5).
- **The fill job and the skill requirements job** use the atlas-jobs model, `BEDROCK_MODEL_ID` in `jobs_lambda.tf`
  (Claude Sonnet 4.6), each in one forced tool call.
- **Embeddings** are Amazon Titan Text Embeddings V2 at 1024 dimensions, the same as skills. A topic's vector is an
  embedding of `"<name>. <description>. Also known as <alias>, <alias>."`, and an Idea's of `"<name>. <description>"`.

### The API
All routes are under `/api/topics`. Asking and filling need a logged in user.

| Route | What it does |
|---|---|
| `GET /search?q=` | The closest topics, by name and alias through the `topic_names` full-text index and by meaning through `topic_vector`, combined by reciprocal rank fusion, each with the broader topics it's a subtopic of |
| `POST /` `{query}` | Asks for a topic we don't have: runs the gates and the resolver, and returns an `outcome` of `not_a_topic` (with the `kind` it is), `rejected` (with a `reason`), `existing` (the topic it means) or `created` (the new stub) |
| `GET /{id}` | A topic with its six levels, its Ideas (each with its `type` and the Ideas it `requires`), and its `broader` and `narrower` topics |
| `POST /{id}/fill` | Asks for a `stub` or `failed` topic to be filled, and returns its status. A topic that is already `filling` or `ready` is left as it is, so it's safe to call every time a topic is opened |

## Where topics come from
A Topic node is created in three ways, and every one goes through the topic resolver:

1. **The taxonomy import.** Our starting backbone. It asks the API for each topic, the same way a user does.
2. **A user asking for something we don't have,** through the gates.
3. **The skill requirements job naming a topic a skill needs.** Created as a stub, and filled only when someone asks.

### The taxonomy: ESCO
ESCO's "knowledge" entries are the topics half of its skills taxonomy: about 3,000 subjects such as "French history",
"enterprise risk management" and "types of barley". ESCO files them under the fields of study of ISCED-F, UNESCO's
classification of education, from broad fields ("natural sciences, mathematics and statistics") through narrow ones
("physical sciences") to detailed ones ("physics").

The import (`application/database/topics_import/`) asks the API for the fields and then the entries, broader ones
first, so the resolver finds a topic's broader topics when it places it. The resolver, not ESCO's filing, decides where
each topic goes, and the graph keeps nothing that ties a topic to ESCO. ESCO's knowledge leans towards what jobs need,
and subjects such as religions, philosophies and hobbies come in through users and through skills.

## Topic identity

### Statuses
The same as a skill's:

| Status | Meaning |
|---|---|
| `stub` | Exists, can be found and linked to, but its levels are empty and it includes no Ideas |
| `filling` | A fill has been requested and the job is working on it |
| `ready` | Its levels and Ideas are written |
| `failed` | The fill job gave up. Asking again puts it back to `filling` |

Every topic has its six Bloom levels from the moment it's created, as a skill has its five Dreyfus levels.

### The resolver
The topic resolver works the way the skills resolver does (see "The resolver" in `skills.md`), with topics in place of
skills and `SUBTOPIC_OF` in place of `SPECIALIZATION_OF`:

1. **Find candidates:** an exact match on name or alias, ignoring case, is `same` straight away. Otherwise the eight
   nearest topics by vector similarity, scoring at least 0.69 (`MIN_SCORE`), are the candidates.
2. **Judge:** the fast model gives a short reason, then the candidate it's the `same` as, if any. Otherwise it lists the
   candidates it's a subtopic of (`broader`, only the most specific) and the ones that are subtopics of it
   (`narrower`). A subtopic is a part of the broader field ("Organic Chemistry" of "Chemistry"). Fields that sit next
   to each other, or where one is needed to understand the other, are separate topics with no link.
3. **Act:** `same` uses the existing topic. Otherwise a stub is created with its six levels and its links in one
   transaction, a narrower topic's direct link to one of the stub's broader topics now runs through the stub, and a
   link that would make a loop is left out. A uniqueness constraint on the name means two requests for the same new
   topic `MERGE` onto one node, and only the first publishes `TopicCreated`.

### Asking for a topic we don't have
The gates are one structured call to the fast model, before anything is written:

1. **Normalize:** turn what was typed into the name a course or an encyclopedia would give the subject ("types of
   barley" becomes "Barley Varieties").
2. **Classify:** is it a subject a person knows about? Something a person does is a skill, how they tend to be is a
   personality trait, and what their body is like is a physical attribute, and the API returns that `kind`. A subject
   that is also something people do (Python) is a topic here. Beliefs, religions, philosophies and theories are topics,
   whether they are true or not.
3. **Screen:** reject gibberish, jokes and slurs. Every real subject passes, including contested, false, violent and
   sexual ones.
4. **Resolve:** run the topic resolver on the normalized name.

## Filling a stub
1. `POST /{id}/fill` sets the topic to `filling` and publishes `TopicFillRequested`. If the publish fails, the topic
   goes back to the status it had.
2. The fill job (`TopicFillRequested-Topics`) makes one Bedrock call that writes:
   - **each of the six Bloom levels,** with a description, **observable signs** and **example evidence**, as a skill's
     levels have;
   - **the topic's core Ideas,** 8 to 25 of them, each with a name, its type (concept, claim, norm or value) and a
     description, in an order where each comes after the Ideas it requires. Contested claims are named with their
     rivals, as separate claims.
3. **Resolve the Ideas.** Each Idea is embedded and compared with the five nearest existing Ideas scoring at least
   0.69. One call to the fast model judges every Idea that has candidates: `same` as a candidate, meaning someone who
   understands one understands the other in the same field, or `analogous` to one, the same structure in another
   field, such as entropy in thermodynamics and in information theory. An Idea with no candidates is new.
4. **Write, in one query:** the levels' content (version 1, `provisional`), every Idea the topic `INCLUDES`, reused or
   new, an `ANALOGOUS_TO` link for each analogous Idea, the `REQUIRES_KNOWLEDGE` links between the topic's Ideas, and
   status `ready`. Two Ideas that resolve to the same existing Idea are one Idea in the topic.
5. **Check for loops.** REQUIRES_KNOWLEDGE between Ideas has no loops. The topic's own Ideas can't make one, since each
   requires only Ideas before it, but a reused Idea brings in the links other topics gave it. Once the write is
   committed, each new link is checked, and taken out again when the Idea it requires leads back to it. Checking after
   the write means two fills closing a loop at the same moment can't both miss it.
6. **Publish** `IdeaCreated` for each new Idea and `TopicFilled` for the topic. A fill that fails sets the topic to
   `failed` and publishes `TopicFillFailed`.

Idea names aren't unique, so two fills running at the same moment can each create the same new Idea. The two show up
as Ideas with near-identical vectors.

## Skill requirements
The skill requirements job (`SkillFilled-Topics`) reacts to `SkillFilled`, for a `ready` skill whose levels need no
topics yet:

1. **Name.** One Bedrock call reads the skill and its five levels and names the topics each level needs: the knowledge
   the skill itself needs, named as a course would name it, each with a description. Each one carries the level of the
   skill it starts at, how deeply it's needed as a Bloom level (`bloom`), a `strength` and a `reason`. It sits on the
   lowest level it applies to, and is named again higher up only when the Bloom level or the strength changes.
2. **Resolve.** Each name goes through the topic resolver. A topic we have is linked to. A new one becomes a stub and
   publishes `TopicCreated`, and isn't filled.
3. **Write** each requirement from the skill's level to the topic's Bloom level, as
   `(level)-[:REQUIRES_KNOWLEDGE {strength, reason}]->(Bloom level of the topic)`, the same way `REQUIRES_SKILL` points
   at a level of another skill. A stub has its Bloom levels from the moment it's created, so a new topic can be linked
   to straight away. A skill's level and a topic's level are in different sub-graphs, so the link can't make a loop.

A skill's page shows the knowledge each level takes, carried up from the levels below it, the same way it shows the
skills and personality it takes.

## Events
Topics events have the source `atlas.topics`, and name a topic by `topicId` and an Idea by `ideaId`. How they move is in
`events.md`.

| Event | When | Who cares |
|---|---|---|
| `TopicCreated` | A Topic node is created, by any of the three routes | Search indexing, admin metrics |
| `TopicFillRequested` | Someone asked for a stub to be filled | The Topics fill job (`TopicFillRequested-Topics`) |
| `TopicFilled` | A topic's levels and Ideas are written for the first time | Prerequisites between Ideas in different topics, recommendations |
| `TopicFillFailed` | The fill job gave up | Admin metrics, the UI (through polling) |
| `IdeaCreated` | A fill created an Idea | Search indexing, admin metrics |

The Topics module also reacts to `SkillFilled` from Skills, with `SkillFilled-Topics`.
