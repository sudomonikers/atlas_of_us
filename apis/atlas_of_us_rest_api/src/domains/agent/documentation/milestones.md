# Milestones

Milestones represent binary accomplishments or achievements that a person either has or has not completed. Unlike skills and knowledge which exist on a spectrum, milestones are concrete markers of achievement.

## **Atomic Node Principle**

**IMPORTANT:** Each milestone node must represent a SINGLE, atomic accomplishment. Do not combine multiple achievements into one node using "and" or similar conjunctions.

**Bad Examples:**
- "Complete First Project and Deploy to Production" (should be two nodes: "Complete First Project" and "Deploy Project to Production")
- "Win Tournament and Achieve Rating" (should be two nodes: "Win Tournament" and "Achieve Target Rating")
- "Publish Paper and Present at Conference" (should be two nodes: "Publish Paper" and "Present at Conference")

**Good Examples:**
- "Complete First Project"
- "Win Tournament"
- "Publish Paper"

If you find yourself using "and" in a node name, split it into separate nodes and use prerequisite relationships to connect them if needed.

## Milestone Properties

- **name** (string) - The milestone identifier (e.g., "Tournament Participation", "2200+ ELO", "Published Analysis")
- **description** (string) - What this milestone represents and why it's significant
- **how_to_achieve** (string) - Practical guidance on how to accomplish this milestone, including steps, requirements, or approaches

## Milestone Prerequisites

Milestones can have multiple types of prerequisites that must be met before achievement is possible:

**Required Skills:**

```jsx
CREATE (m:Milestone {name: 'Tournament Win'})-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s:Skill {name: 'Game Preparation'})
```

**Required Knowledge:**

```jsx
CREATE (m:Milestone {name: 'Published Analysis'})-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Evaluate'}]->(k:Knowledge {name: 'Game Analysis Methods'})
```

**Required Traits:**

```jsx
CREATE (m:Milestone {name: '2200+ ELO'})-[:REQUIRES_TRAIT {min_score: 85}]->(t:Trait {name: 'Mental Endurance'})
```

**Required Other Milestones:**

```jsx
CREATE (m1:Milestone {name: 'Tournament Win'})-[:REQUIRES_MILESTONE]->(m2:Milestone {name: 'Tournament Participation'})
```

## Example Milestone Node

```jsx
MERGE (m:Milestone {
  name: 'Tournament Win',
  description: 'Win a rated chess tournament with at least 5 participants, demonstrating competitive skill and consistency under tournament conditions',
  how_to_achieve: 'First, participate in several tournaments to gain experience with tournament conditions (time pressure, multiple games, different opponents). Build your rating above 1800 to be competitive. Develop a solid opening repertoire and practice endgames extensively. Study your opponents before games when possible. Maintain physical and mental fitness during multi-day events. Start with smaller local tournaments before attempting larger competitive events. Focus on consistent play rather than brilliant games - avoiding mistakes is often more important than finding the best moves.'
})
```

## Usage in Graph

When a person has achieved a milestone:

```jsx
CREATE (person:Person {name: 'John'})-[:ACHIEVED {
  date: date('2024-03-15'),
  evidence: 'Won the Michigan State Chess Championship, score 5.5/6'
}]->(m:Milestone {name: 'Tournament Win'})
```

For milestones achieved over a period:

```jsx
CREATE (person:Person {name: 'John'})-[:ACHIEVED {
  start_date: date('2023-01-01'),
  end_date: date('2024-03-15'),
  evidence: 'Reached 2250 ELO on USCF rating list dated March 15, 2024'
}]->(m:Milestone {name: '2200+ ELO'})
```

When a domain level requires a milestone:

```jsx
CREATE (level:Domain_Level)-[:REQUIRES_MILESTONE]->(m:Milestone {name: 'Tournament Win'})
```

When a milestone has prerequisites:

```jsx
MERGE (m:Milestone {name: 'Tournament Win'})
MERGE (m_prereq:Milestone {name: 'Tournament Participation'})
MERGE (s:Skill {name: 'Game Preparation'})
MERGE (k:Knowledge {name: 'Tournament Strategy'})
MERGE (t:Trait {name: 'Mental Endurance'})

CREATE (m)-[:REQUIRES_MILESTONE]->(m_prereq)
CREATE (m)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s)
CREATE (m)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k)
CREATE (m)-[:REQUIRES_TRAIT {min_score: 65}]->(t)
```

## Milestone Types

Milestones can represent various types of achievements:

- **Quantitative:** Reaching a specific number or rating (e.g., "2200+ ELO", "Run a 5K under 20 minutes")
- **Qualitative:** Completing a specific activity (e.g., "Tournament Participation", "Complete First Full Game")
- **Creative:** Producing work (e.g., "Published Analysis", "Released Open Source Project")
- **Social:** Relationship or community achievements (e.g., "Mentored a Player to 1800+", "Organized a Tournament")