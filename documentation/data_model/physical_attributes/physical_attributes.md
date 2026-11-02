# Physical Attributes Graph
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

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| Ability | `id`, `name` (unique), `onetId`, `category`, `group`, `description`, `examples` | One of the 46 abilities. `category` is `Cognitive`, `Psychomotor`, `Physical` or `Sensory`, and `group` is O\*NET's group within it, such as "Fine Manipulative Abilities". `examples` are O\*NET's level anchors, from things that take a little of the ability to things that take a lot. Cognitive abilities have a second label, `Cognitive` |

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_ABILITY | Person → Ability | `value`, `confidence` | Where they sit among people on the ability, from 0 to 1 with 0.5 typical, and how sure we are of it. No relationship means unmeasured, not average |
| REQUIRES_ABILITY | DreyfusLevel → Ability | `level`, `strength`, `reason` | A skill level that takes the ability (see the Skills graph) |

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
```
