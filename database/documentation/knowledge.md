# Knowledge

Knowledge represents information, concepts, facts, and understanding that can be acquired through learning, study, and experience. Knowledge is measured using Bloom's Taxonomy, which describes increasing levels of cognitive complexity.

## **Atomic Node Principle**

**IMPORTANT:** Each knowledge node must represent a SINGLE, atomic concept. Do not combine multiple concepts into one node using "and" or similar conjunctions.

**Bad Examples:**
- "Logical and Analytical Thinking" (should be two nodes: "Logical Thinking" and "Analytical Thinking")
- "Variables and Data Types" (should be two nodes: "Variables" and "Data Types")
- "Opening Principles and Strategies" (should be two nodes: "Opening Principles" and "Opening Strategies")

**Good Examples:**
- "Logical Thinking"
- "Variables"
- "Opening Principles"

If you find yourself using "and" in a node name, split it into separate nodes and use prerequisite relationships to connect them if needed.

## **Domain-Specific vs Generic Knowledge**

**IMPORTANT:** Knowledge nodes should generally be domain-specific because the actual content being learned differs between domains. Use domain prefixes to avoid conflicts.

**When to make knowledge DOMAIN-SPECIFIC (most cases):**

Knowledge is domain-specific when the actual content, facts, or concepts differ between domains:

- "Chess Opening Principles" vs "Go Opening Principles" - Completely different strategic concepts
- "Python Variables" vs "JavaScript Variables" - Different syntax, scoping rules, behaviors
- "Chess Tactical Patterns" - Specific to chess piece movements and board positions
- "Programming Design Patterns" - Specific to software architecture

**Use domain prefixes for domain-specific knowledge:**
- "Chess Opening Principles" (not just "Opening Principles")
- "Python Variables" (not just "Variables")
- "Programming Algorithms" (not just "Algorithms")

**When to make knowledge GENERIC (rare cases):**

Only make knowledge generic when the exact same content applies identically across multiple domains:

- "Mathematical Logic" - Same regardless of application domain
- "Boolean Algebra" - Same in programming, electronics, mathematics
- "Newton's Laws of Motion" - Same in physics regardless of context

**Examples:**

```cypher
// Domain-specific knowledge (typical case)
MERGE (k:Knowledge {name: 'Chess Opening Principles'})
SET k.description = 'Fundamental strategic concepts for the opening phase of a chess game, including piece development, center control, and king safety',
    k.how_to_learn = 'Study annotated chess games focusing on opening play...'

// Generic knowledge (rare case)
MERGE (k:Knowledge {name: 'Boolean Algebra'})
SET k.description = 'Mathematical logic dealing with binary values and logical operations',
    k.how_to_learn = 'Study truth tables, logical operators, and De Morgan\'s laws...'
```

**Default approach:** When in doubt, make knowledge domain-specific with a domain prefix.

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