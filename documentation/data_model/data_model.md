# Data Specification For The Atlas Of Us
This is the big one. Most of the app is inside the data. The core idea is that this is a graph database with a huge monstrous-level graph database containing many sub graphs. All that a human can be in contained within this data, as well as all that many many different people are. Because all the data is so interwoven, this is a monolithic database. The rest of this document is broken up into explanations of the various sub graphs and their individual business rules. After each sub graph explanation will be a section on how the various subgraphs interact.

## Ids
Every node or relationship referred to from outside the database (in a login token, the UI, a URL, a job or an event) has an `id`: a uuid set when it's created, unique for its label. Seeded nodes are matched on their natural key, such as a trait's `name`, and keep their `id` when the seed is re-run.

## Individual Possibilities Graphs
The following sections are the core graphs related to all a human can be individually. In each of the graphs we will follow several People to see how they interact with the graph. Here is each person's node, which we will reference for the rest of this document:
```cypher
CREATE (andrew:Person {id: "0b6f3c1e-2d4a-4c8e-9f1a-7e5d2b8c4a10", name: "Andrew Link", username: "sudomoniker"});
CREATE (lulu:Person {id: "9c2e7a4b-5f1d-4e3a-8b6c-1d0f9e8a7b23", name: "Lulu Li", username: "lzy7717"});
```

### Personality Graph
We model a person's personality with the Big Five: Openness, Conscientiousness, Extraversion, Agreeableness and
Neuroticism, each split into six facets as defined by the IPIP-NEO. There is one static node per facet, and a person's
personality is their relationships to those nodes. Each facet node gets an incoming relationship from everyone measured
on it, but queries only use it as an endpoint, so the interesting data is on the relationships. How answers become
scores is in `documentation/architecture/personality.md`.

#### Nodes

| Label | Key properties | What it is |
|---|---|---|
| PersonalityModel | `name`, `overview`, history and limits | The Big Five itself, for the Explore reading material. There is one |
| PersonalityDomain | `key`, `name`, `overview`, `highGood`, `lowGood`, `highWatch`, `lowWatch` | One of the five domains |
| PersonalityTrait | `id`, `name`, `description`, `overview`, `highGood`, `lowGood`, `highWatch`, `lowWatch` | One of the 30 facets, the traits we measure |
| PersonalityScenario | `id`, `name`, `title`, `order` | A scene. `order` is its place in play order, which also sets its scoring batch |
| PersonalityScenarioQuestion | `id`, `key`, `order`, `prompt`, `real_life` | A question in a scene. `key` matches the prompt in the scene's script, the highest `order` is the last question, and `real_life` marks the question about the player's own life |
| JobRunning | `id`, `kind`, `startedAt` | A scoring job in progress for a person, which locks their scenes until it's done |

A Person also carries their personality report, once they're fully scored: `personalityReport`, a JSON string with a
headline, an overview, a paragraph per domain, strengths and things to watch, and `personalityReportAt`.

#### Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_DOMAIN | PersonalityModel → PersonalityDomain | | The model's five domains |
| HAS_FACET | PersonalityDomain → PersonalityTrait | | A domain's six facets |
| INTERACTS_WITH | PersonalityTrait → PersonalityTrait | `description` | How two traits combine, from the first one's point of view |
| HAS_PERSONALITY_TRAIT | Person → PersonalityTrait | `value`, `confidence` | How much of the trait they have, from 0 to 1 with 0.5 typical, and how much their answers say about it. No relationship means unmeasured, not average |
| HAS_QUESTION | PersonalityScenario → PersonalityScenarioQuestion | | A scene's questions |
| ANSWERED | Person → PersonalityScenarioQuestion | `id`, `answer`, `reasoning`, `context`, `facets`, `clockSeconds`, `clockLeft`, `clockRanOut`, `answeredDate`, `scoring`, `contests` | Their answer, with what they saw before it. `scoring` is the evidence the scorer found in it, and `contests` the person's challenges to that evidence, both JSON lists |
| HAS_JOB | Person → JobRunning | | A job running for them |
| REQUIRES_TRAIT | DreyfusLevel → PersonalityTrait | `level`, `strength`, `reason` | A skill level that takes the trait (see the Skills graph) |

#### Example
```cypher
(:PersonalityModel {name: "Big Five"})-[:HAS_DOMAIN]->(:PersonalityDomain {key: "agreeableness"})-[:HAS_FACET]->(c:PersonalityTrait {name: "Cooperation"})

// Andrew is very cooperative, Lulu much less so
(andrew)-[:HAS_PERSONALITY_TRAIT {value: 0.9, confidence: 0.85}]->(c)
(lulu)-[:HAS_PERSONALITY_TRAIT {value: 0.2, confidence: 0.6}]->(c)

(:PersonalityScenario {name: "the_feud", order: 15})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: "the_war", order: 2})
(andrew)-[:ANSWERED {answer: "Knock on his door and suggest a mediator", reasoning: "A fence isn't worth years of not speaking", facets: ["Cooperation", "Anger"],
  scoring: '[{"trait":"Cooperation","evidence":"Looks for neutral ground over a fight they could win","level":0.7,"weight":0.6}]'}]->(q)
```

### Topics Graph
The Topics graph is everything a Person can know, understand, believe or value. It's called Topics rather than
Knowledge because some of it isn't provable, or is false. Many people believe false things, and our job is to
understand people, not to verify what they believe.

It's split into Topics and Ideas. An Idea is a **single** piece of information, and a Topic includes many of them. Most
of the graph's value is in how Ideas link: what you need to understand before you can understand an Idea, and how one
Idea can be part of many Topics. "Treat others as you wish to be treated" is shared by Christianity, Islam and Kant's
categorical imperative. Entropy in thermodynamics and entropy in information theory have the same structure but are
different Ideas, linked as analogous. Ideas, like Topics, exist once.

How topics get into the graph and get filled out is in `documentation/architecture/topics.md`.

#### Idea types

| Type | What it is | The tell | Stance a person takes | Examples |
|---|---|---|---|---|
| concept | Something you grasp, well or poorly. Not true or false | "Is this a thing you understand, rather than a statement you could affirm or deny?" | Understanding | Entropy, recursion, supply and demand, a sonnet's form |
| claim | Something true or false, whether or not it's provable | "Could you put 'It is true that…' in front of it?" | Understanding and belief | "The earth is flat," "energy is conserved" |
| norm | An ought. You endorse it or you don't | "Does it tell you what to do, not what is?" | Understanding and endorsement | "Keep your promises," "don't waste food" |
| value | A good you hold, with more or less intensity | "Is it a thing held dear?" | Holding it | Loyalty, autonomy, tradition |

#### Bloom levels
Every topic has six levels, the depths someone can know it to:

| rank | Level | Someone at it |
| --- | --- | --- |
| 1 | Remember | Recalls the topic's facts, terms and basic Ideas |
| 2 | Understand | Explains the Ideas in their own words and says how they connect |
| 3 | Apply | Uses the Ideas in a new situation |
| 4 | Analyze | Breaks the topic into its parts and sees how they relate |
| 5 | Evaluate | Judges claims and arguments in the topic, and defends a position |
| 6 | Create | Puts the Ideas together into something new |

#### Nodes

| Label | Key properties | What it is |
|---|---|---|
| Topic | `id`, `name` (unique), `description`, `aliases`, `vector`, `status` | A subject. `status` is `stub`, `filling`, `ready` or `failed`, as for a skill |
| BloomLevel | `name`, `rank` (1 to 6), `description`, `observableSigns`, `exampleEvidence`, `version`, `trust` | One of a topic's six levels, with a second label for which (`Remember` to `Create`) |
| Idea | `id`, `name`, `type`, `description`, `vector` | A single piece of information. Names repeat across fields, so only the `id` is unique |
| Evidence | `id`, `kind` (`note` or `file`), `text` or `fileName`, `contentType`, `size`, `key`, `createdAt` | Something a person offers to show their level in a topic or a skill. A file's bytes live in the evidence bucket under `key` |

#### Relationships within Topics

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

#### People and topics

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

#### Example
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

### Skills Graph
Skills are the capabilities a Person has. Andrew may cook at a novice level while Lulu is an expert. Each Skill is its
own node, and each has five levels from the Dreyfus model:

1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

How skills get into the graph, get filled out and get reviewed is in `documentation/architecture/skills.md`.

#### Nodes

| Label | Key properties | What it is |
|---|---|---|
| Skill | `id`, `name` (unique), `description`, `aliases`, `vector`, `status`, `createdDate` | A skill. `status` is `stub`, `filling`, `ready` or `failed`, and `vector` is an embedding of its name, description and aliases |
| DreyfusLevel | `name`, `rank` (1 to 5), `description`, `observableSigns`, `exampleEvidence`, `version`, `trust` | One of a skill's five levels, with a second label for which (`Novice`, `AdvancedBeginner`, `Competent`, `Proficient`, `Expert`). `trust` is `provisional` or `established` |
| SkillProposal | `id`, `reason`, `status`, `rejectionReason`, `createdDate`, `resolvedDate` | A proposed change to one or more of a skill's levels. `status` is `screening`, `rejected`, `open`, `promoted` or `superseded` |
| SkillLevelRevision | `version`, `description`, `observableSigns`, `exampleEvidence`, `nextLevel`, `replacedDate` | A level's old content, kept when a proposal replaces it |
| Evidence | | A note or file backing up a person's level, shared with Topics (see the Topics graph) |

#### Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_LEVEL | Skill → DreyfusLevel | | A skill's five levels |
| NEXT_LEVEL | DreyfusLevel → DreyfusLevel | `description` | What it takes to reach the next level. Versioned with the level it starts from |
| SPECIALIZATION_OF | Skill → Skill | | A kind of a broader skill. Everyone with the narrower skill has a form of the broader one |
| REQUIRES_SKILL | DreyfusLevel → DreyfusLevel | `strength`, `reason` | A level needs a level of another skill |
| REQUIRES_TRAIT | DreyfusLevel → PersonalityTrait | `level`, `strength`, `reason` | A level takes a personality trait. `level` is where on the trait it pulls, above 0.5 for more of it |
| REQUIRES_ABILITY | DreyfusLevel → Ability | `level`, `strength`, `reason` | A level takes an ability. `level` is the percentile it takes, from 0.5 (a typical amount is enough) to 1 |
| REQUIRES_KNOWLEDGE | DreyfusLevel → BloomLevel | `strength`, `reason` | A level needs a topic, to the depth of that Bloom level |
| ACHIEVED | Person → DreyfusLevel | `achievedOn`, `recordedAt`, `levelVersion` | A level they've reached, by their own account: `achievedOn` is the date they gave, `recordedAt` when they said it, and `levelVersion` the version they claimed against |
| GAVE_EVIDENCE, ABOUT | Person → Evidence → Skill | | Their evidence for their level |
| LIKES, DISLIKES, BORED_BY, INTIMIDATED_BY | Person → Skill | `intensity`, `reason`, `timestamp` | How they feel about it, at most one of each. `intensity` is how strongly, above 0 up to 1, and `timestamp` when they first said it. These stack: someone can like and dislike a skill for different reasons. They don't need to be on the skill |
| PRACTICES | Person → Skill | `hoursPerWeek`, `updatedAt` | How many hours a week they practice a skill they're on. 0 says they don't practice it now. It comes off with their levels |
| WANTS_TO_REACH | Person → DreyfusLevel | `setAt`, `by` | A level they want to reach, one per skill, and the date they want it by. It's reached once they have an ACHIEVED to it or a level above, and stays until they clear it |
| DOES_NOT_HAVE | Person → Skill | `date` | They've said they don't have it, so it isn't suggested to them. Placing themselves on it takes this back |
| ENDORSES | Person → DreyfusLevel or SkillProposal | `version`, `date` | They think a level's content, or a proposal, is right. On a level it records the version endorsed |
| OPPOSES | Person → SkillProposal | `date`, `reason` | They think a proposal is wrong |
| PROPOSED | Person → SkillProposal | | Who wrote a proposal |
| PROPOSES_CHANGE_TO | SkillProposal → DreyfusLevel | `baseVersion`, and the new content for the fields it changes | A level a proposal changes, and the version it was written against |
| HAS_REVISION | DreyfusLevel → SkillLevelRevision | | A level's earlier versions |
| REPLACED_BY | SkillLevelRevision → SkillProposal | | The proposal that replaced it |

#### Rules
- **Each skill exists once.** Other names for it are its `aliases`, not other nodes.
- **Every skill has its five levels from the moment it's created,** even as a stub, so anything can link to them
  straight away. A stub's levels have only a `name` and `rank`, and no NEXT_LEVEL.
- **Requirements carry up.** A requirement sits on the lowest level it applies to and holds for every level above.
  A higher level has its own requirement on the same node only when what it needs there changes.
- **No loops.** SPECIALIZATION_OF points only at a skill's most specific broader skills, and neither it nor
  REQUIRES_SKILL ever leads back to where it started.
- **An ACHIEVED per level reached.** The highest is the person's level in the skill now, and they're taken to have every
  level below it. Moving down a level corrects it, so the ACHIEVEDs above come off.
- **Claims remember their version.** An ACHIEVED whose `levelVersion` is below the level's `version` was made against
  criteria that have since changed.

#### Example
```cypher
(c:Skill {name: "Cooking", aliases: ["cookery"], status: "ready"})-[:HAS_LEVEL]->(cn:DreyfusLevel:Novice {name: "Cooking Novice", rank: 1, version: 1, trust: "provisional",
  description: "Follows recipes literally, step by step", observableSigns: ["Cooks a simple dish from a written recipe without help"]})
(c)-[:HAS_LEVEL]->(cp:DreyfusLevel:Proficient {name: "Cooking Proficient", rank: 4})
(cn)-[:NEXT_LEVEL {description: "Cook regularly and learn to read sensory cues"}]->(:DreyfusLevel:AdvancedBeginner)

(:Skill {name: "Sourdough Baking"})-[:SPECIALIZATION_OF]->(:Skill {name: "Baking"})-[:SPECIALIZATION_OF]->(c)

// every level of Cooking needs a Novice's Knife Skills, and from Proficient it needs Competent
(cn)-[:REQUIRES_SKILL {strength: 0.6, reason: "Chops ingredients safely"}]->(:DreyfusLevel:Novice {name: "Knife Skills Novice"})
(cp)-[:REQUIRES_SKILL {strength: 0.7, reason: "Preps quickly while juggling dishes"}]->(:DreyfusLevel:Competent {name: "Knife Skills Competent"})
(cn)-[:REQUIRES_TRAIT {level: 0.6, strength: 0.4, reason: "Follows a recipe through in order"}]->(:PersonalityTrait {name: "Orderliness"})
(cn)-[:REQUIRES_KNOWLEDGE {strength: 0.8, reason: "Cooks without making anyone ill"}]->(:BloomLevel:Remember {name: "Food Safety Remember"})

(lulu)-[:ACHIEVED {achievedOn: date("2024-03-01"), levelVersion: 1}]->(:DreyfusLevel:Expert {name: "Cooking Expert"})
(andrew)-[:PRACTICES {hoursPerWeek: 5}]->(c)
```

### Physical Attributes Graph
A person's body is an important part of who they are. It affects the Skills they can have and the Ideas they can
understand, and influences their PersonalityTraits. The graph is more than skin, muscle and bone: it's everything from
the nervous system to abstract things like reaction time, and the conditions a person may have. It's very large but
mostly known, so most of it is seeded, and it changes little over time. It covers:

1. **Abilities,** seeded from the O\*NET content model: what a body and mind can do, such as Static Strength, Reaction
   Time and Near Vision.
2. **Measurements,** such as height and grip strength, with population norms and tests a person can do themselves.
3. **Conditions,** linked to the abilities and structures they affect.
4. **Body structure,** the organ systems and major regions everything else hangs on.

Measurements, conditions and body structure are still to be defined.

#### Abilities
An ability is a capacity of a person's body or mind that makes things easier or harder to learn, such as strength,
eyesight or memory. A skill is what someone learns with it: dexterity is an ability, and watch repair is a skill that
comes faster with it. Getting better at a skill means learning how, and getting better at an ability means changing the
body or mind, through training or not at all.

There are 46 abilities, from O\*NET (the Fleishman taxonomy), in four categories:

| Category | Count | Examples |
|---|---|---|
| Cognitive | 15 | Memorization, Deductive Reasoning, Selective Attention |
| Psychomotor | 10 | Manual Dexterity, Arm-Hand Steadiness, Reaction Time |
| Physical | 9 | Static Strength, Stamina, Gross Body Equilibrium |
| Sensory | 12 | Near Vision, Night Vision, Hearing Sensitivity |

The cognitive abilities carry a second label, `Cognitive`. A person's place on an ability is a percentile, as with
personality traits. O\*NET's data is CC BY 4.0, and asks for credit wherever it's shown.

#### Nodes

| Label | Key properties | What it is |
|---|---|---|
| Ability | `id`, `name` (unique), `onetId`, `category`, `group`, `description`, `examples` | One of the 46 abilities. `category` is `Cognitive`, `Psychomotor`, `Physical` or `Sensory`, and `group` is O\*NET's group within it, such as "Fine Manipulative Abilities". `examples` are O\*NET's level anchors, from things that take a little of the ability to things that take a lot. Cognitive abilities have a second label, `Cognitive` |

#### Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_ABILITY | Person → Ability | `value`, `confidence` | Where they sit among people on the ability, from 0 to 1 with 0.5 typical, and how sure we are of it. No relationship means unmeasured, not average |
| REQUIRES_ABILITY | DreyfusLevel → Ability | `level`, `strength`, `reason` | A skill level that takes the ability (see the Skills graph) |

#### Example
```cypher
(s:Ability {name: "Static Strength", onetId: "1.A.3.a.1", category: "Physical", group: "Physical Strength Abilities",
  description: "The ability to exert maximum muscle force to lift, push, pull, or carry objects.",
  examples: ["Push an empty shopping cart", "Pull a 40-pound sack of fertilizer across the lawn", "Lift 75-pound bags of cement onto a truck"]})
(m:Ability:Cognitive {name: "Memorization", category: "Cognitive", group: "Memory"})

// Andrew is unusually strong, and has an ordinary memory
(andrew)-[:HAS_ABILITY {value: 0.85, confidence: 0.7}]->(s)
(andrew)-[:HAS_ABILITY {value: 0.5, confidence: 0.4}]->(m)

// every level of Cooking takes a fairly steady pair of hands
(:DreyfusLevel:Novice {name: "Cooking Novice"})-[:REQUIRES_ABILITY {level: 0.6, strength: 0.4, reason: "Chops and pours without spilling"}]->(:Ability {name: "Arm-Hand Steadiness"})
```

# Beyond The Individual
The following sub-graphs are how people interact together and with their environment. It is less related to their individuality and more how they fit into society and their environment. These are planned, but not yet documented

### Social Graph

### Things Graph

### Events Graph

### Places Graph

### Works Graph

## How The Graphs Interact
