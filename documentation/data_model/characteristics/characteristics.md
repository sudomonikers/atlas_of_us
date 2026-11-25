# Characteristics Graph
A characteristic is a fact about a person's body that's one of a few choices rather than a number: their sex, which
hand they use, their eye color, their hair color and their blood type. They don't change, or hardly ever, and a person
answers each one once. Measurements, such as height and grip strength, are numbers and are in the Abilities graph, and
conditions are in the Abilities graph too.

There's no node per characteristic. Each Person has at most one Characteristics node, made the first time they answer
one, with an answer as a property for each characteristic they've answered. The questions Atlas asks and the choices
that can be answered are in the api, `domains/characteristics`, which only takes an answer that's one of the choices.

| Property | Name | Choices |
|---|---|---|
| `sex` | Sex | `Female`, `Male` |
| `handedness` | Handedness | `Right`, `Left`, `Both` |
| `eyeColor` | Eye Color | `Brown`, `Hazel`, `Amber`, `Green`, `Blue`, `Gray` |
| `hairColor` | Hair Color | `Black`, `Dark brown`, `Light brown`, `Blonde`, `Red`, `Auburn` |
| `bloodType` | Blood Type | `O+`, `O-`, `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-` |

A property that isn't there is a characteristic they haven't answered, or have taken back. A person's characteristics
are private to them.

Two of them are used by Abilities. Sex decides who a person's readings are compared with: people of that sex and their
age, or everyone their age when they haven't said, so a change of sex works out where they stand on every ability
again. Which hand they use names the hand in the steps of the tests done with one.

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| Characteristics | `sex`, `handedness`, `eyeColor`, `hairColor`, `bloodType`, `updatedAt` | A person's answers, each one of its choices above. `updatedAt` is when they last changed one |

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_CHARACTERISTICS | Person → Characteristics | | Their characteristics. No relationship means they haven't answered any |

## Example
```cypher
// Andrew is a right-handed man with brown eyes. He hasn't said what his hair color or blood type is
(andrew)-[:HAS_CHARACTERISTICS]->(:Characteristics {sex: "Male", handedness: "Right", eyeColor: "Brown", updatedAt: datetime()})

// Lulu is a left-handed woman with type O+ blood
(lulu)-[:HAS_CHARACTERISTICS]->(:Characteristics {sex: "Female", handedness: "Left", bloodType: "O+", updatedAt: datetime()})
```
