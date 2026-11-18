# Occupations Graph
An occupation is a kind of work people do for a living, such as Registered Nurses or Software Developers. Each one is
a profile of what the work takes across the Atlas: the abilities, the knowledge, the skills and the personality. Set
beside a person's own profile, it shows how far they are from doing that work, which makes the occupations a map of who
a person could become.

The occupations are O\*NET's, the U.S. Department of Labor's database of work, seeded from O\*NET 30.0. There are 894,
the ones O\*NET rates on its abilities. Their ratings are from O\*NET's job analysts and from people who do the work.
O\*NET's data is CC BY 4.0, and asks for credit wherever it's shown. How the seed is made is in
`application/database/onet_import/README.md`, and how far a person is from an occupation is worked out in
`documentation/architecture/occupations.md`.

## What an occupation takes
O\*NET rates each occupation on four kinds of thing, and each is a part of the Atlas:

| O\*NET rates | Count | In the Atlas | How |
|---|---|---|---|
| Abilities | 46 | Abilities | The level on the ability's level scale, over 7, and the importance |
| Knowledge areas | 33 | Topics | The Bloom level of each topic it takes, from the level O\*NET rates |
| Skills | 35 | Skills | The Dreyfus level of each skill it takes, from the level O\*NET rates |
| Work styles | 16 | Personality traits | The importance of the trait each work style is |

Levels are on O\*NET's scale from 0 to 7, and importance on its scale from 1 (not important) to 5 (extremely
important). Both are kept from 0 to 1. A knowledge area or skill rated at least "important", 3 of 5, is one the
occupation takes, at the level its rating comes to: O\*NET's level over 7, as a share of the 6 Bloom levels or 5 Dreyfus
levels, to the nearest. A level of 0.64 is Analyze in a topic, and Competent in a skill.

Which topic, skill or trait each of O\*NET's knowledge areas, skills and work styles is, is chosen by hand. A knowledge
area can be more than one topic: Law and Government is Law and Government. A work style can be a trait's low end: Stress
Tolerance is low Vulnerability, and Self-Control is low Anger.

## What the work is like for the body
O\*NET also rates how often each occupation's work has people in 19 physical demands, from its Work Context: positions
such as standing, kneeling or using the hands, surroundings such as loud noise or very hot or cold temperatures, and
hazards such as high places. Each demand is a node, and an occupation links to every one it's rated on with how often,
from 1 (never) to 5 (continually, or every day), kept from 0 to 1.

Each demand strains the body functions and parts it wears on: standing strains the lower limbs, knees and feet, and
noise strains hearing. The links are chosen by hand. A person's impairments and conditions in what a frequent demand
strains are set beside it for them: an impairment in their left knee is in a knee, which kneeling strains.


| Label | Key properties | What it is |
|---|---|---|
| Occupation | `id`, `onetSoc` (unique), `title`, `description`, `alternateTitles`, `vector` | One of the 894 occupations O\*NET rates on its abilities. `onetSoc` is its O\*NET-SOC code, and `vector` is an embedding of its title, description and alternate titles, which skills find it by |
| WorkDemand | `id`, `onetId` (unique), `name`, `group` | One of the 19 physical demands of work. `onetId` is its O\*NET element id, and `group` is `position`, `environment` or `hazard` |

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| TAKES_ABILITY | Occupation → Ability | `level`, `importance` | What the occupation takes of the ability: `level` on the level scale over 7, and `importance` from 0 to 1 |
| TAKES_KNOWLEDGE | Occupation → BloomLevel | `level`, `importance` | A topic the occupation takes, to the depth of that Bloom level. `level` is O\*NET's, over 7 |
| TAKES_SKILL | Occupation → DreyfusLevel | `level`, `importance` | A skill the occupation takes, to that Dreyfus level. `level` is O\*NET's, over 7 |
| TAKES_TRAIT | Occupation → PersonalityTrait | `importance`, `opposite` | How important the trait is to the work, or its low end when `opposite` |
| HAS_DEMAND | Occupation → WorkDemand | `frequency` | How often the work has people in the demand, from 0 (never) to 1 (continually, or every day) |
| STRAINS | WorkDemand → BodyFunction or BodyPart | | A function or part the demand wears on |
| PERFORMED_IN | Skill → Occupation | | The occupation whose work is doing the skill, which the skill's ability requirements were grounded in |

## Example
```cypher
(nurse:Occupation {onetSoc: "29-1141.00", title: "Registered Nurses"})

// nursing takes good near vision, a knowledge of medicine deep enough to analyze, reading people well, and care for
// others that holds up under stress
(nurse)-[:TAKES_ABILITY {level: 0.554, importance: 0.72}]->(:Ability {name: "Near Vision"})
(nurse)-[:TAKES_KNOWLEDGE {level: 0.639, importance: 0.84}]->(:BloomLevel:Analyze {name: "Medicine Analyze"})
(nurse)-[:TAKES_SKILL {level: 0.626, importance: 0.78}]->(:DreyfusLevel:Competent {name: "Social Perceptiveness Competent"})
(nurse)-[:TAKES_TRAIT {importance: 0.873, opposite: false}]->(:PersonalityTrait {name: "Altruism"})
(nurse)-[:TAKES_TRAIT {importance: 0.873, opposite: true}]->(:PersonalityTrait {name: "Vulnerability"})

// nurses are on their feet about half the time, which wears on the knees
(nurse)-[:HAS_DEMAND {frequency: 0.502}]->(standing:WorkDemand {name: "Standing", group: "position"})
(standing)-[:STRAINS]->(:BodyPart {name: "Knee joint"})
```
