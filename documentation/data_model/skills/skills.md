# Skills Graph
Skills are the capabilities a Person has. For example Andrew may have the Household Cleaning Skill, but not have the Cooking Skill, and Lulu the opposite. Or perhaps both people have both skills just at different levels. Maybe Andrew CAN cook, but just at a novice level while Lulu is an expert. There is a huge variety of different Skills that each person has to different degrees. In the Skills sub-graph, each Skill is modeled as its own node, with information contained on the node itself of what criteria divides different skill levels. In the Atlas Of Us we use the Dreyfus model to differentiate skills levels. The different Dreyfus levels are as follows:
1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

How skills get into the graph, get filled out and get reviewed by the community is described in `documentation/architecture/skills.md`. This section describes the shape of the data that process produces.

## Skill nodes
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

## Dreyfus levels
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

## How skills relate to each other
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

## People and skills
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

A Person will of course also have a relationship with the one Dreyfus level they've reached in a skill, by their own account:
```cypher
(a:Person)-[:ACHIEVED {achievedOn: date("2024-03-01"), levelVersion: 1, since: datetime(), updatedAt: datetime()}]->(cc:DreyfusLevel:Competent)
```
A Person has one ACHIEVED per Skill, to the highest level they've reached, and is taken to have every level below it. `achievedOn` is the date they reached it, which they enter themselves and can leave out, and `since` is when they first placed themselves on the skill. They back it up with Evidence, each piece a note they wrote or a file they uploaded, the same Evidence nodes as for topics (see the Topics graph):
```cypher
(a:Person)-[:GAVE_EVIDENCE]->(:Evidence {id: randomUUID(), kind: "note", text: "Cooked the family dinner every night for a year", createdAt: datetime()})-[:ABOUT]->(c:Skill {name: "Cooking"})
```

`levelVersion` is the version of the level the claim was made against. When a level is revised, existing claims keep their old `levelVersion`, so a claim whose `levelVersion` is lower than the level's `version` is one whose criteria have changed since. The person is asked to re-confirm it, and re-confirming sets `levelVersion` to the current version. Only levels that have been filled can be claimed.

## Community review
Level content is shared by everyone who claims it, so it's changed by the community. That shows up in the graph as endorsements, proposals and revisions.

### Endorsements
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

### Proposals
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

### Revisions
When a proposal is promoted, each level it changes keeps a copy of its old content as a SkillLevelRevision, takes the new content, goes up one `version`, and becomes `established`, since the community has just agreed to it:
```cypher
(cp:DreyfusLevel:Proficient)-[:HAS_REVISION]->(:SkillLevelRevision {
  version: 1, description: "...", observableSigns: ["..."], exampleEvidence: ["..."], nextLevel: "...",
  replacedDate: datetime()
})
(r:SkillLevelRevision)-[:REPLACED_BY]->(p:SkillProposal)
```
`nextLevel` is the old description from the level's NEXT_LEVEL relationship, which is revised along with the level.

## Requirements on other sub-graphs
Furthermore, Skill levels will have requirements on different personality traits, physical attributes, knowledge/understanding of different Topics, and possibly more. These are written by the modules that own those sub-graphs, in reaction to a skill being filled (see the Events section of `documentation/architecture/skills.md`).

These relationships will exist on each Dreyfus level since different levels will have higher requirements. It is assumed that requirements build on each other. A novice level of Cooking may have dozens of requirements on other nodes and maybe advanced beginner will only have a couple, but the novice relationships are implied as prerequisites on the advanced beginner level as well. It is unnecessary to have a duplicated relationship unless the nature of the relationship changes. For example if novice level of cooking requires a 0.5 level of the Steady Hands Physical Attribute and advanced beginner has the same requirement, then that relationship would exist only between the Novice Dreyfus level and the Steady Hands Physical Attribute. However later if to be an Expert cook a Person needs a 0.95 level of Steady Hands, then there would be another relationship extending from the Expert node to the Steady Hands node. The same rule applies to prerequisites on other skills. Some examples of how this looks using examples from each of PersonalityTraits, Topic knowledge, and PhysicalAttributes are as follows:
### Personality traits
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

### Topics
A level REQUIRES_KNOWLEDGE a level of a Topic when a person needs to know that subject to reach it, the same way REQUIRES_SKILL points at a level of another skill. The topic's level is how deeply it's needed, one of its six Bloom levels: Remember, Understand, Apply, Analyze, Evaluate or Create. The relationship carries:
- `strength`: how essential it is, from 0 to 1.
- `reason`: one short sentence on why, in terms of the skill.

It carries up the levels the same way, and a higher level has its own REQUIRES_KNOWLEDGE to the same topic only when the level of it or the `strength` it needs there is different. The Topics module writes these when a skill is filled (see "Skill requirements" in `documentation/architecture/topics.md`), creating a stub for any topic we don't have yet:
```cypher
MATCH (s:Skill {name: "Cooking"})-[:HAS_LEVEL]->(cn:Novice), (s)-[:HAS_LEVEL]->(cp:Proficient)
MATCH (:Topic {name: "Food Safety"})-[:HAS_LEVEL]->(fr:Remember), (:Topic {name: "Food Safety"})-[:HAS_LEVEL]->(fa:Apply)
MATCH (:Topic {name: "Nutrition"})-[:HAS_LEVEL]->(nu:Understand)
// a Novice has to remember the basic rules of food safety
CREATE (cn)-[:REQUIRES_KNOWLEDGE {strength: 0.8, reason: "Stores and cooks food without making anyone ill"}]->(fr)
// a Proficient cook applies them to dishes they've never made
CREATE (cp)-[:REQUIRES_KNOWLEDGE {strength: 0.8, reason: "Works out safe handling for unfamiliar ingredients"}]->(fa)
// and plans balanced meals
CREATE (cp)-[:REQUIRES_KNOWLEDGE {strength: 0.4, reason: "Balances a menu for the people eating it"}]->(nu)
```

Physical Attributes will add their own requirements to the levels in the same way.
