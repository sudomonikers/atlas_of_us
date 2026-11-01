# Topics Graph
The Topics graph is everything a Person can know, understand, believe or value. It's called Topics rather than
Knowledge because some of it isn't provable, or is false. Many people believe false things, and our job is to
understand people, not to verify what they believe.

It's split into Topics and Ideas. An Idea is a **single** piece of information, and a Topic includes many of them. Most
of the graph's value is in how Ideas link: what you need to understand before you can understand an Idea, and how one
Idea can be part of many Topics. "Treat others as you wish to be treated" is shared by Christianity, Islam and Kant's
categorical imperative. Entropy in thermodynamics and entropy in information theory have the same structure but are
different Ideas, linked as analogous. Ideas, like Topics, exist once.

How topics get into the graph and get filled out is in `documentation/architecture/topics.md`.

## Idea types

| Type | What it is | The tell | Stance a person takes | Examples |
|---|---|---|---|---|
| concept | Something you grasp, well or poorly. Not true or false | "Is this a thing you understand, rather than a statement you could affirm or deny?" | Understanding | Entropy, recursion, supply and demand, a sonnet's form |
| claim | Something true or false, whether or not it's provable | "Could you put 'It is true that…' in front of it?" | Understanding and belief | "The earth is flat," "energy is conserved" |
| norm | An ought. You endorse it or you don't | "Does it tell you what to do, not what is?" | Understanding and endorsement | "Keep your promises," "don't waste food" |
| value | A good you hold, with more or less intensity | "Is it a thing held dear?" | Holding it | Loyalty, autonomy, tradition |

## Bloom levels
Every topic has six levels, the depths someone can know it to:

| rank | Level | Someone at it |
| --- | --- | --- |
| 1 | Remember | Recalls the topic's facts, terms and basic Ideas |
| 2 | Understand | Explains the Ideas in their own words and says how they connect |
| 3 | Apply | Uses the Ideas in a new situation |
| 4 | Analyze | Breaks the topic into its parts and sees how they relate |
| 5 | Evaluate | Judges claims and arguments in the topic, and defends a position |
| 6 | Create | Puts the Ideas together into something new |

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| Topic | `id`, `name` (unique), `description`, `aliases`, `vector`, `status` | A subject. `status` is `stub`, `filling`, `ready` or `failed`, as for a skill |
| BloomLevel | `name`, `rank` (1 to 6), `description`, `observableSigns`, `exampleEvidence`, `version`, `trust` | One of a topic's six levels, with a second label for which (`Remember` to `Create`) |
| Idea | `id`, `name`, `type`, `description`, `vector` | A single piece of information. Names repeat across fields, so only the `id` is unique |
| Evidence | `id`, `kind` (`note` or `file`), `text` or `fileName`, `contentType`, `size`, `key`, `createdAt` | Something a person offers to show their level in a topic or a skill. A file's bytes live in the evidence bucket under `key` |

## Relationships within Topics

| Relationship | From → To | Directed? | Loops allowed? | Meaning |
| --- | --- | --- | --- | --- |
| HAS_LEVEL | Topic → BloomLevel | yes | n/a | A topic's six levels |
| SUBTOPIC_OF | Topic → Topic | yes | no | A part of a broader field (Organic Chemistry → Chemistry) |
| INCLUDES | Topic → Idea | yes | n/a | An Idea in the topic. An Idea can be in many topics |
| REQUIRES_KNOWLEDGE | Idea → Idea | yes | no | A prerequisite: understand this one first. The only link learning paths follow |
| PRECEDES | Idea → Idea | yes | no | Order in time, for events and history. Kept apart from prerequisites |
| SPECIALIZES | Idea → Idea | yes | no | A narrower form of a broader Idea (Rawls's justice → Justice) |
| CONTRADICTS | Idea — Idea | no | n/a | Ideas that can't both hold. How the graph holds falsehoods without taking sides |
| ANALOGOUS_TO | Idea — Idea | no | yes | The same structure in a different field. Not the same Idea |
| SUPPORTS | Idea → Idea | yes | yes | Evidence or reasoning that leans toward another Idea |

Skills point into Topics with REQUIRES_KNOWLEDGE from a DreyfusLevel to a BloomLevel (see the Skills graph).

## People and topics

| Relationship | To | Key properties | Meaning |
| --- | --- | --- | --- |
| ENGAGES_TOPIC | BloomLevel | `since`, `updatedAt` | How deeply they know the topic, by their own account. One per topic |
| GAVE_EVIDENCE, ABOUT | Evidence → Topic | | Their evidence for their level. It's about the topic, not the level, so it stays when they move up |
| UNDERSTANDS | Idea | | They grasp it. Any type |
| BELIEVES | Idea (claim) | `conviction` (−1 to +1), `warrant`, `centrality`, `reason`, `since` | Whether they think it's true. Separate from understanding it. 0 conviction is undecided, which is different from no relationship |
| ENDORSES | Idea (norm) | `intensity`, `reason` | Commitment to an ought |
| HOLDS | Idea (value) | `intensity`, `since` | Holding a value dear |
| CURIOUS_ABOUT | Idea or Topic | `intensity` | Interest, which doubles as a learning goal |
| INTIMIDATED_BY, BORED_BY | Idea or Topic | `intensity` | How they feel about it, as for skills |

## Example
```cypher
(cot:Topic {name: "Chess Opening Theory"})-[:HAS_LEVEL]->(cotEvaluate:BloomLevel:Evaluate {rank: 5})
(semi:Topic {name: "Semi-Open Games"})-[:SUBTOPIC_OF]->(cot)

(rules:Idea {name: "Rules of chess", type: "concept"})
(center:Idea {name: "Center control", type: "concept"})-[:REQUIRES_KNOWLEDGE]->(rules)
(sic:Idea {name: "Sicilian Defense", type: "concept"})-[:REQUIRES_KNOWLEDGE]->(center)
(naj:Idea {name: "Najdorf Variation", type: "concept"})-[:SPECIALIZES]->(sic)
(castle:Idea {name: "Castle early", type: "norm"})
(kguns:Idea {name: "The King's Gambit is unsound", type: "claim"})-[:CONTRADICTS]-(kgsound:Idea {name: "The King's Gambit is fully playable", type: "claim"})
(semi)-[:INCLUDES]->(sic), (semi)-[:INCLUDES]->(naj), (cot)-[:INCLUDES]->(castle), (cot)-[:INCLUDES]->(kguns)

// Andrew knows the theory well enough to judge it, and thinks the King's Gambit is unsound
(andrew)-[:ENGAGES_TOPIC]->(cotEvaluate)
(andrew)-[:UNDERSTANDS]->(naj)
(andrew)-[:BELIEVES {conviction: 0.8, warrant: "engine and practice"}]->(kguns)
(andrew)-[:GAVE_EVIDENCE]->(:Evidence {kind: "note", text: "Prepared a Najdorf repertoire for my club's league"})-[:ABOUT]->(cot)

// Lulu disagrees, holds the principles firmly, and wants to learn the Najdorf
(lulu)-[:BELIEVES {conviction: 0.6}]->(kgsound)
(lulu)-[:ENDORSES {intensity: 0.9, reason: "They keep me out of trouble"}]->(castle)
(lulu)-[:CURIOUS_ABOUT {intensity: 0.8}]->(naj)
```
