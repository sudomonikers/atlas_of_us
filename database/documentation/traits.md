# Traits

Traits represent inherent or intrinsic qualities of a person that exist on a continuous spectrum. Unlike skills (which are learned) or knowledge (which is acquired), traits are fundamental characteristics that may be influenced by nature, nurture, or both.

## **Atomic Node Principle**

**IMPORTANT:** Each trait node must represent a SINGLE, atomic characteristic. Do not combine multiple traits into one node using "and" or similar conjunctions.

**Bad Examples:**
- "Logical and Analytical Thinking" (should be two nodes: "Logical Thinking" and "Analytical Thinking")
- "Patience and Perseverance" (should be two nodes: "Patience" and "Perseverance")
- "Focus and Concentration" (should be two nodes: "Focus" and "Concentration")

**Good Examples:**
- "Logical Thinking"
- "Patience"
- "Focus"

If you find yourself using "and" in a node name, split it into separate nodes. Traits are measured independently on the 0-100 scale.

## **Domain-Specific vs Generic Traits**

**IMPORTANT:** Trait nodes should generally be GENERIC because traits represent inherent cognitive abilities and personality characteristics that manifest consistently across domains.

**When to make traits GENERIC (most cases):**

Traits are generic when they represent fundamental cognitive abilities or personality characteristics:

- "Pattern Recognition" - Same cognitive ability whether recognizing chess positions, musical patterns, or code patterns
- "Logical Thinking" - Same mental process in programming, chess, mathematics, or philosophy
- "Focus" - Same ability to concentrate whether studying, playing chess, or coding
- "Mental Endurance" - Same capacity whether in long chess games, debugging sessions, or marathons
- "Risk Tolerance" - Same personality trait whether making chess moves, investment decisions, or life choices
- "Competitive Drive" - Same motivation in sports, games, or professional settings

**Do NOT use domain prefixes for generic traits:**
- "Pattern Recognition" (not "Chess Pattern Recognition")
- "Logical Thinking" (not "Programming Logic")
- "Focus" (not "Chess Focus")

**When to make traits DOMAIN-SPECIFIC (extremely rare):**

Only create domain-specific traits if a characteristic is truly unique to that domain and cannot be described as a manifestation of a general trait. This should be extremely rare.

**Examples:**

```cypher
// Generic trait (typical case)
MERGE (t:Trait {name: 'Pattern Recognition'})
SET t.description = 'Ability to identify, recognize, and recall patterns, relationships, and regularities in information or experiences',
    t.measurement_criteria = 'Assessed through speed and accuracy in identifying patterns across various contexts (visual, numerical, conceptual). Low (0-25): Struggles to see patterns even when explicitly shown. High (76-100): Intuitively recognizes complex patterns across unfamiliar domains.'

// How domains use this trait
MATCH (d:Domain {name: 'Chess'}), (t:Trait {name: 'Pattern Recognition'})
CREATE (d)-[:REQUIRES_TRAIT {min_score: 60}]->(t)

MATCH (d:Domain {name: 'Programming'}), (t:Trait {name: 'Pattern Recognition'})
CREATE (d)-[:REQUIRES_TRAIT {min_score: 55}]->(t)
```

**Default approach:** Traits should almost always be generic. If you're considering a domain prefix for a trait, reconsider whether it's truly a trait or actually domain-specific knowledge/skill.

## Trait Properties

- **name** (string) - The trait identifier (e.g., "Pattern Recognition", "Strategic Thinking")
- **description** (string) - What this trait represents and why it matters
- **measurement_criteria** (string) - How this trait is measured on the 0-100 scale, including what constitutes low, medium, and high scores

## Measurement Scale

All traits are measured from 0-100:

- **0-25**: Low - Significant challenges or minimal natural ability in this area
- **26-50**: Moderate - Average or developing capability
- **51-75**: High - Strong natural ability or well-developed capacity
- **76-100**: Exceptional - Outstanding or rare capability

## Example Trait Node

```jsx
MERGE (t:Trait {
  name: 'Pattern Recognition',
  description: 'Ability to identify, recognize, and recall patterns, relationships, and regularities in information or experiences',
  measurement_criteria: 'Assessed through speed and accuracy in identifying patterns across various contexts (visual, numerical, conceptual). Low (0-25): Struggles to see patterns even when explicitly shown. Moderate (26-50): Recognizes common patterns with time and focus. High (51-75): Quickly identifies patterns in familiar domains. Exceptional (76-100): Intuitively recognizes complex patterns across unfamiliar domains.'
})
```

## Usage in Graph

When a person has a trait score:

```jsx
CREATE (person:Person {name: 'John'})-[:HAS_TRAIT {score: 75}]->(t:Trait {name: 'Pattern Recognition'})
```

When a domain level requires a minimum trait score:

```jsx
CREATE (level:Domain_Level)-[:REQUIRES_TRAIT {min_score: 60}]->(t:Trait {name: 'Pattern Recognition'})
```