# Skills Graph
Skills are the capabilities a Person has. Andrew may cook at a novice level while Lulu is an expert. Each Skill is its
own node, and each has five levels from the Dreyfus model:

1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

How skills get into the graph, get filled out and get reviewed is in `documentation/architecture/skills.md`.

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| Skill | `id`, `name` (unique), `description`, `aliases`, `vector`, `status`, `createdDate`, `abilityScale` | A skill. `status` is `stub`, `filling`, `ready` or `failed`, and `vector` is an embedding of its name, description and aliases. `abilityScale` is `anchored` once its ability requirements are worked out on the level scale, even when it takes none |
| DreyfusLevel | `name`, `rank` (1 to 5), `description`, `observableSigns`, `exampleEvidence`, `version`, `trust` | One of a skill's five levels, with a second label for which (`Novice`, `AdvancedBeginner`, `Competent`, `Proficient`, `Expert`). `trust` is `provisional` or `established` |
| SkillProposal | `id`, `reason`, `status`, `rejectionReason`, `createdDate`, `resolvedDate` | A proposed change to one or more of a skill's levels. `status` is `screening`, `rejected`, `open`, `promoted` or `superseded` |
| SkillLevelRevision | `version`, `description`, `observableSigns`, `exampleEvidence`, `nextLevel`, `replacedDate` | A level's old content, kept when a proposal replaces it |
| Evidence | | A note or file backing up a person's level, shared with Topics (see the Topics graph) |

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_LEVEL | Skill → DreyfusLevel | | A skill's five levels |
| NEXT_LEVEL | DreyfusLevel → DreyfusLevel | `description` | What it takes to reach the next level. Versioned with the level it starts from |
| SPECIALIZATION_OF | Skill → Skill | | A kind of a broader skill. Everyone with the narrower skill has a form of the broader one |
| REQUIRES_SKILL | DreyfusLevel → DreyfusLevel | `strength`, `reason` | A level needs a level of another skill |
| REQUIRES_TRAIT | DreyfusLevel → PersonalityTrait | `level`, `strength`, `reason` | A level takes a personality trait. `level` is where on the trait it pulls, above 0.5 for more of it |
| REQUIRES_ABILITY | DreyfusLevel → Ability | `level`, `strength`, `reason` | A level takes an ability. `level` is how much it takes on the ability's level scale, over 7 |
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

## Rules
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

## Example
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
