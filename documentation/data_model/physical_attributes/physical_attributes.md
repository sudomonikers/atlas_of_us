# Physical Attributes Graph
A person's body is an important part of who they are. It affects the Skills they can have and the Ideas they can
understand, and influences their PersonalityTraits. The graph is more than skin, muscle and bone: it's everything from
the nervous system to abstract things like reaction time, and the conditions a person may have. It's very large but
mostly known, so most of it is seeded, and it changes little over time. It covers:

1. **Body structure,** seeded from Uberon.
2. **Conditions,** seeded from Mondo and HPO, and linked to the structures they affect.
3. **Measurements,** compiled by hand and linked to structures and conditions. These are what most people will care
   about.

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| PhysicalMeasurement | `name`, `description`, `vector` | Something about a body that can be measured, such as hand-eye coordination |

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_MEASUREMENT | Person → PhysicalMeasurement | `amount` | How much of it they have, from 0 (essentially none) to 1 (extremely high) |

How people relate to body structures and conditions, and the labels for those, are still to be defined.

## Example
```cypher
(a:Person)-[:HAS_MEASUREMENT {amount: 0.9}]->(:PhysicalMeasurement {name: "Hand-Eye Coordination", description: "Using what you see to guide your hands through a precise task"})
```
