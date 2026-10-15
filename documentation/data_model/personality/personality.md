# Personality Graph
We will start with the most simple one. We model a person's personality using the Big 5 Theorem. This Psychology concept supposedly sums up all the different personality traits that a person can have split into 5 different sub groups: Openness, Conscientiousness, Extraversion, Agreeableness and Neuroticism. Each of these 5 has a handful of their own individual personality traits, but we have found there are a few more that are apart of the human experience but not quite contained in these 5 sub-groups, so additional traits are added in.

Essentially there is one node per personality trait that exists in the database, and these are static. To model a Person's personality there will be a relationship in the graph from the Person node to each PersonalityTrait node they have been measured on. The relationship between the two will describe how much of each trait that Person has. This means that each PersonalityTrait will have millions of incoming relationships each. While these will be super nodes, our query patterns will really just be looking at these supernodes as endpoints and the info we are interested in is the relationships per person, so it should not be a big deal performance-wise.

Here is an example of how this looks in Cypher:
```cypher
CREATE (p:PersonalityTrait {name: "Patience", description: "Tolerating delay, difficulty or slowness without frustration."});
CREATE (d:PersonalityTrait {name: "Dutifulness", description: "conscientiousness facet: keeping promises and following rules and obligations."});
```

And here is how our People Andrew and Lulu would interact with the Personality Graph, notice that each relationship has a value property which is a float between 0 and 1. This value indicates how much of each PersonalityTrait they have. So in the following example Andrew is very patient and somewhat middling on dutifulness, while Lulue is not very patient at all but extremely dutiful.:
```cypher
MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.9}]-(p:PersonalityTrait {name: "Patience"});
MERGE (l:Person {name: "Lulu Li"})-[:HAS_PERSONALITY_TRAIT {value: 0.2}]-(p:PersonalityTrait {name: "Patience"});

MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.5}]-(d:PersonalityTrait {name: "Dutifulness"});
MERGE (l:Person {name: "Lulu Li"})-[:HAS_PERSONALITY_TRAIT {value: 1.0}]-(d:PersonalityTrait {name: "Dutifulness"});
```

There are 43 traits we measure: the 30 Big Five facets plus 13 of our own. Each has its own node containing only a PersonalityTrait label, name and description properties (plus the reading material below). All of the interesting information is contained on the HAS_PERSONALITY_TRAIT relationship that each Person has with those PersonalityTrait nodes. Besides `value`, it carries a `confidence` from 0 to 1 for how much the person's answers actually say about that trait. A trait the answers say nothing about gets no relationship at all, so it reads as unmeasured rather than average:
```cypher
MERGE (a:Person {name: "Andrew Link"})-[:HAS_PERSONALITY_TRAIT {value: 0.9, confidence: 0.85}]-(p:PersonalityTrait {name: "Patience"});
```

## Explaining the model
The Explore tab teaches people what the Big Five is and what each trait means, and all of that reading material lives in the graph too (seeded by `personality_explore_seed.cypher`). A single PersonalityModel node holds the overview, history and limits of the Big Five. It links to six PersonalityDomain nodes, the five domains plus "Beyond the Big Five" for our extra traits, and each domain links to its traits:
```cypher
(:PersonalityModel {name: "Big Five"})-[:HAS_DOMAIN]->(:PersonalityDomain {key: "neuroticism"})-[:HAS_FACET]->(:PersonalityTrait {name: "Anxiety"})
```

Domains and traits both carry an `overview`, plus four lists of short points: `highGood` and `lowGood` for where being high or low helps, and `highWatch` and `lowWatch` for what to watch out for at each end. Traits also point at the other traits they combine with in interesting ways, with a description written from the first trait's point of view:
```cypher
MATCH (a:PersonalityTrait {name: "Anxiety"}), (c:PersonalityTrait {name: "Cautiousness"})
MERGE (c)-[:INTERACTS_WITH {description: "Together they make someone who prepares for everything, and often never starts."}]->(a);
```

## Scenarios and answers
People don't set their traits directly. They play scenarios, and their answers are scored by an LLM (see `documentation/architecture/personality.md` for how). Each scenario and its questions live in the graph, seeded by `personality_scenarios_seed.cypher`. A question's `key` matches the prompt's id in the scene's script, its `order` places it in the scenario (the highest is the last, and answering it finishes the scenario), and `real_life` marks the question at the end of each scenario that asks about the player's own life rather than the story:
```cypher
(:PersonalityScenario {name: "soap_house", title: "The Soap House"})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key: "your_share", order: 6, real_life: true, prompt: "Away from Aleppo now..."})
```

Each answer is an ANSWERED relationship from the Person to the question, holding everything the scorer needs to read it:
- `answer`: their text, or the label of the choice they picked
- `reasoning`: why they picked it, for choices
- `context`: the story they saw since the last question, on the path they took, and the choices offered
- `facets`: the traits the question was written to draw out
- `clockSeconds`, `clockLeft`, `clockRanOut`: where a scenario's countdown stood, only on answers given under one
- `answeredDate`
- `scoring`: a JSON list of the evidence the scorer found in this answer, each `{trait, evidence, level, weight}`. This is what My Personality shows under "Why?"
```cypher
MATCH (a:Person {name: "Andrew Link"}), (q:PersonalityScenarioQuestion {key: "the_sale"})
MERGE (a)-[:ANSWERED {answer: "Keep it. Rana kept it alive, and she should get to keep it.", reasoning: "She did the work for six years", context: "...", facets: ["Fairness", "Cooperation"], answeredDate: datetime(),
  scoring: '[{"trait":"Fairness","evidence":"Weighs who earned what over an even split","level":0.6,"weight":0.7}]'}]->(q);
```

While a person is being scored, they have a JobRunning node, which the UI watches to lock the scenarios until scoring finishes. The scoring job deletes it when it's done:
```cypher
(:Person)-[:HAS_JOB]->(:JobRunning {kind: "personality_scoring", startedAt: datetime()})
```
