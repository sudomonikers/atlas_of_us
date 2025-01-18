# Universal Knowledge Graph Base Structure

## Core Node Types

### 1. (:Concept)
- Represents fundamental ideas, theories, or abstract constructs
- Properties:
  * `name`: string [required, unique]
  * `description`: string
  * `abstractionLevel`: enum ['foundational', 'intermediate', 'advanced']
  * `domain`: string [the high-level field this belongs to]
Properties Example:
```cypher
MERGE (c:Concept {
    name: 'Natural Selection',
    description: 'Process of biological change over time',
    abstractionLevel: 'foundational',
    domain: 'Biology'
})
```

### 2. (:Entity)
- Represents concrete, tangible, or specific instances
- Properties:
  * `name`: string [required, unique]
  * `type`: string
  * `temporalRange`: string [when applicable]
  * `domain`: string
Properties Example:
```cypher
MERGE (e:Entity {
    name: 'World War II',
    type: 'Historical Event',
    temporalRange: '1939-1945',
    domain: 'History'
})
```

### 3. (:Process)
- Represents methods, procedures, or sequences of actions
- Properties:
  * `name`: string [required, unique]
  * `purpose`: string
  * `sequential`: boolean
  * `domain`: string
Properties Example:
```cypher
MERGE (p:Process {
    name: 'Photosynthesis',
    purpose: 'Convert light energy to chemical energy',
    sequential: true,
    domain: 'Biology'
})
```

### 4. (:Principle)
- Represents fundamental rules, laws, or guidelines
- Properties:
  * `name`: string [required, unique]
  * `scope`: string
  * `universality`: enum ['domain-specific', 'cross-domain', 'universal']
  * `domain`: string
Properties Example:
```cypher
MERGE (p:Principle {
    name: 'Conservation of Energy',
    scope: 'Physical Systems',
    universality: 'universal',
    domain: 'Physics'
})
```

## Core Relationship Types

### 1. [:PART_OF]
- Represents hierarchical containment
- Properties:
  * `type`: string ['physical', 'logical', 'conceptual']
  * `required`: boolean
Example:
```cypher
MATCH (heart:Entity {name: 'Heart'}), (system:Entity {name: 'Circulatory System'})
MERGE (heart)-[:PART_OF {type: 'physical', required: true}]->(system)
```

### 2. [:RELATES_TO]
- Represents non-hierarchical associations
- Properties:
  * `strength`: float [0-1]
  * `nature`: string
Example:
```cypher
MATCH (a:Concept), (b:Concept)
WHERE a.name = 'Supply' AND b.name = 'Demand'
MERGE (a)-[:RELATES_TO {strength: 0.9, nature: 'economic principle'}]->(b)
```

### 3. [:LEADS_TO]
- Represents causal or sequential relationships
- Properties:
  * `timeframe`: string
  * `certainty`: float [0-1]
Example:
```cypher
MATCH (cause:Event), (effect:Event)
MERGE (cause)-[:LEADS_TO {timeframe: 'immediate', certainty: 0.95}]->(effect)
```

### 4. [:INSTANCE_OF]
- Represents specific examples or instances of concepts
- Properties:
  * `confidence`: float [0-1]
Example:
```cypher
MATCH (specific:Entity), (general:Concept)
MERGE (specific)-[:INSTANCE_OF {confidence: 1.0}]->(general)
```

## Domain Extension Pattern

### 1. Domain Labels
Add domain-specific labels while maintaining core node types:
```cypher
MERGE (p:Concept:ProgrammingConcept {name: 'Object-Oriented Programming'})
MERGE (c:Entity:ChemicalCompound {name: 'Water'})
MERGE (e:Event:HistoricalEvent {name: 'French Revolution'})
```

### 2. Domain-Specific Relationships
Extend core relationships with domain context:
```cypher
// Programming
MERGE (class)-[:INSTANCE_OF {domain: 'programming', type: 'class_definition'}]->(concept)

// Biology
MERGE (organ)-[:PART_OF {domain: 'biology', system: 'circulatory'}]->(body)

// History
MERGE (event1)-[:LEADS_TO {domain: 'history', timeframe: 'years'}]->(event2)
```

## Example Cross-Domain Query Patterns

### 1. Find Fundamental Concepts Across Domains
```cypher
MATCH (c:Concept)
WHERE c.abstractionLevel = 'foundational'
RETURN c.domain, COLLECT(c.name) as concepts
```

### 2. Trace Related Concepts Across Domains
```cypher
MATCH path = (c1:Concept)-[:RELATES_TO*1..3]-(c2:Concept)
WHERE c1.domain <> c2.domain
RETURN path
```

### 3. Find Common Patterns Across Domains
```cypher
MATCH (p:Process)
WITH p.domain as domain, COUNT(p) as processCount
WHERE processCount > 10
RETURN domain, processCount
```