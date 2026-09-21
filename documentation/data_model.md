# Data Specification For The Atlas Of Us
This is the big one. Most of the app is inside the data. The core idea is that this is a graph database with a huge monstrous-level graph database containing many sub graphs. All that a human can be in contained within this data, as well as all that many many different people are. Because all the data is so interwoven, this is a monolithic database. The rest of this document is broken up into explanations of the various sub graphs and their individual business rules. After each sub graph explanation will be a section on how the various subgraphs interact.

## Individual Possibilities Graphs
The following sections are the core graphs related to all a human can be individually. In each of the graphs we will follow several People to see how they interact with the graph. Here is each person's node, which we will reference for the rest of this document:
```cypher
CREATE (andrew:Person {name: "Andrew Link", username: "sudomoniker"});
CREATE (lulu:Person {name: "Lulu Li", username: "lzy7717"});
```

### Personality Graph
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

### Topics Graph
Topic nodes encompass the sub-graph which is essentially a knowledge graph of everything a Person can know, understand, believe, value or any other verb. This sub-graph was originally called Knowledge Graph, but was changed to Topic Graph because some information or knowledge is not provable or is false, and we want to include things that are not strictly true, but somewhat ambiguous or even false. Many people believe false things or know them to be true. Our job is not to verify the veracity of different pieces of information, but rather to understand people and what makes them up. To that end we have Topics, not Knowledge. 

The Topic graph is split into all-encompassing Topic nodes and individual Idea nodes. Topics include many differnt Idea nodes and point to them. To show the versatility of Topics, we will break down parts of the Christianity Topic, Jazz Music Topic, and Microservices Architecture Topic, three very different types of knowledge/beliefs. 

Let's start with Jazz Music:
```cypher

```

### Skills Graph
Skills are the capabilities a Person has. For example Andrew may have the Household Cleaning Skill, but not have the Cooking Skill, and Lulu the opposite. Or perhaps both people have both skills just at different levels. Maybe Andrew CAN cook, but just at a novice level while Lulu is an expert. There is a huge variety of different Skills that each person has to different degrees. In the Skills sub-graph, each Skill is modeled as its own node, with information contained on the node itself of what criteria divides different skill levels. In the Atlas Of Us we use the Dreyful model to differentiate skills levels. The different Dreyfus levels are as follows:
1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

Each Skill node has 5 sub-nodes containing information about each level including prerequisite knowledge levels, other skill levels, physical attributes, and personality trait amounts for each skill level. for example, an expert level of cooking will inevitably require a higher level understanding of different pieces of knowledge than a cooking novice.

Some sample Skills and each of their 5 Dreyfus levels are as follows:
```cypher
//cooking
// Skill node (skip if already created)
CREATE (c:Skill {name: "Cooking", description: "The art, science, and craft of preparing food for eating, usually by using heat", vector: [1, 2, 3]})

// Dreyfus level nodes
CREATE (cn:DreyfusLevel:Novice {name: "Cooking Novice", description: "Follows recipes literally, step by step, without deviation. Relies on explicit rules ('boil pasta for 10 minutes,' 'preheat oven to 350°F') and context-free instructions. Can't judge when something is 'done' except by the clock or the recipe's word. Gets thrown off when ingredients or equipment don't match the recipe exactly."})
CREATE (cab:DreyfusLevel:AdvancedBeginner {name: "Cooking Advanced Beginner", description: "Starts recognizing recurring situations from experience—knows what 'simmering' actually looks like, can tell when onions are properly softened. Begins to bend recipes slightly and substitute ingredients, though still leaning heavily on guidelines. Recognizes cues (smell, color, texture) but doesn't yet prioritize them well."})
CREATE (cc:DreyfusLevel:Competent {name: "Cooking Competent", description: "Cooks with a plan and juggles multiple dishes so everything finishes together. Can consciously choose an approach, adapt recipes to what's on hand, and troubleshoot when things go wrong. Feels ownership over outcomes and gets frustrated by mistakes, since decisions are now deliberate rather than rule-bound. Timing and coordination become manageable."})
CREATE (cp:DreyfusLevel:Proficient {name: "Cooking Proficient", description: "Reads a kitchen situation holistically and intuitively grasps what a dish needs, adjusting on the fly by taste rather than measurement. Sees the whole meal as a unified goal and instinctively knows which elements matter most. Still thinks analytically about how to execute, but what to do comes naturally."})
CREATE (ce:DreyfusLevel:Expert {name: "Cooking Expert", description: "Cooks fluidly and intuitively, with little conscious deliberation—improvising, inventing, and adjusting seamlessly. Doesn't follow rules so much as embody them, responding to subtle cues automatically. Can create new dishes, teach, and articulate why something works. The skill has become second nature, an extension of perception."})

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
Note the vector property on the base Skill node is a semantic vectorisation of the name and description concatenated together. There are infinite possible Skills in this world and a whole host of different words and titles to describe the exact same thing. We want to reuse nodes as much as possible so to that end we have a vector attached to all Skill nodes so that we may do a semantic lookup before adding new Skills to see if they already exist or not. If the similarity score is high, we will ask the user if that already existing node is what they are talking about, and if so let them interact with that one. If not, we will proceed with the new insert.

Then, we can show how Person nodes have a relationship with each Skill node and the various levels. A Person can have different sentimental relationships with the base node including:
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
(a:Person)-[:ACHIEVED {timestamp: "", proof: "", verified: false}]->(cn:DreyfusLevel:Novice)
```
When a person has a higher Dreyfus level, they may have relationships with all lower levels or may not depending on their initial level when entering in the system. However it is assumed a Person has all lower levels of a Skill up to their highest level achieved. Note that the timestamp is the date achieved, NOT the date entered in the system. This date is entered by the user. The proof property is a url link to an s3 blob (likely a video or pdf, but could be anything). The verification property is a boolean switch that gets flipped asynchronously after proof is attached.

Furthermore, Skills will have requirements on different personality traits, physical attributes, knowledge/understanding of different Topics, and possibly more. These relationships will exist on each Dreyfus level since different levels will have higher requirements. It is assumed that requirements build on each other. A novice level of Cooking may have dozens of requirements on other nodes and maybe advanced beginner will only have a couple, but the novice relationships are implied as prerequisites on the advanced beginner level as well. It is unnecessary to have a duplicated relationship unless the nature of the relationship changes. For example if novice level of cooking requires a 0.5 level of the Steady Hands Physical Attribute and advanced beginner has the same requirement, then that relationship would exist only between the Novice Dreyfus level and the Stead Hands Physical Attribute. However later if to be an Expert cook a Person needs a 0.95 level of Steady Hands, then there would be another relationship extending from the Expert node to the Steady Hands node. Some examples of how this looks using examples from each of PersonalityTraits, Topic knowledge, and PhysicalAttributes are as follows:
```cypher
FILL THIS OUT ONCE THE OTHER TRAITS STRUCTURE IS DECIDED ON
```

### Physical Attributes Graph




## Entity Interactions Graphs
The following sub-graphs are how people interact together and with their environment. It is less related to their individuality and more how they fit into society and their environment.

### Social Graph


### Things Graph


## How The Graphs Interact

