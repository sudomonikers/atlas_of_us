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
| Topic | `id`, `name` (unique), `description`, `aliases`, `vector`, `status`, `prominence` | A subject. `status` is `stub`, `filling`, `ready` or `failed`, as for a skill. `prominence` is how central the subject is to what people know, from 1 to 5: 1 is among the 10 most prominent subjects, 2 the 100, 3 the 1,000, 4 the 10,000 and 5 the 50,000. It's on the topics a taxonomy ranks |
| BloomLevel | `name`, `rank` (1 to 6), `description`, `observableSigns`, `exampleEvidence`, `version`, `trust` | One of a topic's six levels, with a second label for which (`Remember` to `Create`) |
| Idea | `id`, `name`, `type`, `description`, `vector` | A single piece of information. Names repeat across fields, so only the `id` is unique |
| Evidence | `id`, `kind` (`note` or `file`), `text` or `fileName`, `contentType`, `size`, `key`, `createdAt` | Something a person offers to show their level in a topic or a skill. A file's bytes live in the evidence bucket under `key` |
| Collection | `id` (unique), `name` (unique), `description` | A group of topics to go through in order, such as Common Knowledge. It isn't a topic: it has no levels, and nobody is placed on it |
| QuizQuestion | `id` (unique), `prompt`, `choices`, `answer`, `explanation`, `createdAt` | A multiple-choice question that shows one level of a topic. `answer` is the index of the right one of its four `choices`, and `explanation` says why it's right |

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
| TESTS | QuizQuestion → BloomLevel | yes | n/a | The level of its topic the question shows |
| CONTAINS | Collection → Topic | yes | n/a | A topic in the collection. `order` is where it comes. A topic can be in many collections |

Skills point into Topics with REQUIRES_KNOWLEDGE from a DreyfusLevel to a BloomLevel (see the Skills graph), and
occupations with TAKES_KNOWLEDGE from an Occupation to a BloomLevel (see the Occupations graph).

## People and topics

| Relationship | To | Key properties | Meaning |
| --- | --- | --- | --- |
| ENGAGES_TOPIC | BloomLevel | `since`, `updatedAt` | How deeply they know the topic, by their own account. One per topic |
| GAVE_EVIDENCE, ABOUT | Evidence → Topic | | Their evidence for their level. It's about the topic, not the level, so it stays when they move up |
| ANSWERED_QUIZ | QuizQuestion | `choice`, `correct`, `answeredAt` | How they answered a question. `choice` is the index of the choice they picked, or missing when they said they didn't know |
| UNDERSTANDS | Idea | | They grasp it. Any type |
| BELIEVES | Idea (claim) | `conviction` (−1 to +1), `warrant`, `centrality`, `reason`, `since` | Whether they think it's true. Separate from understanding it. 0 conviction is undecided, which is different from no relationship |
| ENDORSES | Idea (norm) | `intensity`, `reason` | Commitment to an ought |
| HOLDS | Idea (value) | `intensity`, `since` | Holding a value dear |
| CURIOUS_ABOUT | Idea or Topic | `intensity` | Interest, which doubles as a learning goal |
| INTIMIDATED_BY, BORED_BY | Idea or Topic | `intensity` | How they feel about it, as for skills |

## Testing what someone knows
Any topic can be tested. Each of its levels can have a question that TESTS it, and a right answer at a level stands for
every level below it. A person answers a topic's questions from the highest level down, and the first they get right
places them on the topic at that level with ENGAGES_TOPIC, unless they're at a higher level already. A topic that's
filled gets a question on each of its Remember, Understand and Apply levels when its fill is asked for.

A collection groups topics to go through in order, such as Common Knowledge and Life Knowledge, each topic tested at
Remember, Understand and Apply (see `documentation/architecture/collections.md`). A collection's `id` and `name` are
unique (migration `025_collections.cypher`).

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

// The Pythagorean Theorem is 20th in the Common Knowledge collection, with a question at its Apply level
(:Collection {name: "Common Knowledge"})-[:CONTAINS {order: 20}]->(pythagoras:Topic {name: "Pythagorean Theorem"})
(pythagoras)-[:HAS_LEVEL]->(pythagorasApply:BloomLevel:Apply {rank: 3})
(question:QuizQuestion {
  prompt: "A ladder's base is 5 m from a wall and it reaches 12 m up the wall. How long is the ladder?",
  choices: ["17 m", "13 m", "11 m", "about 10.9 m"], answer: 1,
  explanation: "5² + 12² = 169, and the square root of 169 is 13."
})-[:TESTS]->(pythagorasApply)

// Andrew gets it right, which places Andrew at Apply
(andrew)-[:ANSWERED_QUIZ {choice: 1, correct: true}]->(question)
(andrew)-[:ENGAGES_TOPIC]->(pythagorasApply)

// Lulu disagrees, holds the principles firmly, and wants to learn the Najdorf
(lulu)-[:BELIEVES {conviction: 0.6}]->(kgsound)
(lulu)-[:ENDORSES {intensity: 0.9, reason: "They keep me out of trouble"}]->(castle)
(lulu)-[:CURIOUS_ABOUT {intensity: 0.8}]->(naj)
```
