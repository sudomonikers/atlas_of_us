# Personality Graph
We will start with the most simple one. We model a person's personality using the Big 5 Theorem. This Psychology concept supposedly sums up all the different personality traits that a person can have split into 5 different sub groups: Openness, Conscientiousness, Extraversion, Agreeableness and Neuroticism. Each of these 5 has a handful of their own individual personality traits, but we have found there are a few more that are apart of the human experience but not quite contained in these 5 sub-groups, so additional traits are added in.

Essentially there is one node per personality trait that exists in the database, and these are static. To model a Person's personality there will be a relationship in the graph from the Person node to every single one of the PersonalityTrait nodes. The relationship between the two will describe how much of each trait that Person has. This means that each PersonalityTrait will have millions of incoming relationships each. While these will be super nodes, our query patterns will really just be looking at these supernodes as endpoints and the info we are interested in is the relationships per person, so it should not be a big deal performance-wise.

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

This basically sums up the extent of our Personality Graph, it is the simplest one we have as it is fairly static. There are not quite 50 traits we measure each with their own node only containing a PersonalityTrait label as well as name and description properties. All of the interesting information is contained on the HAS_PERSONALITY_TRAIT relationship that each Person has with each of those ~50 PersonalityTrait nodes in the form of the value property.

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
