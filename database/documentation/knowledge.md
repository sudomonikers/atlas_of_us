# Knowledge 

Knowledge represents information, concepts, facts, and understanding that can be acquired through learning, study, and experience. Knowledge is measured using Bloom's Taxonomy, which describes increasing levels of cognitive complexity.

## **Knowledge Properties**

- **name** (string) - The knowledge identifier (e.g., "Piece Movements", "Opening Principles")
- **description** (string) - What this knowledge encompasses and why it's important
- **how_to_learn** (string) - Practical guidance on how to acquire this knowledge, including recommended resources, methods, or approaches
- **remember_level** (string) - What someone should be able to recall and recognize at this level
- **understand_level** (string) - What someone should be able to explain and interpret at this level
- **apply_level** (string) - What someone should be able to use and implement at this level
- **analyze_level** (string) - What someone should be able to break down and examine at this level
- **evaluate_level** (string) - What someone should be able to judge and critique at this level
- **create_level** (string) - What someone should be able to generate and design at this level

## **Bloom's Taxonomy Levels**

1. **Remember** - Recall facts and basic concepts
2. **Understand** - Explain ideas or concepts
3. **Apply** - Use information in new situations
4. **Analyze** - Draw connections among ideas
5. **Evaluate** - Justify a stand or decision
6. **Create** - Produce new or original work

## **Knowledge Prerequisites**

Knowledge nodes can point to other knowledge nodes to indicate prerequisite learning:

```jsx
CREATE (k1:Knowledge {name: 'Advanced Calculus'})-[:REQUIRES_KNOWLEDGE]->(k2:Knowledge {name: 'Basic Calculus'})
```

## **Example Knowledge Node**

```jsx
MERGE (k:Knowledge {
  name: 'Opening Principles',
  description: 'Fundamental strategic concepts for the opening phase of a chess game, including piece development, center control, and king safety',
  how_to_learn: 'Study annotated games focusing on opening play. Practice 10-15 different games emphasizing these principles. Use chess tactics trainers focusing on opening mistakes. Read "Logical Chess Move by Move" by Irving Chernev or similar instructional books.',
  remember_level: 'Recall the basic principles: develop pieces, control the center, castle early, don\'t move the same piece twice',
  understand_level: 'Explain why each principle matters and how they relate to each other. Describe what makes a good versus bad opening position',
  apply_level: 'Apply these principles in your own games. Choose moves that follow opening principles even in unfamiliar positions',
  analyze_level: 'Analyze opening positions to identify which principles are being followed or violated. Compare different opening systems and their strategic goals',
  evaluate_level: 'Evaluate the quality of opening play in master games. Justify why certain principle violations might be acceptable in specific contexts',
  create_level: 'Develop your own opening repertoire based on these principles. Create training materials or lessons teaching opening principles to others'
})
```

## **Usage in Graph**

When a person has knowledge at a specific Bloom level:

```jsx
CREATE (person:Person {name: 'John'})-[:HAS_KNOWLEDGE {bloom_level: 'Apply'}]->(k:Knowledge {name: 'Opening Principles'})
```

When a domain level requires knowledge at a minimum Bloom level:

```jsx
CREATE (level:Domain_Level)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k:Knowledge {name: 'Opening Principles'})
```

When knowledge has prerequisites:

```jsx
MERGE (k_advanced:Knowledge {name: 'Tactical Motifs'})
MERGE (k_basic:Knowledge {name: 'Basic Tactics'})
CREATE (k_advanced)-[:REQUIRES_KNOWLEDGE]->(k_basic)
```