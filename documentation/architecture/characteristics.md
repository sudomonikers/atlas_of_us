# How the Characteristics Module Works

This explains how a person's characteristics get filled out and how they connect to the rest of the Atlas. For the
graph itself, read `../data_model/characteristics/characteristics.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/characteristics/` | Characteristics, at `/characteristics`: each characteristic's question with its choices |
| API | `application/apis/atlas-api/src/domains/characteristics/` | The characteristics with what Atlas asks and what can be answered, and a person's answers |
| Migration | `application/database/migrations/028_characteristics_node.cypher` | Moved the answers kept in Abilities onto each person's Characteristics node |

## What the user sees
Characteristics is its own page, in Explore the Atlas, beside Abilities. Atlas asks each question in turn, sex,
handedness, eye color, hair color and blood type, and each has its choices to pick one of. A pick shows as soon as it's
made, while it's saved. Each also has a choice that takes the answer back: "Compare me with everyone" for sex, and
"Don't know" for the rest. It takes an account.

## The API
`GET /api/characteristics` returns every characteristic in the order it's asked: its `key`, `name`, `question`,
`choices` and the person's `value`, or null. `PUT /api/characteristics` takes the ones to change, by key, each to one
of its choices or to null, and returns them all. An answer that isn't one of the choices is turned away. The questions
and choices are in the api rather than the graph, since there's only one of each and a person's answers are properties
of one node.

## How it connects
- **Abilities** compares a person's readings with people of their sex and age, and reads their sex from their
  Characteristics node (`characteristics::SEX`). A change of sex moves every reading's percentile, so the api works out
  where they stand on every ability again before it answers. The Abilities page loads their characteristics too, so
  which hand they use names the hand in the steps of the tests done with one.
- **The abilities summary** is written from their characteristics along with everything they've added to Abilities.
