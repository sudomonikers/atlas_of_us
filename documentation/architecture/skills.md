# How the Skills Module Works

This explains how the skills sub-graph gets filled out: where skills come from, how new skills get created and fleshed
out, how people place themselves on them, how the community keeps them honest, and how the rest of the Atlas hears about
it. For the graph itself, read `../data_model/skills/skills.md`.

## The problem
There are more skills in the world than we could ever write by hand, new ones appear all the time, and people describe
the same skill in many different ways. The skills graph is only useful if each skill exists **once**. If "Knife Skills"
and "Knife Handling" are separate nodes, two people with the same ability never meet in the graph, and everything built
on top of it (who you could become, job matching, recommendations) gets worse.

So the hard part of this module is **identity**: deciding whether a skill is new, what it is the same as, and where it
sits relative to everything else. The design is built around that.

## The approach
- **A curated backbone.** The graph starts from ESCO, an existing skills taxonomy, so it has structure on day one.
- **Stubs, filled on demand.** Every skill starts as a cheap stub. An LLM writes its five Dreyfus levels only when
  someone actually needs it, so cost follows use.
- **Gates and a resolver.** Anything a user types is checked before it can become a node, and every new skill, from
  any source, goes through one resolver that decides whether we already have it.
- **Community review.** Generated content is provisional until people endorse it, and changes to it are proposals that
  only replace the main version once the community accepts them.
- **Events.** Every meaningful change is published, so other modules (Personality, Topics, Physical Attributes, Jobs)
  react to skills without the Skills module knowing they exist.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/skills/` | The Skills Explorer, the skill page, placing yourself on a skill, My Skills |
| API | `application/apis/atlas-api/src/domains/skills/` | Search, the gates, placing yourself and your evidence, publishing events |
| Resolver | `application/apis/atlas-shared/src/skills/` | Decides whether a skill is new and where it sits. Shared by the API and the jobs, so both run the same logic |
| Jobs | `application/apis/atlas-jobs/src/events/` | Fill a stub's levels, link levels to the skills they need, screen proposals |
| Event bus | `application/infrastructure/events.tf` | The Atlas event bus, its archive, and a queue per job |
| Taxonomy import | `application/database/skills_import/` | Asks the API for each ESCO skill |

LLM calls run on Bedrock: a fast model for the gates and the resolver, and a stronger one for writing levels and
naming prerequisites. Similarity comes from embeddings of each skill's name, description and aliases (see
`ADRs/skills_embeddings.md`).

## Skill identity

### How skills relate to each other
There are three relationships between skills, and keeping them apart matters:

- **Prerequisite:** lives on the **levels**, not the skills. Competent Cooking needs Advanced Beginner Knife Skills.
  This is the main web between skills: what each one needs and what it leads to.
- **Specialization:** Sourdough Baking is a kind of Baking. Only when everyone with the narrower skill has a form of
  the broader one. A skill can be a kind of several skills, and most are a kind of one or none.
- **Same skill:** one node, with the other names as its aliases.

How alike two skills are lives in their embeddings, and is worked out when it's needed.

### Statuses

| Status | Meaning |
|---|---|
| `stub` | Exists, can be found and linked to, but its levels are empty |
| `filling` | Its levels are being written |
| `ready` | Its levels are written and people can place themselves on it |
| `failed` | Writing its levels failed. Asking again retries it |

Every skill has its five level nodes **from the moment it's created**, even as a stub. So anything, a prerequisite or a
requirement from another module, can link to a stub's levels straight away, and the link lives in the graph instead of
in a message waiting to be delivered.

### The resolver
The resolver answers one question: given a name, is it the **same as** a skill we have, and if it's **new**, which
skills is it a kind of, and which are kinds of it?

1. **Find candidates:** an exact name or alias match is the same skill. Otherwise the nearest skills by embedding are
   the candidates.
2. **Judge:** a fast model compares the name with the candidates and says which it's the same as, or which it's
   broader and narrower than.
3. **Act:** use the existing skill, or create a stub placed between its broader and narrower skills.

A stub is created with its levels and links in one transaction, and the name is unique, so two people asking for the
same new skill at once get one node.

## Where skills come from
Every skill is created in one of three ways, and all of them go through the resolver, so none can create a duplicate:

1. **The taxonomy import.** It asks the API for each ESCO skill the way a user would, broader skills first so the
   resolver can place narrower ones under them. Only ESCO's skills become Skills; its knowledge entries go to Topics.
   ESCO is only a source: nothing in the graph ties a skill to it. It's weak on hobbies and everyday skills, which come
   in through users.
2. **A user asking for a skill we don't have.** It goes through the gates first (below).
3. **The prerequisites job naming a skill we don't have.** It's created as a stub, and isn't filled until someone
   needs it.

### The gates
Before anything is written, what the user typed goes through four gates. The first three are one call to a fast model,
and the fourth is the resolver:

1. **Normalize** it into a skill name ("being good at excel" becomes "Microsoft Excel").
2. **Classify** it: a personality trait, a topic or a physical attribute is sent to the module that owns it.
3. **Screen** out gibberish, jokes and slurs. Every real skill passes, however niche.
4. **Resolve** it: show the skill they meant, or create the new stub.

## Filling a stub
A stub is filled the first time someone needs it: they open it or ask for it.

1. The API marks it `filling` and publishes `SkillFillRequested`.
2. The fill job writes each of the five levels: a description, **observable signs** that would show someone is there,
   example evidence, and what it takes to reach the next level. Observable signs are what make evidence checkable.
3. It marks the skill `ready`, with provisional content, and publishes `SkillFilled`.

### Prerequisites
The prerequisites job reacts to `SkillFilled`. It has an LLM name the skills each level directly needs, with the level
of each, how strongly and why. Each name goes through the resolver, so it links to a skill we have or creates a stub. A
link that would make a loop of prerequisites is taken out again.

Requirements on anything other than skills are written by the modules that own them, reacting to the same
`SkillFilled`: Personality links each level to the traits it takes (see `personality.md`) and Topics to the knowledge
it needs (see `topics.md`).

## What the user sees
The Skills page has two views:

- **The Skills Explorer** is one board of every skill (on the shared graph board, see `ADRs/graph_board.md`).
  Zoomed out, skills cluster under their broadest field; zoomed in, they have names and links. Search combines name
  matching with embedding similarity. Selecting a skill shows its levels under the board, and expanding it shows what
  it links to: the skills, traits and topics it needs. A level picker narrows the links to what that level needs.
- **My Skills** lists the skills the user has placed themselves on, grouped by level.

A guide on the page walks through what skills are, the five levels and how to use the Explorer.

### Placing yourself on a skill
On a `ready` skill, the user reads the levels from Novice up and says which one is them, and optionally when they got
there. That's their one `ACHIEVED` to the skill. They can back it up with evidence, notes or files, which works the same
as for a topic (see `topics.md`). Their level shows on the skill, in My Skills, and on their profile.

## Community review
Level content is shared by everyone placed on that skill. If one user could rewrite "Competent", everyone else's claim
of it would change meaning. So no single user, and no single LLM call, changes the main version on their own.

- **Endorsing.** Freshly written content is version 1, provisional, and can be claimed right away. People who think
  it's right endorse it, and with enough weighted endorsement it becomes established.
- **Proposing a change.** A user who thinks a level is wrong writes a proposal against it, which doesn't touch the main
  version. The proposal job screens it with an LLM. One that passes is opened for others to endorse or oppose, and once
  it has enough weighted support it becomes the level's new version. The old one is kept, and `SkillLevelRevised` is
  published.
- **Weighting.** The people best placed to judge a level are those who've shown they're at or above it, so their
  endorsements count most. The weights and thresholds are configuration.
- **Claims remember their version.** A claim records the version of the level it was made against. When the level is
  revised, the person is told the criteria changed so they can re-confirm.

## Events
Every meaningful change is published as an event, so other modules can react without the Skills module calling them.

- **One bus for the whole Atlas.** Every module publishes to it.
- **One queue per job,** named `<event>-<module>`, so one job's backlog, replay or failures never hold up another's,
  even when several react to the same event.
- **An archive.** A new module can replay past events to backfill, instead of a one-off migration.
- **Thin events.** An event says what happened and to which nodes; consumers read the graph for the details, so they
  always see the current state.

| Event | When | Who cares |
|---|---|---|
| `SkillCreated` | A skill is created, by any route | Topics, search, admin metrics |
| `SkillFillRequested` | Someone needs a stub filled | The fill job |
| `SkillFilled` | A skill's levels are written for the first time | The prerequisites job, Personality, Topics, Physical Attributes, Jobs |
| `SkillFillFailed` | Writing the levels failed | Admin metrics, the UI |
| `SkillProposalSubmitted` | A user proposed a change | The proposal job |
| `SkillLevelRevised` | A proposal became the main version | Anything that read the old level, such as people's claims |
| `SkillLevelClaimed` | A person placed themselves on a level | Profile, recommendations, evidence verification |

### Reliability
- **The graph is the source of truth,** and events are published after the write. A failed publish that would leave a
  skill stuck puts it back as it was, so the next person to need it asks again.
- **Every consumer is idempotent,** since a message can arrive more than once.
- **Events carry a schema version,** so their shape can change without breaking older consumers.
