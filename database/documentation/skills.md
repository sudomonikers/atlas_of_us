# Skills

Skills represent learned abilities to perform tasks or activities effectively. Skills are developed through practice and experience, measured using the Dreyfus Model of Skill Acquisition, which describes the progression from rigid rule-following to fluid expertise.

## **Atomic Node Principle**

**IMPORTANT:** Each skill node must represent a SINGLE, atomic ability. Do not combine multiple skills into one node using "and" or similar conjunctions.

**Bad Examples:**
- "Debugging and Testing" (should be two nodes: "Debugging" and "Testing")
- "Planning and Execution" (should be two nodes: "Planning" and "Execution")
- "Communication and Collaboration" (should be two nodes: "Communication" and "Collaboration")

**Good Examples:**
- "Debugging"
- "Planning"
- "Communication"

If you find yourself using "and" in a node name, split it into separate nodes and use prerequisite relationships to connect them if needed.

## **Domain-Specific vs Generic Skills**

**IMPORTANT:** Skill nodes should generally be domain-specific because the actual practice and application differs between domains. Use domain prefixes to avoid conflicts.

**When to make skills DOMAIN-SPECIFIC (most cases):**

Skills are domain-specific when the actual practice, techniques, or application differs between domains:

- "Chess Tactical Calculation" vs "Go Reading" - Different board states, pieces, rules
- "Python Debugging" vs "JavaScript Debugging" - Different tools, error types, stack traces
- "Chess Position Evaluation" - Specific to chess board positions and piece values
- "Programming Code Review" - Specific to reading and analyzing code

**Use domain prefixes for domain-specific skills:**
- "Chess Tactical Calculation" (not just "Tactical Calculation")
- "Python Debugging" (not just "Debugging")
- "Programming Refactoring" (not just "Refactoring")

**When to make skills GENERIC (rare cases):**

Only make skills generic when the exact same practice and application applies identically across multiple domains:

- "Problem Solving" - General cognitive skill applicable everywhere
- "Decision Making" - General skill used in all domains
- "Time Management" - Same practice across all contexts

**Examples:**

```cypher
// Domain-specific skill (typical case)
MERGE (s:Skill {name: 'Chess Tactical Calculation'})
SET s.description = 'The ability to visualize and calculate sequences of moves, considering opponent responses and evaluating resulting positions',
    s.how_to_develop = 'Practice chess tactics puzzles, analyze tactical positions...'

// Generic skill (rare case)
MERGE (s:Skill {name: 'Problem Solving'})
SET s.description = 'The ability to identify problems, analyze root causes, and develop effective solutions',
    s.how_to_develop = 'Practice breaking down complex problems systematically...'
```

**Default approach:** When in doubt, make skills domain-specific with a domain prefix.

## **Cross-Domain Skill Transfer**

Domain-specific skill nodes should link to their general counterpart using the `GENERALIZES_TO` relationship. This enables users to discover how skills developed in one domain might transfer to others.

**How it works:**

1. Domain-specific skills (e.g., "Chess Tactical Calculation") link to a general skill node (e.g., "Tactical Calculation")
2. Other domain-specific skill nodes also link to the same general node (e.g., "Go Reading" → "Tactical Calculation")
3. Users can traverse from their domain-specific skill → general skill → other domains' implementations

**Relationship Direction:**
```
(domain_specific)-[:GENERALIZES_TO]->(general)
```

**Example:**
```cypher
// Create domain-specific skill nodes
MERGE (s_chess:Skill {name: 'Chess Tactical Calculation'})
SET s_chess.description = 'The ability to visualize and calculate sequences of chess moves'

MERGE (s_go:Skill {name: 'Go Reading'})
SET s_go.description = 'The ability to visualize and calculate sequences of Go moves'

MERGE (s_poker:Skill {name: 'Poker Hand Reading'})
SET s_poker.description = 'The ability to deduce opponent hand ranges and calculate optimal plays'

// Create the general skill node
MERGE (s_general:Skill {name: 'Tactical Calculation'})
SET s_general.description = 'The general ability to analyze sequential possibilities, evaluate outcomes, and select optimal moves in competitive scenarios'

// Link domain-specific to general
CREATE (s_chess)-[:GENERALIZES_TO]->(s_general)
CREATE (s_go)-[:GENERALIZES_TO]->(s_general)
CREATE (s_poker)-[:GENERALIZES_TO]->(s_general)
```

**When to create general skill nodes:**

- When 2+ domains share conceptually similar skills
- When the general skill represents a real transferable ability (not just an abstraction)
- When users would benefit from seeing cross-domain skill transfer opportunities

**General skill node naming:**

- Remove domain prefixes (e.g., "Chess Tactical Calculation" → "Tactical Calculation")
- Use clear, generic terminology that describes the transferable ability
- Avoid overly abstract names that lose meaning

## **Skill Properties**

- **name** (string) - The skill identifier (e.g., "Board Evaluation", "Strategic Planning")
- **description** (string) - What this skill encompasses and why it's important
- **how_to_develop** (string) - Practical guidance on how to develop this skill, including recommended practice methods, exercises, or approaches
- **novice_level** (string) - What characterizes performance at this level and how to progress beyond it
- **advanced_beginner_level** (string) - What characterizes performance at this level and how to progress beyond it
- **competent_level** (string) - What characterizes performance at this level and how to progress beyond it
- **proficient_level** (string) - What characterizes performance at this level and how to progress beyond it
- **expert_level** (string) - What characterizes performance at this level and what mastery looks like

## **Dreyfus Model Levels**

1. **Novice** - Follows rigid rules, no discretionary judgment
2. **Advanced Beginner** - Begins recognizing patterns from experience
3. **Competent** - Can troubleshoot and make deliberate choices
4. **Proficient** - Sees situations holistically, uses maxims and intuition
5. **Expert** - Operates from deep tacit understanding, performance is fluid and intuitive

## **Skill Prerequisites**

Skills can have multiple types of prerequisites:

**Required Skills:**

```jsx
CREATE (s1:Skill {name: 'Advanced Calculation'})-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2:Skill {name: 'Tactical Calculation'})
```

**Required Knowledge:**

```jsx
CREATE (s:Skill {name: 'Board Evaluation'})-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k:Knowledge {name: 'Positional Concepts'})
```

**Required Traits:**

```jsx
CREATE (s:Skill {name: 'Pattern Recognition Skills'})-[:REQUIRES_TRAIT {min_score: 50}]->(t:Trait {name: 'Pattern Recognition'})
```

## **Example Skill Node**

```jsx
MERGE (s:Skill {
  name: 'Board Evaluation',
  description: 'The ability to assess a chess position and determine which side has the advantage, considering material, piece activity, king safety, pawn structure, and strategic factors',
  how_to_develop: 'Practice evaluating positions from master games before seeing the next move. Study annotated games with detailed positional explanations. Use the "guess the move" method with grandmaster games. Analyze your own games focusing on critical positions. Work with a coach or stronger player for feedback on your evaluations.',
  novice_level: 'Counts material and uses basic rules (e.g., "knights on the rim are dim"). Struggles when material is equal. Follows checklists mechanically without understanding context. Progress by studying simple positions with clear advantages and learning basic positional factors beyond material.',
  advanced_beginner_level: 'Recognizes common patterns like weak pawns, open files, and piece placement issues. Can identify obvious positional advantages but struggles with complex or unclear positions. Beginning to see multiple factors simultaneously. Progress by analyzing increasingly complex positions and learning how factors interact.',
  competent_level: 'Systematically evaluates multiple factors (material, development, king safety, pawn structure, piece activity) and weighs them deliberately. Can handle most positions methodically, though it requires conscious effort. Makes sound judgments in familiar position types. Progress by building pattern recognition in diverse positions and developing intuition through extensive analysis.',
  proficient_level: 'Quickly grasps the key features of a position intuitively. Sees positions holistically rather than as a checklist. Accurately evaluates complex positions where multiple factors conflict. Recognizes subtle positional nuances. Progress by studying master-level games, working on positions where the evaluation is unclear, and developing deeper strategic understanding.',
  expert_level: 'Evaluates positions instantly and accurately through deep intuitive understanding. Perceives subtle imbalances that others miss. Fluidly weighs contradictory factors without conscious deliberation. Can explain evaluations clearly but operates primarily from tacit knowledge. Evaluation becomes second nature and highly reliable even in novel positions.'
})
```

## **Usage in Graph**

When a person has a skill at a specific Dreyfus level:

```jsx
CREATE (person:Person {name: 'John'})-[:HAS_SKILL {dreyfus_level: 'Competent'}]->(s:Skill {name: 'Board Evaluation'})
```

When a domain level requires a skill at a minimum Dreyfus level:

```jsx
CREATE (level:Domain_Level)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s:Skill {name: 'Board Evaluation'})
```

When a skill requires other skills, knowledge, or traits:

```jsx
MERGE (s_advanced:Skill {name: 'Board Evaluation'})
MERGE (s_basic:Skill {name: 'Tactical Calculation'})
MERGE (k:Knowledge {name: 'Positional Concepts'})
MERGE (t:Trait {name: 'Pattern Recognition'})

CREATE (s_advanced)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s_basic)
CREATE (s_advanced)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k)
CREATE (s_advanced)-[:REQUIRES_TRAIT {min_score: 60}]->(t)
```