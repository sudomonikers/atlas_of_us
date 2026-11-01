# How the Topics Module Works

This explains how the topics sub-graph gets filled out: where topics come from, how each one is kept unique, how a topic
gets its levels and its Ideas, how skills come to need topics, and the events it publishes. It works the same way as
the Skills module (`skills.md`), and this page covers where it differs. For the graph itself, read
`../data_model/topics/topics.md`.

## The approach
- **A curated backbone.** The graph starts from ESCO's knowledge entries and the fields of study they're filed under.
- **Stubs, filled on demand.** Every topic starts as a stub. An LLM writes its six Bloom levels and its **Ideas** only
  when someone needs it.
- **Two resolvers.** Every topic name goes through a topic resolver, so each topic exists once. Every Idea a fill names
  goes through an Idea resolver, so an Idea shared by several topics exists once too.
- **Events.** Every meaningful change is published (see `events.md`).

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/topics/` | Topics Explained, the Topics Explorer, the topic and Idea pages, My Knowledge |
| API | `application/apis/atlas-api/src/domains/topics/` | Search, the gates, reading topics and Ideas, asking for a fill, placing yourself and your evidence |
| Topic resolver | `application/apis/atlas-shared/src/topics/` | Decides whether a topic is new and where it sits. Shared by the API and the jobs |
| Jobs | `application/apis/atlas-jobs/` | Fill a topic's levels and Ideas, resolve Ideas, link skill levels to the topics they need |
| Evidence | `application/apis/atlas-api/src/evidence/` | Notes and files a person gives about a topic or a skill, shared by every module |
| Evidence bucket | `application/infrastructure/evidence.tf` | Private storage for files given as evidence |
| Taxonomy import | `application/database/topics_import/` | Asks the API for each ESCO field and knowledge entry |

## Where topics come from
Every topic is created in one of three ways, and all of them go through the topic resolver:

1. **The taxonomy import.** ESCO's knowledge entries, filed under UNESCO's fields of study, asked for through the API
   broader first. The resolver, not ESCO's filing, decides where each topic goes, and nothing in the graph ties a topic
   to ESCO. ESCO leans towards what jobs need, so subjects such as religions, philosophies and hobbies come in through
   users and skills.
2. **A user asking for a topic we don't have,** through the gates.
3. **The skill requirements job naming a topic a skill needs.** It's created as a stub, and filled only when someone
   needs it.

## Topic identity
Topics have the same statuses as skills (`stub`, `filling`, `ready`, `failed`), and every topic has its six Bloom
levels from the moment it's created.

**The topic resolver** works like the skills resolver (see "The resolver" in `skills.md`), with "subtopic of" in place
of "a kind of". A subtopic is a part of a broader field, as Organic Chemistry is of Chemistry. Fields that sit next to
each other, or where one helps you understand the other, are separate topics with no link.

**The gates** match the skills gates, with a topic being a subject a person knows about. Something a person does is a
skill, how they tend to be is a personality trait, and what their body is like is a physical attribute. Beliefs,
religions, philosophies and theories are topics, whether they're true or not, and every real subject passes the
screen.

## Filling a stub
1. The API marks the topic `filling` and publishes `TopicFillRequested`.
2. The fill job writes **each of the six Bloom levels**, as a skill's levels are written, and the topic's **core
   Ideas**: concepts, claims, norms or values, each after the Ideas it requires. Contested claims are named with their
   rivals as separate claims.
3. **Each Idea is resolved** against the Ideas we have: the **same** Idea is reused, an **analogous** one (the same
   structure in another field, such as entropy in physics and in information theory) is linked, and anything else is
   new.
4. The levels, Ideas and the links between them are written together, and any link between Ideas that would make a
   loop of prerequisites is taken out.
5. It publishes `IdeaCreated` for each new Idea and `TopicFilled` for the topic, or `TopicFillFailed`.

## Skill requirements
A job reacts to `SkillFilled` from the Skills module. One LLM call names the knowledge each of the skill's levels needs,
how deeply as a Bloom level, how much and why. Each name goes through the topic resolver, so it links to a topic we have
or creates a stub, and the skill's level is linked to that Bloom level of the topic. A skill's page then shows the
knowledge each level takes, and each topic shows the skills that need it.

## What the user sees
The Topics page has three views:

- **Topics Explained** says why what you know matters, over a small map of every topic, and walks through the six
  Bloom levels and the four kinds of Idea with one example topic.
- **The Topics Explorer** is one board of every topic, on the shared graph board (see `ADRs/graph_board.md`), the same
  as the Skills Explorer. Expanding a topic shows its Ideas, the topics around it and the skills that need it.
- **My Knowledge** lists the topics the user has placed themselves on.

A topic's page shows its six levels and its Ideas in an order to learn them in. An Idea's page shows the topics it's in
and the Ideas around it, which is how the Ideas topics share show up.

### Placing yourself on a topic
On a `ready` topic, the user reads the levels from Remember up and says which one is them. That's their one
`ENGAGES_TOPIC` to the topic, shown on the topic and on their profile.

They can back it up with **evidence**, notes or files. Evidence is shared by every module: a skill uses the same
service, storage and UI pieces, and each module builds its own walkthrough on them. Files go from the browser straight
to the private evidence bucket, and the API checks them before adding them. Files can be downloaded by their owner, and
by anyone when the owner's profile is public.

## Events
Topics events have the source `atlas.topics`. How they move is in `events.md`.

| Event | When | Who cares |
|---|---|---|
| `TopicCreated` | A topic is created, by any route | Search, admin metrics |
| `TopicFillRequested` | Someone needs a stub filled | The fill job |
| `TopicFilled` | A topic's levels and Ideas are written for the first time | Prerequisites between Ideas in different topics, recommendations |
| `TopicFillFailed` | The fill failed | Admin metrics, the UI |
| `IdeaCreated` | A fill created an Idea | Search, admin metrics |

The Topics module also reacts to `SkillFilled` from Skills.
