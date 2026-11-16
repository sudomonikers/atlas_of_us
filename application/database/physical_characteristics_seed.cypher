// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: characteristics
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// One static Characteristic node per characteristic: a fact about a body that's
// one of a few choices, rather than a number, such as which hand someone uses
// or their eye color. A Person links to the ones they've answered with
// HAS_CHARACTERISTIC {value, setAt}, `value` being one of the `choices`.
// `order` is the order they're asked in. Sex also decides who a person's
// readings are compared with: people of that sex and their age, or everyone
// their age when they haven't said.
//
// Idempotent: safe to re-run. MERGE on name, everything else overwritten from
// this file on every run. id is set once, when the characteristic is first
// created, so it never changes on a re-run.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT characteristic_name_unique IF NOT EXISTS
FOR (n:Characteristic) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT characteristic_id_unique IF NOT EXISTS
FOR (n:Characteristic) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Characteristics
// -----------------------------------------------------------------------------

UNWIND [
  { name: "Sex", order: 0,
    question: "Men's and women's bodies differ quite a bit, so I compare your readings with people of your sex and age. What's your sex? Skip it to be compared with everyone your age.",
    choices: ["Female", "Male"] },
  { name: "Handedness", order: 1,
    question: "Which hand do you use most, for writing, throwing or using a fork?",
    choices: ["Right", "Left", "Both"] },
  { name: "Eye Color", order: 2,
    question: "What color are your eyes?",
    choices: ["Brown", "Hazel", "Amber", "Green", "Blue", "Gray"] },
  { name: "Hair Color", order: 3,
    question: "What color is your hair naturally, or was it before it went gray?",
    choices: ["Black", "Dark brown", "Light brown", "Blonde", "Red", "Auburn"] },
  { name: "Blood Type", order: 4,
    question: "What's your blood type? It's on a blood donor card, and your doctor may have it on record.",
    choices: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] }
] AS c
MERGE (n:Characteristic {name: c.name})
ON CREATE SET n.id = randomUUID()
SET n.order = c.order,
    n.question = c.question,
    n.choices = c.choices;
