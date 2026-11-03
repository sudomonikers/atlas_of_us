# Physical Attributes Graph
A person's body is an important part of who they are. It affects the Skills they can have and the Ideas they can
understand, and influences their PersonalityTraits. The graph is more than skin, muscle and bone: it's everything from
the nervous system to abstract things like reaction time, and the conditions a person may have. It's very large but
mostly known, so most of it is seeded, and it changes little over time. It covers:

1. **Abilities,** seeded from the O\*NET content model: what a body and mind can do, such as Static Strength, Reaction
   Time and Near Vision.
2. **Measurements,** such as height and grip strength, with population norms and tests a person can do themselves.
3. **Body functions and structures,** seeded from the WHO's ICF: what each part of the body does and what it's made
   of, and the impairments a person has in them.
4. **Conditions,** from Mondo and HPO, linked to the functions and structures they affect.

## Abilities
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

## Measurements
A measurement is something about a body with a number and a unit, such as height, grip strength or resting heart rate.
There are 15, seeded from NHANES, the US national health survey: body size (height, weight, BMI, waist and hip
circumference, upper arm and leg length), vitals (resting heart rate, blood pressure), strength and fitness (grip
strength, VO2 max, body fat) and the senses (hearing threshold, visual acuity).

Each measurement has **norms**: the value at each percentile of the US population, for a sex (male, female or all) and
an age band. A person records the raw value, and their percentile is worked out when it's read, against the norm for
their sex for norms and their age on the day they measured it. Someone who hasn't given a sex for norms is compared
with everyone. `better` says which way is good: `higher` (grip strength), `lower` (resting heart rate) or `neither`
(height, where a percentile only says where someone sits).

A measurement that shows an ability links to it: grip strength shows Static Strength, and VO2 max shows Stamina.

## Body functions and structures
The WHO's International Classification of Functioning, Disability and Health (ICF) names every body function, such as
memory functions or visual acuity functions, and every body structure, such as the structure of the knee joint. There
are 346 functions and 209 structures, each with a name, a description, what it includes and excludes, and the group
it's in. Narrower ones are part of broader ones: Short-term memory is part of Memory functions.

A person notes an **impairment** in a function or structure with how much: `mild`, `moderate`, `severe` or `complete`.
An impairment in a structure can also say how it has changed: `total_absence`, `partial_absence`, `additional_part`,
`aberrant_dimensions`, `discontinuity`, `deviating_position` or `qualitative_change`. No impairment means none noted.
Impairments are private to the person.

Body functions underlie the abilities they're the basis of, so an impairment in visual acuity functions can hold back
Near Vision and Far Vision, and measurements measure the function they're a reading of. The ICF is (c) World Health
Organization, CC BY-ND 3.0 IGO: names stay as WHO wrote them, and WHO is credited wherever they're shown.

## Conditions
A condition is something a person has that affects their body or mind: a disease from the Mondo Disease Ontology, such
as asthma or type 2 diabetes, or a feature from the Human Phenotype Ontology (HPO), such as joint hypermobility or
tinnitus. Each has its name, definition and other names as the ontology has them, and the ontology's id, which is its
identity. 262 common ones are seeded, and a person can add any other human disease from Mondo or phenotypic abnormality
from HPO, which is looked up in EBI's Ontology Lookup Service.

A condition is a kind of the nearest broader conditions in the graph, as the ontology arranges them (Alzheimer disease
is a kind of dementia), and affects the body functions and structures it acts on (asthma affects respiration functions
and the lungs). The seeded conditions' links to the body are chosen by hand, and an LLM chooses them for the ones people
add.

A person notes that they **have** a condition, optionally how much it affects them (`mild`, `moderate` or `severe`),
whether a professional diagnosed it, and whether it's under control. Conditions are private to the person. Mondo is
CC BY 4.0, and HPO's terms stay as HPO wrote them, with HPO credited wherever they're shown.

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| Ability | `id`, `name` (unique), `onetId`, `category`, `group`, `description`, `examples` | One of the 46 abilities. `category` is `Cognitive`, `Psychomotor`, `Physical` or `Sensory`, and `group` is O\*NET's group within it, such as "Fine Manipulative Abilities". `examples` are O\*NET's level anchors, from things that take a little of the ability to things that take a lot. Cognitive abilities have a second label, `Cognitive` |
| PhysicalMeasurement | `id`, `name` (unique), `unit`, `better`, `group`, `min`, `max`, `description` | One of the 15 measurements. `better` is `higher`, `lower` or `neither`, `group` is `Body`, `Vitals`, `Fitness` or `Senses`, and `min` and `max` are the lowest and highest readings that can be recorded |
| MeasurementNorm | `sex`, `ageFrom`, `ageTo`, `percentiles`, `values` | The value at each percentile for a sex (`male`, `female` or `all`) and age band. `ageTo` is missing on the oldest band. `percentiles` and `values` are parallel lists |
| BodyFunction | `id`, `code` (unique), `name`, `description`, `includes`, `excludes`, `group`, `subgroup`, `sourceUri` | One of the body functions. `group` is the group it's under, such as "Mental functions", and `subgroup` the group under that, where there is one. `code` and `sourceUri` are the ICF code and the WHO's permanent URI for it, which the seed matches on |
| BodyStructure | the same as BodyFunction | One of the ICF's body structures |
| Condition | `id`, `sourceId` (unique), `source`, `name`, `description`, `synonyms`, `ancestors`, `sourceUri`, `addedAt` | A disease or feature. `sourceId` is the ontology's id, such as `MONDO:0004979` or `HP:0001382`, `source` is `Mondo` or `HPO`, and `sourceUri` is the ontology's permanent URI for it. `synonyms` are its other names, and `ancestors` the ids of every class above it in its ontology, which places it among the other conditions. `addedAt` is on the ones people have added |

A Person carries `normSex`, `male` or `female`, when they've given it: the sex whose norms they're compared with.

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_ABILITY | Person → Ability | `value`, `confidence` | Where they sit among people on the ability, from 0 to 1 with 0.5 typical, and how sure we are of it. No relationship means unmeasured, not average |
| REQUIRES_ABILITY | DreyfusLevel → Ability | `level`, `strength`, `reason` | A skill level that takes the ability (see the Skills graph) |
| HAS_NORM | PhysicalMeasurement → MeasurementNorm | | A measurement's norms |
| MEASURES | PhysicalMeasurement → Ability | | An ability the measurement shows |
| HAS_MEASUREMENT | Person → PhysicalMeasurement | `id`, `value`, `measuredOn`, `recordedAt` | One reading, in the measurement's unit. A person has one per reading, and the latest `measuredOn` is their current value |
| SUBFUNCTION_OF | BodyFunction → BodyFunction | | A narrower function, a kind or part of a broader one (Short-term memory → Memory functions) |
| SUBSTRUCTURE_OF | BodyStructure → BodyStructure | | A part of a larger structure (Structure of upper arm → Structure of upper extremity) |
| UNDERLIES | BodyFunction → Ability | | An ability the function is the basis of |
| MEASURES | PhysicalMeasurement → BodyFunction | | The function the measurement is a reading of |
| HAS_IMPAIRMENT | Person → BodyFunction or BodyStructure | `extent`, `change`, `updatedAt` | An impairment they've noted. `extent` is how much, `mild` to `complete`, and `change`, on a structure only, how it has changed |
| SUBTYPE_OF | Condition → Condition | | A condition that's a kind of a broader one (Alzheimer disease → dementia) |
| AFFECTS | Condition → BodyFunction or BodyStructure | | A function or structure the condition acts on |
| HAS_CONDITION | Person → Condition | `severity`, `diagnosed`, `managed`, `updatedAt` | A condition they've noted. `severity` is `mild`, `moderate` or `severe` when they've said, `diagnosed` whether a professional diagnosed it, and `managed` whether it's under control |

## Example
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

// grip strength shows Static Strength, and its norm for men in their twenties puts the median at 48.1 kg
(g:PhysicalMeasurement {name: "Grip Strength", unit: "kg", better: "higher"})-[:MEASURES]->(s)
(g)-[:HAS_NORM]->(:MeasurementNorm {sex: "male", ageFrom: 18, ageTo: 29,
  percentiles: [1, 3, 5, ..., 50, ..., 97, 99], values: [29.0, 32.7, 34.3, ..., 48.1, ..., 67.2, 73.5]})

// Andrew squeezed 55 kg at 27, which is about the 76th percentile for men his age
(andrew {normSex: "male"})-[:HAS_MEASUREMENT {value: 55.0, measuredOn: date("2026-10-30")}]->(g)

// visual acuity functions underlie Far Vision, and visual acuity is a reading of them. Lulu is moderately short-sighted
(va:BodyFunction {code: "b2100", name: "Visual acuity functions", group: "Sensory functions and pain"})-[:UNDERLIES]->(:Ability {name: "Far Vision"})
(va)-[:SUBFUNCTION_OF]->(:BodyFunction {code: "b210", name: "Seeing functions"})
(:PhysicalMeasurement {name: "Visual Acuity"})-[:MEASURES]->(va)
(lulu)-[:HAS_IMPAIRMENT {extent: "moderate"}]->(va)

// myopia affects visual acuity functions. Lulu was diagnosed, and glasses keep it under control
(my:Condition {sourceId: "MONDO:0001384", source: "Mondo", name: "myopia"})-[:AFFECTS]->(va)
(lulu)-[:HAS_CONDITION {severity: "moderate", diagnosed: true, managed: true}]->(my)

// Andrew is double-jointed
(andrew)-[:HAS_CONDITION {diagnosed: false, managed: false}]->(:Condition {sourceId: "HP:0001382", source: "HPO", name: "Joint hypermobility"})
```
