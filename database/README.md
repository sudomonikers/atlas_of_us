# What is the Atlas Of Us?

The Atlas of Us is an application for users to discover their place in the world and explore who they might become. To accomplish this, we use a massive graph database (Neo4j) to map human potential through interconnected **Domains**—comprehensive frameworks that represent areas of human endeavor, knowledge, and capability.

The primary objective is to show users both who they are now and who they might be. Users can see their current abilities, knowledge, and achievements, then explore the vast landscape of possibilities before them. By visualizing the paths between where they are and where they could go, users gain clarity on how to develop themselves in meaningful directions.

# What does the data look like?

The data model for the Atlas of Us consists of two primary layers:

## Layer 1: Domains and Their Components

Layer 1 contains **Domains** and the fundamental building blocks that compose them. A Domain represents a comprehensive area of human capability—like Chess, Photography, Software Engineering, or Philosophy. Each Domain is structured as a progression through multiple levels, where each level represents a stage of mastery from novice to expert.

### What is a Domain?

A Domain is a structured framework that maps progression through an area of human endeavor. Think of it as a complete "skill tree" that shows:

- What you need to know (Knowledge)
- What you need to be able to do (Skills)
- What personal qualities matter (Traits)
- What accomplishments mark your progress (Milestones)

Each Domain has multiple levels, and achieving each level requires meeting specific requirements across all four component types.

### Domain Components

Every Domain is composed of four types of nodes:

**Knowledge Nodes** represent information, concepts, facts, and understanding that can be acquired through learning. Knowledge is measured using Bloom's Taxonomy across six levels:

- Remember → Understand → Apply → Analyze → Evaluate → Create

**Skill Nodes** represent learned abilities to perform tasks effectively. Skills develop through practice and are measured using the Dreyfus Model across five levels:

- Novice → Advanced Beginner → Competent → Proficient → Expert

**Trait Nodes** represent inherent or intrinsic qualities that exist on a continuous spectrum from 0-100. Unlike knowledge (acquired) or skills (learned), traits are fundamental characteristics influenced by nature, nurture, or both.

**Milestone Nodes** represent binary accomplishments—concrete achievements that you either have or haven't completed.

### Domain Structure

A Domain contains:

1. **Domain_Level nodes** - Each representing a stage of progression (e.g., "Novice Player", "Developing Player", "Master")
2. **Component nodes** (Knowledge, Skills, Traits, Milestones) - The actual capabilities and achievements
3. **REQUIRES relationships** - Connecting levels to their required components at specific proficiency levels

For example, a Chess Domain might have:

- A "Competent Player" level that requires:
    - 8 Knowledge nodes, with 4 at "Apply" level (e.g., Common Openings, Tactical Motifs)
    - 4 Skill nodes, with 2 at "Competent" level (e.g., Board Evaluation, Strategic Planning)
    - 2 Traits at minimum scores (Pattern Recognition ≥ 60, Strategic Thinking ≥ 50)
    - One of several Milestone options (Tournament Participation OR 1500+ ELO OR Beat Rated Opponent)

Component nodes are **shared across the Domain**. The same "Tactical Calculation" skill might be required at "Novice" level for one Domain_Level and at "Proficient" level for another. The level of proficiency required is stored on the relationship, not on the node itself.

### Prerequisites and Dependencies

Components can have prerequisites:

- **Knowledge** can require other Knowledge (e.g., "Advanced Calculus" requires "Basic Calculus")
- **Skills** can require other Skills, Knowledge, or Traits (e.g., "Advanced Calculation" requires "Tactical Calculation" at Competent level)
- **Milestones** can require Skills, Knowledge, Traits, or other Milestones (e.g., "Tournament Win" requires "Tournament Participation")
- **Traits** generally don't have prerequisites (they're intrinsic qualities)

This creates a rich dependency graph that shows not just what you need to achieve, but the foundational requirements that support higher-level capabilities.

### Flexibility in Requirements

Domain levels can specify requirement types with flexibility:

- **Any-of Milestones**: Some levels accept achieving ANY of several milestone options (e.g., "1500+ ELO OR Tournament Participation OR Beat Rated Opponent")
- **All-required Milestones**: Higher levels might require ALL specified milestones
- **Minimum counts with progression**: A level might require "8 knowledge nodes, with 4 at Apply level or higher"—meaning you need 8 total knowledge nodes, and at least 4 of them must be at Apply level (though they could be at Analyze, Evaluate, or Create)
- **Trait thresholds**: Specific minimum scores required for relevant traits

## Layer 2: People

Layer 2 contains **Person nodes**—individual people and their relationships to the Domains and components in Layer 1.

### Person Node Structure

Each Person node represents an individual user:

```jsx
{
  Properties: {
    name: string,
    phone_number: number,
    photo: href,
    meta_info: {
      username: string,
      password: hash
    }
  },
  Labels: ['Person']
}

```

### Person Relationships

People connect to Layer 1 through relationships that indicate their current level of proficiency or achievement:

**Knowledge relationships:**

```jsx
(person)-[:HAS_KNOWLEDGE {bloom_level: 'Apply'}]->(k:Knowledge {name: 'Opening Principles'})

```

**Skill relationships:**

```jsx
(person)-[:HAS_SKILL {dreyfus_level: 'Competent'}]->(s:Skill {name: 'Board Evaluation'})

```

**Trait relationships:**

```jsx
(person)-[:HAS_TRAIT {score: 75}]->(t:Trait {name: 'Pattern Recognition'})

```

**Milestone relationships:**

```jsx
(person)-[:ACHIEVED {
  date: date('2024-03-15'),
  evidence: 'Won Michigan State Championship'
}]->(m:Milestone {name: 'Tournament Win'})

```

**Domain relationships:**

```jsx
(person)-[:PURSUING {
  current_level: 3,
  started_date: date('2023-01-01')
}]->(d:Domain {name: 'Chess'})

```

### Person-to-Person Relationships

People can also have relationships with each other, representing social connections, mentorship, collaboration, and other interpersonal dynamics. *(Details to be expanded)*

# How the System Works

Users interact with the Atlas of Us by:

1. **Mapping themselves** - Establishing their current relationships to Knowledge, Skills, Traits, and Milestones
2. **Choosing Domains** - Selecting which areas of human endeavor they want to pursue
3. **Tracking progress** - Updating their component proficiency levels as they develop
4. **Discovering possibilities** - Exploring Domains they haven't yet pursued to see new directions for growth
5. **Understanding requirements** - Seeing exactly what's needed to reach the next level in their chosen Domains
6. **Following prerequisites** - Understanding the foundational components they need before tackling advanced capabilities

The graph structure enables powerful queries like:

- "What do I need to reach the next level in this Domain?"
- "Which Domains align with my current Skills and Knowledge?"
- "What are the shortest paths from where I am to where I want to be?"
- "Who else is pursuing similar Domains?"
- "What foundational Knowledge am I missing for this advanced Skill?"

By maintaining strict data structures while allowing rich, complex relationships, the Atlas of Us creates a comprehensive map of human potential that users can navigate to understand themselves and their possibilities.

DOMAINS DOCS - ./documentation/domains.md
KNOWLEDGE DOCS - ./documentation/knowledge.md
MILESTONES DOCS - ./documentation/milestones.md
SKILLS DOCS - ./documentation/skills.md
TRAITS DOCS - ./documentation/traits.md