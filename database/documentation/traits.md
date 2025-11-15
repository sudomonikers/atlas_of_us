# Traits

Traits represent inherent or intrinsic qualities of a person that exist on a continuous spectrum. Unlike skills (which are learned) or knowledge (which is acquired), traits are fundamental characteristics that may be influenced by nature, nurture, or both.

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