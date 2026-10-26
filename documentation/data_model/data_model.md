# Data Specification For The Atlas Of Us
This is the big one. Most of the app is inside the data. The core idea is that this is a graph database with a huge monstrous-level graph database containing many sub graphs. All that a human can be in contained within this data, as well as all that many many different people are. Because all the data is so interwoven, this is a monolithic database. The rest of this document is broken up into explanations of the various sub graphs and their individual business rules. After each sub graph explanation will be a section on how the various subgraphs interact.

## Ids
Every node or relationship whose id is used outside the database (in a login token, by the UI, in a URL, on the jobs queue or in an event) has an `id` property: a uuid set with `randomUUID()` when it's created, with a uniqueness constraint on its label. Code always matches on that `id`, with the label, so the constraint's index is used:
```cypher
MATCH (p:Person {id: $personId})
```

Seeded nodes, such as PersonalityTraits and scenarios, are MERGEd on their natural key (a trait's `name`, a question's `key`), and get their `id` with `ON CREATE SET n.id = randomUUID()`, so re-running a seed never changes them. Today Person, PersonalityTrait, PersonalityScenario, PersonalityScenarioQuestion, JobRunning and the ANSWERED relationship carry ids, and every new label that's referred to from outside the database gets one from the start.

## Individual Possibilities Graphs
The following sections are the core graphs related to all a human can be individually. In each of the graphs we will follow several People to see how they interact with the graph. Here is each person's node, which we will reference for the rest of this document:
```cypher
CREATE (andrew:Person {id: "0b6f3c1e-2d4a-4c8e-9f1a-7e5d2b8c4a10", name: "Andrew Link", username: "sudomoniker"});
CREATE (lulu:Person {id: "9c2e7a4b-5f1d-4e3a-8b6c-1d0f9e8a7b23", name: "Lulu Li", username: "lzy7717"});
```

### Personality Graph
We will start with the most simple one. We model a person's personality using the Big 5 Theorem. This Psychology concept supposedly sums up all the different personality traits that a person can have split into 5 different sub groups: Openness, Conscientiousness, Extraversion, Agreeableness and Neuroticism. Each of these 5 is split into 6 facets, the individual traits we measure, as defined by the IPIP-NEO questionnaire.

Essentially there is one node per personality trait that exists in the database, and these are static. To model a Person's personality there will be a relationship in the graph from the Person node to each PersonalityTrait node they have been measured on. The relationship between the two will describe how much of each trait that Person has. This means that each PersonalityTrait will have millions of incoming relationships each. While these will be super nodes, our query patterns will really just be looking at these supernodes as endpoints and the info we are interested in is the relationships per person, so it should not be a big deal performance-wise.

Here is an example of how this looks in Cypher:
```cypher
CREATE (c:PersonalityTrait {name: "Cooperation", description: "agreeableness facet: avoiding confrontation and being willing to compromise."});
CREATE (d:PersonalityTrait {name: "Dutifulness", description: "conscientiousness facet: keeping promises and following rules and obligations."});
```

And here is how our People Andrew and Lulu would interact with the Personality Graph, notice that each relationship has a value property which is a float between 0 and 1. This value indicates how much of each PersonalityTrait they have. So in the following example Andrew is very cooperative and somewhat middling on dutifulness, while Lulu is not very cooperative at all but extremely dutiful:
```cypher
MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.9}]-(c:PersonalityTrait {name: "Cooperation"});
MERGE (l:Person {name: "Lulu Li"})-[:HAS_PERSONALITY_TRAIT {value: 0.2}]-(c:PersonalityTrait {name: "Cooperation"});

MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.5}]-(d:PersonalityTrait {name: "Dutifulness"});
MERGE (l:Person {name: "Lulu Li"})-[:HAS_PERSONALITY_TRAIT {value: 1.0}]-(d:PersonalityTrait {name: "Dutifulness"});
```

There are 30 traits we measure, the Big Five facets. Each has its own node containing only a PersonalityTrait label, name and description properties (plus the reading material below). All of the interesting information is contained on the HAS_PERSONALITY_TRAIT relationship that each Person has with those PersonalityTrait nodes. Besides `value`, it carries a `confidence` from 0 to 1 for how much the person's answers actually say about that trait. A trait the answers say nothing about gets no relationship at all, so it reads as unmeasured rather than average:
```cypher
MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.9, confidence: 0.85}]-(c:PersonalityTrait {name: "Cooperation"});
```

Once every scenario is answered and scored, atlas-jobs writes a report on all of the person's traits onto the Person itself, as a JSON string, along with when it was written:
```cypher
SET p.personalityReport = '{"headline": "...", "overview": "...", "domains": [{"key": "openness", "text": "..."}], "strengths": ["..."], "watch_outs": ["..."]}',
    p.personalityReportAt = toString(datetime())
```

#### Explaining the model
The Explore tab teaches people what the Big Five is and what each trait means, and all of that reading material lives in the graph too (seeded by `personality_explore_seed.cypher`). A single PersonalityModel node holds the overview, history and limits of the Big Five. It links to the five PersonalityDomain nodes, and each domain links to its six facets:
```cypher
(:PersonalityModel {name: "Big Five"})-[:HAS_DOMAIN]->(:PersonalityDomain {key: "neuroticism"})-[:HAS_FACET]->(:PersonalityTrait {name: "Anxiety"})
```

Domains and traits both carry an `overview`, plus four lists of short points: `highGood` and `lowGood` for where being high or low helps, and `highWatch` and `lowWatch` for what to watch out for at each end. Traits also point at the other traits they combine with in interesting ways, with a description written from the first trait's point of view:
```cypher
MATCH (a:PersonalityTrait {name: "Anxiety"}), (c:PersonalityTrait {name: "Cautiousness"})
MERGE (c)-[:INTERACTS_WITH {description: "Together they make someone who prepares for everything, and often never starts."}]->(a);
```

#### Scenarios and answers
People don't set their traits directly. They play scenarios, and their answers are scored by an LLM (see `documentation/architecture/personality.md` for how). Each scenario and its questions live in the graph, seeded by `personality_scenarios_seed.cypher`. A scenario's `order` is its place in play order, which also decides its scoring batch. A question's `key` matches the prompt's id in the scene's script, its `order` places it in the scenario (the highest is the last, and answering it finishes the scenario), and `real_life` marks the question at the end of each scenario that asks about the player's own life rather than the story:
```cypher
(:PersonalityScenario {name: "the_feud", title: "The Feud", order: 15})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key: "last_pushed", order: 5, real_life: true, prompt: "Think of the last time someone pushed you..."})
```

Each answer is an ANSWERED relationship from the Person to the question, holding everything the scorer needs to read it:
- `id`: set when the answer is first saved. Answering the same question again keeps it, but starting a scene over deletes the rest of that scene's answers, so their new answers get new ids
- `answer`: their text, or the label of the choice they picked
- `reasoning`: why they picked it, for choices
- `context`: the story they saw since the last question, on the path they took, and the choices offered
- `facets`: the facets of the IPIP-NEO items the question was written to test
- `clockSeconds`, `clockLeft`, `clockRanOut`: where a scenario's countdown stood, only on answers given under one
- `answeredDate`
- `scoring`: a JSON list of the evidence the scorer found in this answer, each `{trait, evidence, level, weight}`. This is what My Personality shows under "Why?"
- `contests`: a JSON list of the person's contests of that evidence, oldest first. Each has the `trait`, the `kind` (`explain` for explaining their answer, `wrong` for saying the evidence misread it), their `message`, when they sent it (`at`), and its `status` (`pending`, `accepted` or `rejected`). A settled contest has the reviewer's `reply`, and an accepted one has the evidence `before` and `after` it changed, or `removed: true` when the reviewer found the answer doesn't show the trait (the evidence stays, at weight 0). Replaying the scene clears them
```cypher
MATCH (a:Person {name: "Andrew Link"}), (q:PersonalityScenarioQuestion {key: "the_war"})
MERGE (a)-[:ANSWERED {answer: "Knock on his door and suggest a mediator. Neutral ground.", reasoning: "A fence isn't worth years of not speaking to the man next door", context: "...", facets: ["Cooperation", "Anger"], answeredDate: datetime(),
  scoring: '[{"trait":"Cooperation","evidence":"Looks for neutral ground over a fight they could win","level":0.7,"weight":0.6}]',
  contests: '[{"trait":"Cooperation","kind":"explain","message":"I only went to a mediator because last time we talked alone it got ugly","at":"2026-10-20T09:12:00Z","status":"rejected","reply":"Going to a mediator to keep things from getting ugly still keeps the peace, so this stays as it is."}]'}]->(q);
```

While a person is being scored, they have a JobRunning node, which the UI watches to lock the scenarios until scoring finishes. The scoring job deletes it when it's done:
```cypher
(:Person)-[:HAS_JOB]->(:JobRunning {id: randomUUID(), kind: "personality_scoring", startedAt: datetime()})
```

#### Skills that take a trait
Skill levels point at the traits they take with REQUIRES_TRAIT, which holds the `level` on the trait the skill pulls
toward (above 0.5 for more of it, below for less), how much it matters as a `strength` from 0 to 1, and a short
`reason`. A requirement on a lower level carries up to the levels above it. The shape and rules are in "Requirements on
other sub-graphs" in `../skills/skills.md`:
```cypher
(:DreyfusLevel {name: "Cooking Expert"})-[:REQUIRES_TRAIT {level: 0.8, strength: 0.7, reason: "Invents new dishes rather than adapting known ones"}]->(:PersonalityTrait {name: "Imagination"})
```

### Topics Graph
Topic nodes encompass the sub-graph which is essentially a knowledge graph of everything a Person can know, understand, believe, value or any other verb. This sub-graph was originally called Knowledge Graph, but was changed to Topic Graph because some information or knowledge is not provable or is false, and we want to include things that are not strictly true, but somewhat ambiguous or even false. Many people believe false things or "know" them to be true. Our job is not to verify the veracity of different pieces of information, but rather to understand people and what makes them up. To that end we have Topics, not Knowledge. 

The Topic graph is split into all-encompassing Topic nodes and individual Idea nodes. Topics include many differnt Idea nodes and point to them. An Idea is a SINGLE piece of information. Most of the value that graph brings to Topics is in the linking of different Ideas together. Showing what you need to understand before you can understand an individual Idea. Furthermore, Ideas can be apart of many many different Topic domains. For example, the Idea that you should "Treat others as you wish to be treated" is something shared across a whole host of different philosophies and religions (both of which would be types of Topics) like Christianity, Islam, Kant's categorical imperative etc. Or something more scientific like the Idea of Entropy which is "The tendency of systems to move from ordered, low-probability states toward disordered, high-probability states" is something that has been rediscovered across thermodynamics, telephone signals, cosmology etc but should actually be DIFFERENT nodes. Thermodynamics Entropy is different from Telephone Signal Entropy even though they have almost the exact same language. It will be up to the Person/AI Model running the insert to decide if we should reuse an existing Idea/Topic or create a new analagous one.

Ideas are supposed to be unique and independent, for this reason Idea nodes also get a vectorisation which is a combo of their name and description properties. When we add new Ideas to the database we first do a similarity check across all the other Ideas to see if what we are attempting to insert already exists (even as apart of another Topic) and link to that instead if it does. If not, we of course insert a fresh Idea. Topics too get vectorised for the same reason.

Ideas are also broken down into 4 different types:
| type | What logical type it is | The tell (how to assign it) | Default stance surfaced | Examples |
| --- | --- | --- | --- | --- |
| concept | A graspable, sub-propositional thing. Not true or false — you can't believe or disbelieve it, only grasp it well or poorly. | "Is this a thing you understand, rather than a statement you could affirm or deny?" | Understanding (Bloom's) | Entropy, recursion, supply-and-demand, the concept of justice, a sonnet's form |
| claim | A truth-apt proposition — the type of thing that is either true or false, whether or not it's provable. | "Could you meaningfully put 'It is true that…' in front of it?" | Understanding + Belief (signed conviction) | "The earth is flat," "God exists," "energy is conserved," "astrology predicts personality" |
| norm | An imperative / ought — action-guiding content. Not true/false in the ordinary sense; you endorse it or you don't. | "Does it tell you what to do, not what is?" | Understanding + Endorsement | "Treat others as you'd want to be treated," "keep your promises," "don't waste food" |
| value | A standing evaluative commitment — a good you hold, which grounds norms but isn't itself an instruction. | "Is it a thing held dear, that you'd hold with more or less intensity?" | Holding (intensity) + thin Understanding | Loyalty, autonomy, honesty-as-a-good, novelty, tradition |


So now we can see the shape of Topics and their underlying Ideas in cypher. The following is what an imagined "Chess Opening Theory" Topic might look like, broken down into Ideas and also sub-topics:
```cypher
CREATE (cot:Topic {name:"Chess Opening Theory", description:"The study of the initial phase of a chess game: established move sequences and the principles behind them.", vector: [1, 2, 3]});

CREATE (open:Topic {name:"Open Games (1.e4 e5)", description:"Openings arising after 1.e4 e5, emphasizing rapid development and open lines.", vector: [1, 2, 3]});
CREATE (semi:Topic {name:"Semi-Open Games (1.e4, non-...e5)", description:"Black answers 1.e4 with something other than ...e5 (Sicilian, French, Caro-Kann).", vector: [1, 2, 3]});
CREATE (closed:Topic {name:"Queen's Pawn Games (1.d4)", description:"Openings arising after 1.d4, typically slower and more strategic.", vector: [1, 2, 3]});

CREATE (open)-[:SUBTOPIC_OF]->(cot);
CREATE (semi)-[:SUBTOPIC_OF]->(cot);
CREATE (closed)-[:SUBTOPIC_OF]->(cot);

CREATE (rules:Idea  {name:"Rules of chess", type:"concept", description:"How the pieces move, check, checkmate, castling.", vector: [1, 2, 3]});
CREATE (dev:Idea    {name:"Piece development", type:"concept", description:"Bringing pieces from starting squares to active posts.", vector: [1, 2, 3]});
CREATE (center:Idea {name:"Center control", type:"concept", description:"Command of the central squares (d4,e4,d5,e5).", vector: [1, 2, 3]});
CREATE (ksafe:Idea  {name:"King safety", type:"concept", description:"Protecting the king, usually via castling.", vector: [1, 2, 3]});
CREATE (tempo:Idea  {name:"Tempo", type:"concept", description:"A unit of time; a move's worth of initiative.", vector: [1, 2, 3]});
CREATE (pawns:Idea  {name:"Pawn structure", type:"concept", description:"The configuration of pawns that shapes middlegame plans.", vector: [1, 2, 3]});

CREATE (dev)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (center)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (ksafe)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (tempo)-[:REQUIRES_KNOWLEDGE]->(dev);
CREATE (pawns)-[:REQUIRES_KNOWLEDGE]->(rules);

CREATE (ruy:Idea {name:"Ruy Lopez", type:"concept", description:"1.e4 e5 2.Nf3 Nc6 3.Bb5; pressures Black's center via the c6-knight.", vector: [1, 2, 3]});
CREATE (sic:Idea {name:"Sicilian Defense", type:"concept", description:"1.e4 c5; Black fights for the center asymmetrically.", vector: [1, 2, 3]});
CREATE (naj:Idea {name:"Najdorf Variation", type:"concept", description:"Sicilian with 5...a6; flexible, sharp, deeply analyzed.", vector: [1, 2, 3]});

CREATE (ruy)-[:REQUIRES_KNOWLEDGE]->(dev);
CREATE (ruy)-[:REQUIRES_KNOWLEDGE]->(center);
CREATE (sic)-[:REQUIRES_KNOWLEDGE]->(center);
CREATE (sic)-[:REQUIRES_KNOWLEDGE]->(pawns);
CREATE (naj)-[:SPECIALIZES]->(sic); // is-a-kind-of; pedagogical REQUIRES_KNOWLEDGE is implied

// Membership: openings belong to their family subtopics
CREATE (open)-[:INCLUDES]->(ruy);
CREATE (semi)-[:INCLUDES]->(sic);
CREATE (semi)-[:INCLUDES]->(naj);

// Norms — the classic opening principles
CREATE (castle:Idea {name:"Castle early", type:"norm", description:"Get the king to safety before launching operations.", vector: [1, 2, 3]});
CREATE (noqueen:Idea {name:"Don't develop the queen too early", type:"norm", description:"An early queen becomes a target, losing tempo.", vector: [1, 2, 3]});
CREATE (castle)-[:REQUIRES_KNOWLEDGE]->(ksafe);
CREATE (noqueen)-[:REQUIRES_KNOWLEDGE]->(tempo);

// Claims — one uncontested, one genuinely disputed
CREATE (kguns:Idea {name:"The King's Gambit is unsound at master level", type:"claim", description:"Thesis that 1.e4 e5 2.f4 is objectively dubious against best play.", vector: [1, 2, 3]});
CREATE (sicbest:Idea {name:"The Sicilian gives Black the best practical winning chances vs 1.e4", type:"claim", description:"Interpretive thesis about practical results, not a proven fact.", vector: [1, 2, 3]});
CREATE (kgsound:Idea {name:"The King's Gambit is fully playable", type:"claim", description:"Romantic counter-thesis: the gambit's initiative compensates.", vector: [1, 2, 3]});
CREATE (kguns)-[:CONTRADICTS]-(kgsound);

FOREACH (n IN [castle, noqueen, kguns, sicbest, kgsound] | CREATE (cot)-[:INCLUDES]->(n));
```

You will notice there are a ton of different relationships going on here. Within the Topics sub-graph itself, the following relationships are used:
| Relationship | From → To | Directed? | Cyclic OK? | Meaning |
| --- | --- | --- | --- | --- |
| REQUIRES_KNOWLEDGE | Idea → Idea | yes | no — sacred DAG | Pedagogical prerequisite. The only edge the learning-path query reads. |
| PRECEDES | Idea → Idea | yes | no (clean DAG) | Temporal order (events, historical facts). Kept separate from REQUIRES_KNOWLEDGE. |
| SPECIALIZES | Idea → Idea | yes | no | Narrower form of a broader Idea (Rawls's justice → Justice). |
| CONTRADICTS | Idea — Idea | symmetric | n/a | Mutually exclusive Ideas. How you hold falsehoods without the graph taking sides. |
| ANALOGOUS_TO | Idea — Idea | symmetric | yes | Same structure, different domain (thermodynamic ↔ information entropy). Not a merge. |
| SUPPORTS | Idea → Idea | yes | yes | Evidential/logical lean toward another Idea. |
| INCLUDES | Topic → Idea | yes | n/a | Collection membership (many-to-many; an Idea can be in many Topics). |
| SUBTOPIC_OF | Topic → Topic | yes | no | Topic nesting (Thermodynamics → Physics). |

And of course there are many different relationships that a Person node can have with Topics/Ideas. They are described as follows:
| Relationship | To | Key properties | Meaning |
| --- | --- | --- | --- |
| UNDERSTANDS | Idea | bloom (Remember→Create) | Epistemic grasp. Available for any type. |
| ENGAGES_TOPIC | Topic | bloom | Collection-level mastery (the top Bloom rungs — Analyze/Evaluate/Create — that are irreducibly about a set of Ideas). |
| BELIEVES | Idea (claim) | conviction (−1…+1, signed), warrant, centrality, reason, since | Doxastic stance. Orthogonal to understanding. 0 conviction = considered-but-undecided (≠ no edge). |
| ENDORSES | Idea (norm) | intensity, reason | Commitment to an ought. |
| HOLDS | Idea (value) | intensity, since | Holding a value dear. |
| CURIOUS_ABOUT | Idea / Topic | intensity | Aesthetic/affective stance → doubles as a learning goal. |
| INTIMIDATED_BY | Idea / Topic | intensity | Affective stance (reused from Skills). |
| BORED_BY | Idea / Topic | intensity | Affective stance (reused from Skills). |

So to continue with Andre and Lulu, they may have the following relationships with the Chess Opening Theory Topic:
```cypher
// Deep grasp of concepts and a specific sharp line
(andrew)-[:UNDERSTANDS {bloom:"Evaluate"}]->(center)
(andrew)-[:UNDERSTANDS {bloom:"Evaluate"}]->(sic)
(andrew)-[:UNDERSTANDS {bloom:"Analyze"}]->(naj)
(andrew)-[:ENGAGES_TOPIC {bloom:"Evaluate"}]->(cot)

// Mainstream believer on the King's Gambit; strong Sicilian partisan
(andrew)-[:BELIEVES {conviction:+0.8, warrant:"engine+practice", centrality:0.4}]->(kguns)
(andrew)-[:BELIEVES {conviction:-0.8}]->(kgsound)
(andrew)-[:BELIEVES {conviction:+0.7, warrant:"practical-results", centrality:0.6}]->(sicbest)

// Endorses principles but as a strong player, holds them loosely
(andrew)-[:ENDORSES {intensity:0.6, reason:"Sound default, but I break them with prep"}]->(castle);

// Solid on fundamentals, mid-climb; Najdorf is beyond her fringe
(lulu)-[:UNDERSTANDS {bloom:"Apply"}]->(center)
(lulu)-[:UNDERSTANDS {bloom:"Understand"}]->(sic)
// no edge to (naj) yet → Najdorf sits just past her learning frontier
(lulu)-[:ENGAGES_TOPIC {bloom:"Understand"}]->(cot)

// The interesting divergence: she disagrees with Andrew about the King's Gambit
(lulu)-[:BELIEVES {conviction:+0.6, warrant:"romantic/experience", centrality:0.5}]->(kgsound)
(lulu)-[:BELIEVES {conviction:-0.4}]->(kguns)
// hasn't formed a view on the Sicilian claim — deliberately no edge (≠ undecided)

// Endorses principles firmly (improving players lean on them harder)
(lulu)-[:ENDORSES {intensity:0.9, reason:"They keep me out of trouble"}]->(castle)
(lulu)-[:ENDORSES {intensity:0.8}]->(noqueen)

// A learning goal, expressed as an affective stance at the concept level
(lulu)-[:CURIOUS_ABOUT {intensity:0.8}]->(naj)
```

### Skills Graph
Skills are the capabilities a Person has. For example Andrew may have the Household Cleaning Skill, but not have the Cooking Skill, and Lulu the opposite. Or perhaps both people have both skills just at different levels. Maybe Andrew CAN cook, but just at a novice level while Lulu is an expert. There is a huge variety of different Skills that each person has to different degrees. In the Skills sub-graph, each Skill is modeled as its own node, with information contained on the node itself of what criteria divides different skill levels. In the Atlas Of Us we use the Dreyfus model to differentiate skills levels. The different Dreyfus levels are as follows:
1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

How skills get into the graph, get filled out and get reviewed by the community is described in `documentation/architecture/skills.md`. This section describes the shape of the data that process produces.

#### Skill nodes
There are infinite possible Skills in this world and a whole host of different words and titles to describe the exact same thing, so the most important rule of this sub-graph is that **each skill exists once**. Every other name we know it by is kept in its `aliases`, not as another node.

Each Skill node carries:
- `id`: a uuid, which events refer to.
- `name`: its preferred name. It's unique, so two requests for the same new skill at the same moment `MERGE` onto one node, and re-running the taxonomy import updates nodes instead of duplicating them.
- `description`
- `aliases`: a list of every other name it goes by.
- `vector`: an embedding of the name, description and aliases joined together, used by search and to find similar skills before a new one is created. It's made by Amazon Titan Text Embeddings V2 (1024 dimensions) from `"<name>. <description>. Also known as <alias>, <alias>."`.
- `status`: where the skill is in its life:
  - `stub`: exists and can be found and linked to, but its levels are empty
  - `filling`: the fill job is generating its levels
  - `ready`: its levels are filled and it can be claimed
  - `failed`: the fill job gave up, and a user can retry
- `createdDate`

Most skills start out imported from ESCO. Only ESCO's "skill/competence" entries become Skills. Its "knowledge" entries belong to the Topics sub-graph, and its grouping categories (such as "communication, collaboration and creativity") are not imported at all, since nobody would claim them.

```cypher
// application/database/migrations/002_skills_indexes.cypher
CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE;
// search by name and alias
CREATE FULLTEXT INDEX skill_names IF NOT EXISTS FOR (s:Skill) ON EACH [s.name, s.aliases];
// dimensions must match the embedding model
CREATE VECTOR INDEX skill_vector IF NOT EXISTS FOR (s:Skill) ON s.vector
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}};

CREATE (c:Skill {
  id: "6f1c...", name: "Cooking",
  description: "The art, science, and craft of preparing food for eating, usually by using heat",
  aliases: ["cookery", "food preparation"], vector: [1, 2, 3], status: "ready", createdDate: datetime()
})
```

#### Dreyfus levels
Every Skill has exactly five DreyfusLevel nodes, and they are created **in the same transaction as the Skill**, even when it's only a stub. A stub's levels have a name and rank but no content yet. Because the levels always exist, anything can link to them straight away (a prerequisite from another skill, a requirement from another module), and that link lives in the graph rather than waiting in a queue for the levels to be made.

Each DreyfusLevel node carries:
- a second label for its level (`Novice`, `AdvancedBeginner`, `Competent`, `Proficient` or `Expert`)
- `name`, such as "Cooking Novice"
- `rank` from 1 (Novice) to 5 (Expert), for "at or above this level" comparisons
- `description`: what someone at this level is like
- `observableSigns`: a list of things someone at this level can be seen to do ("can do X without Y"). These are what make evidence checkable.
- `exampleEvidence`: a list of the kinds of proof that would show this level
- `version`: starts at 1 when the level is first filled, and goes up by one each time a proposal is promoted
- `trust`: `provisional` until the community has endorsed the current version enough, then `established`

The way from one level to the next is a NEXT_LEVEL relationship, whose `description` says what it takes to get there. It belongs to the level it starts from, so it's versioned and revised along with that level.

```cypher
//cooking
CREATE (cn:DreyfusLevel:Novice {name: "Cooking Novice", rank: 1, version: 1, trust: "provisional",
  description: "Follows recipes literally, step by step, without deviation. Relies on explicit rules ('boil pasta for 10 minutes,' 'preheat oven to 350°F') and context-free instructions. Can't judge when something is 'done' except by the clock or the recipe's word. Gets thrown off when ingredients or equipment don't match the recipe exactly.",
  observableSigns: ["Can cook a simple dish from a written recipe without help", "Measures every ingredient and times every step"],
  exampleEvidence: ["A photo of a dish made from a named recipe, with the recipe"]})
CREATE (cab:DreyfusLevel:AdvancedBeginner {name: "Cooking Advanced Beginner", rank: 2, version: 1, trust: "provisional",
  description: "Starts recognizing recurring situations from experience—knows what 'simmering' actually looks like, can tell when onions are properly softened. Begins to bend recipes slightly and substitute ingredients, though still leaning heavily on guidelines. Recognizes cues (smell, color, texture) but doesn't yet prioritize them well.",
  observableSigns: ["Can tell when onions are softened by looking, without a timer", "Substitutes a missing ingredient without the dish failing"],
  exampleEvidence: ["A short video narrating sensory cues while cooking"]})
CREATE (cc:DreyfusLevel:Competent {name: "Cooking Competent", rank: 3, version: 1, trust: "provisional",
  description: "Cooks with a plan and juggles multiple dishes so everything finishes together. Can consciously choose an approach, adapt recipes to what's on hand, and troubleshoot when things go wrong. Feels ownership over outcomes and gets frustrated by mistakes, since decisions are now deliberate rather than rule-bound. Timing and coordination become manageable.",
  observableSigns: ["Serves a three-dish meal with everything ready at the same time", "Rescues a dish that is going wrong mid-cook"],
  exampleEvidence: ["Photos of a full meal with a written plan of how it was timed"]})
CREATE (cp:DreyfusLevel:Proficient {name: "Cooking Proficient", rank: 4, version: 1, trust: "provisional",
  description: "Reads a kitchen situation holistically and intuitively grasps what a dish needs, adjusting on the fly by taste rather than measurement. Sees the whole meal as a unified goal and instinctively knows which elements matter most. Still thinks analytically about how to execute, but what to do comes naturally.",
  observableSigns: ["Seasons and adjusts by taste rather than measurement", "Plans a menu around what is available rather than around recipes"],
  exampleEvidence: ["A video of cooking an unplanned meal from what is in the fridge"]})
CREATE (ce:DreyfusLevel:Expert {name: "Cooking Expert", rank: 5, version: 1, trust: "provisional",
  description: "Cooks fluidly and intuitively, with little conscious deliberation—improvising, inventing, and adjusting seamlessly. Doesn't follow rules so much as embody them, responding to subtle cues automatically. Can create new dishes, teach, and articulate why something works. The skill has become second nature, an extension of perception.",
  observableSigns: ["Invents original dishes others cook from", "Teaches and explains why techniques work"],
  exampleEvidence: ["Original recipes published or served professionally", "A recording of teaching a class"]})

// Link the skill to each level
CREATE (c)-[:HAS_LEVEL]->(cn)
CREATE (c)-[:HAS_LEVEL]->(cab)
CREATE (c)-[:HAS_LEVEL]->(cc)
CREATE (c)-[:HAS_LEVEL]->(cp)
CREATE (c)-[:HAS_LEVEL]->(ce)

// Progression path: how to reach the next level
CREATE (cn)-[:NEXT_LEVEL {description: "Cook regularly across many real situations rather than isolated recipes. Pay attention to sensory cues—how food looks, smells, and sounds—so you learn to recognize states like 'simmering' or 'softened' by observation instead of by the clock. Start making small substitutions to build a feel for how ingredients behave."}]->(cab)
CREATE (cab)-[:NEXT_LEVEL {description: "Take on planning and coordination: cook full meals where multiple dishes must finish together. Consciously choose an approach and own the outcome instead of leaning on guidelines. Learn to troubleshoot mid-cook and prioritize which cues matter most so you can adapt recipes deliberately to what's on hand."}]->(cc)
CREATE (cc)-[:NEXT_LEVEL {description: "Accumulate enough varied experience that planning becomes intuitive rather than effortful. Shift from measuring and following steps toward tasting and adjusting, letting you read the whole dish holistically instead of managing it piece by piece. Repetition turns deliberate decisions into pattern recognition."}]->(cp)
CREATE (cp)-[:NEXT_LEVEL {description: "Through sustained, immersive practice, let execution become automatic so conscious deliberation fades. Push beyond adapting existing dishes into improvising and inventing new ones, and develop the ability to articulate and teach why techniques work. Mastery comes when the skill becomes an extension of perception."}]->(ce)
```

A stub looks the same, with `status: "stub"` on the Skill and only `name` and `rank` on its levels. It has no NEXT_LEVEL relationships until it's filled.

#### How skills relate to each other
There are three different ways two skills can be related, and they are kept apart. Prerequisites are the main web between skills, and how a person gets from what they can do to what they want to do. Specialization is a strict "kind of" link, and same skill is one node:

**Specialization.** A skill that is a kind of another skill, a narrower and more specific form of it, points at it with SPECIALIZATION_OF. The test is strict: everyone who has the narrower skill also has a form of the broader one. Sourdough Baking is a kind of Baking. Underwater Welding is a kind of Welding, and it REQUIRES_SKILL Diving, a different skill. A skill can be a kind of several skills, and most are a kind of one or none:
```cypher
(:Skill {name: "Sourdough Baking"})-[:SPECIALIZATION_OF]->(:Skill {name: "Baking"})-[:SPECIALIZATION_OF]->(:Skill {name: "Cooking"})
(:Skill {name: "Data Visualization"})-[:SPECIALIZATION_OF]->(:Skill {name: "Data Analysis"})
(:Skill {name: "Data Visualization"})-[:SPECIALIZATION_OF]->(:Skill {name: "Graphic Design"})
```

A skill points only at its most specific broader skills: Sourdough Baking points at Baking, and reaches Cooking through it. Following SPECIALIZATION_OF out from a skill always leads away from it, so specializations have no loops. These links come from the resolver, when the taxonomy import, a user or the prerequisites job names a skill that is a kind of one we have, or that existing skills are kinds of.

**Prerequisite.** Prerequisites live on the **levels**, not on the skills, because a higher level of a skill usually needs more of another one. A level REQUIRES_SKILL a level of another skill, with a `strength` from 0 to 1 for how essential it is (1 means it can't be done without it, 0.3 means it helps) and a `reason`, one short sentence on why. Prerequisites are written by the prerequisites job once a skill is filled, and a prerequisite we don't have yet is created as a stub so the relationship can point at its level straight away. Like every requirement (see "Requirements on other sub-graphs"), a prerequisite sits on the lowest level it applies to and carries up, and a higher level has its own REQUIRES_SKILL to the same skill only when the level of it needed or the strength changes:
```cypher
MATCH (c:Skill {name: "Cooking"})-[:HAS_LEVEL]->(cn:Novice), (c)-[:HAS_LEVEL]->(cp:Proficient)
MATCH (k:Skill {name: "Knife Skills"})-[:HAS_LEVEL]->(kn:Novice), (k)-[:HAS_LEVEL]->(kc:Competent)
// every level of Cooking needs a Novice's Knife Skills
CREATE (cn)-[:REQUIRES_SKILL {strength: 0.6, reason: "Chops ingredients safely to follow a recipe"}]->(kn)
// from Proficient it needs to be Competent with a knife
CREATE (cp)-[:REQUIRES_SKILL {strength: 0.7, reason: "Preps quickly and evenly while juggling several dishes"}]->(kc)
```

Prerequisites can never form a cycle: following REQUIRES_SKILL out from any level of a skill must never lead back to a level of that same skill. The prerequisites job checks this straight after writing each one, and takes it out again if it closed a loop.

**Same skill.** One node, with the other name in its aliases.

#### People and skills
A Person can have different sentimental relationships with the base node including:
```cypher
(a:Person)-[:LIKES {intensity: 0.8, reason: "", timestamp: ""}]->(c:Skill)
(a:Person)-[:DISLIKES {intensity: 0.2, reason: "", timestamp: ""}]->(c:Skill)
(a:Person)-[:BORED_BY {intensity: 1.0, reason: "", timestamp: ""}]->(c:Skill)
(a:Person)-[:INTIMIDATED_BY {intensity: 0.3, reason: "", timestamp: ""}]->(c:Skill)
```
as well as engagement level relationships such as:
```cypher
(a:Person)-[:PRACTICES {hoursPerWeek: 5}]->(c:Skill {name: "Cooking"})
```

These relationships can stack. A person may both like AND dislike the exact same thing for different reasons and for different intensities. Intensity is a float between 0 and one indicating degree, and reason is a string indicated by the user themself.

A Person will of course also have relationships with the different Dreyfus levels:
```cypher
(a:Person)-[:ACHIEVED {timestamp: "", proof: "", verified: false, levelVersion: 1}]->(cn:DreyfusLevel:Novice)
```
When a person has a higher Dreyfus level, they may have relationships with all lower levels or may not depending on their initial level when entering in the system. However it is assumed a Person has all lower levels of a Skill up to their highest level achieved. Note that the timestamp is the date achieved, NOT the date entered in the system. This date is entered by the user. The proof property is a url link to an s3 blob (likely a video or pdf, but could be anything). The verification property is a boolean switch that gets flipped asynchronously after proof is attached.

`levelVersion` is the version of the level the claim was made against. When a level is revised, existing claims keep their old `levelVersion`, so a claim whose `levelVersion` is lower than the level's `version` is one whose criteria have changed since. The person is asked to re-confirm it, and re-confirming sets `levelVersion` to the current version. Only levels that have been filled can be claimed.

#### Community review
Level content is shared by everyone who claims it, so it's changed by the community. That shows up in the graph as endorsements, proposals and revisions.

##### Endorsements
A Person ENDORSES a level's current content when they read it and think it's right. The relationship records the `version` they endorsed, so endorsements of an old version don't count toward a new one. Endorsing a whole skill is just endorsing each of its levels:
```cypher
(a:Person)-[:ENDORSES {version: 1, date: datetime()}]->(cc:DreyfusLevel:Competent)
```

An endorsement's weight is not stored. It's worked out when it's counted, from the endorser's claims on that skill at the time, so a claim being verified later raises the weight of everything that person has endorsed:

| Who endorses | Weight |
|---|---|
| Has a verified ACHIEVED at or above the level's `rank` | 3 |
| Has an unverified ACHIEVED at or above the level's `rank` | 1 |
| Anyone else | 0.5 |

When the total weight of endorsements of the current version reaches the threshold, the level's `trust` becomes `established`. The weights and threshold are configuration.

##### Proposals
A change to level content is a SkillProposal node, and doesn't touch the levels until it's promoted. One proposal can change several levels of the same skill at once, since a fix like "this belongs at Proficient, not Expert" takes something out of one level and puts it in another. Each level it changes gets a PROPOSES_CHANGE_TO relationship, holding the new content for that level and the `baseVersion` it was written against. Fields left off the relationship stay as they are:
```cypher
(a:Person)-[:PROPOSED]->(p:SkillProposal {
  id: "a91e...", reason: "Inventing dishes is something proficient cooks already do",
  status: "open", rejectionReason: null, createdDate: datetime(), resolvedDate: null
})
(p)-[:PROPOSES_CHANGE_TO {baseVersion: 1, observableSigns: ["Seasons and adjusts by taste rather than measurement", "Adapts and invents dishes from what is on hand"]}]->(cp:DreyfusLevel:Proficient)
(p)-[:PROPOSES_CHANGE_TO {baseVersion: 1, observableSigns: ["Invents original dishes others cook from", "Teaches and explains why techniques work"]}]->(ce:DreyfusLevel:Expert)
```

A proposal's `status` is one of:
- `screening`: waiting on the proposal job's LLM check
- `rejected`: failed the check. It's kept, with the reason in `rejectionReason`, so the person can see why.
- `open`: passed the check, and people can endorse or oppose it
- `promoted`: became the main content
- `superseded`: another proposal changed one of the same levels first, so this one's `baseVersion` is out of date. The person can write it again against the new version.

People endorse and oppose an open proposal with the same kind of relationship as levels, plus OPPOSES:
```cypher
(l:Person)-[:ENDORSES {date: datetime()}]->(p:SkillProposal)
(b:Person)-[:OPPOSES {date: datetime(), reason: ""}]->(p:SkillProposal)
```
Endorsements and oppositions are weighted with the same table, using the highest `rank` of the levels the proposal changes. A proposal is promoted when its weighted endorsement reaches the threshold and is greater than its weighted opposition.

##### Revisions
When a proposal is promoted, each level it changes keeps a copy of its old content as a SkillLevelRevision, takes the new content, goes up one `version`, and becomes `established`, since the community has just agreed to it:
```cypher
(cp:DreyfusLevel:Proficient)-[:HAS_REVISION]->(:SkillLevelRevision {
  version: 1, description: "...", observableSigns: ["..."], exampleEvidence: ["..."], nextLevel: "...",
  replacedDate: datetime()
})
(r:SkillLevelRevision)-[:REPLACED_BY]->(p:SkillProposal)
```
`nextLevel` is the old description from the level's NEXT_LEVEL relationship, which is revised along with the level.

#### Requirements on other sub-graphs
Furthermore, Skill levels will have requirements on different personality traits, physical attributes, knowledge/understanding of different Topics, and possibly more. These are written by the modules that own those sub-graphs, in reaction to a skill being filled (see the Events section of `documentation/architecture/skills.md`).

These relationships will exist on each Dreyfus level since different levels will have higher requirements. It is assumed that requirements build on each other. A novice level of Cooking may have dozens of requirements on other nodes and maybe advanced beginner will only have a couple, but the novice relationships are implied as prerequisites on the advanced beginner level as well. It is unnecessary to have a duplicated relationship unless the nature of the relationship changes. For example if novice level of cooking requires a 0.5 level of the Steady Hands Physical Attribute and advanced beginner has the same requirement, then that relationship would exist only between the Novice Dreyfus level and the Steady Hands Physical Attribute. However later if to be an Expert cook a Person needs a 0.95 level of Steady Hands, then there would be another relationship extending from the Expert node to the Steady Hands node. The same rule applies to prerequisites on other skills. Some examples of how this looks using examples from each of PersonalityTraits, Topic knowledge, and PhysicalAttributes are as follows:
##### Personality traits
A level REQUIRES_TRAIT a PersonalityTrait when the personality makes a real difference to doing the skill well at that
level. It carries:
- `level`: where on the trait the skill pulls, from 0 to 1. Above 0.5 takes more of the trait, below 0.5 takes less of
  it, and the further from 0.5 the more extreme.
- `strength`: how much it matters, from 0 to 1. 1 means it can hardly be done well without it, 0.3 means it helps.
- `reason`: one short sentence on why, in terms of the skill.

A requirement sits on the lowest level it applies to and carries up to every level above it. A higher level has its own
REQUIRES_TRAIT to the same trait only when the `level` or `strength` it takes there is different. The Personality module
writes these when a skill is filled (see "Skill requirements" in `documentation/architecture/personality.md`):
```cypher
MATCH (s:Skill {name: "Cooking"})-[:HAS_LEVEL]->(cn:Novice), (s)-[:HAS_LEVEL]->(cc:Competent), (s)-[:HAS_LEVEL]->(ce:Expert)
MATCH (o:PersonalityTrait {name: "Orderliness"}), (a:PersonalityTrait {name: "Anxiety"}), (i:PersonalityTrait {name: "Imagination"})
// Novice to Proficient all take some Orderliness
CREATE (cn)-[:REQUIRES_TRAIT {level: 0.6, strength: 0.4, reason: "Follows a recipe through in order without skipping steps"}]->(o)
// from Competent, juggling several dishes at once takes staying calm when timing slips
CREATE (cc)-[:REQUIRES_TRAIT {level: 0.3, strength: 0.5, reason: "Keeps several dishes on track when one falls behind"}]->(a)
// an Expert invents dishes, which takes Imagination
CREATE (ce)-[:REQUIRES_TRAIT {level: 0.8, strength: 0.7, reason: "Invents new dishes rather than adapting known ones"}]->(i)
```

Topics and Physical Attributes will add their own requirements to the levels in the same way.

### Physical Attributes Graph
A person's physical body is an important part about who they are. It affects their capabilities in terms of Skills they can have and Ideas they can understand, as well as influences their PersonalityTraits. The Physical Attributes graph is more than just skin, muscle, and bone. It is the entirety of you from your nervous system to your limbic sytem to more abstract things like 'reaction time' and other diseases you may have. This particular graph is interesting in that it is extremely large and complex, but also mostly known and seeded. While it does change it doesn't change much over time. The following are covered:

1. Body Structure - seeded from Uberon
2. Measurements - custom developed
3. Conditions - seeded from Mondo/HPO

For Body Structure, we have gone ahead and seeded an entire human body's physical makeup into the database as graph. A huge mapping of human conditions (diseases and the like) have also been seeded and linked to the different structures they affect. Finally, the measurements are the actual interesting thing that most Persons will be interested in. That list has been compiled together by hand, and linked to various structures and conditions also by hand.

The shape of each Measurement looks like this:
```cypher
(hec:PhysicalMeasurement {name: "Hand-Eye Coordination", description: "The ability to use your eyes to process visual information and guide your hands to perform a precise task", vector: [1, 2, 3]})
```

Most of the interesting information here is contained in the Persons relationship with the Measurement. For example:
```cypher
(a:Person)-[:HAS_MEASUREMENT {amount: 0.9}]-(hec:PhysicalMeasurement);
```
Here the amount is a float between 0 and 1 with 1 being extremely high and 0 being essentially no hand eye coordination at all.

How Persons interact with the Body Structure and Conditions nodes will be filled out later.

# Beyond The Individual
The following sub-graphs are how people interact together and with their environment. It is less related to their individuality and more how they fit into society and their environment. These are planned, but not yet documented

### Social Graph

### Things Graph

### Events Graph

### Places Graph

### Works Graph

## How The Graphs Interact
