# Achievements Graph
An achievement is something noteworthy a person did: an award, a certification, a publication, a patent, a promotion,
or a result they can point to. Each one stands on what it shows about them, so it demonstrates the skills and topics it
shows they have. Where a person's level in a skill or topic is what they say they can do, an achievement is something
they did with it.

Achievements come from importing a resume (`documentation/architecture/resume_import.md`). The person confirms each one,
and it demonstrates the skills and topics it shows that they added from the same resume. A person's achievements show
on their profile, on its Achievements tab, the most recent first, and Atlas's overall summary of them draws on them as
what their skills and knowledge have produced.

## Nodes and relationships
| Node / relationship | Properties | What it is |
|---|---|---|
| `(:Achievement)` | `id`, `title`, `description`, `year`, `source`, `createdAt` | One thing the person achieved. `title` is short and in sentence case, `description` is a sentence on what they did and what came of it, `year` is when, if they said, and `source` is where it came from (`resume`) |
| `(:Person)-[:HAS_ACHIEVEMENT]->(:Achievement)` | | The person achieved it. A person's achievements have different titles, in any case: adding one with a title they have already adds to that one |
| `(:Achievement)-[:DEMONSTRATES]->(:Skill)` | | It shows the person has the skill |
| `(:Achievement)-[:DEMONSTRATES]->(:Topic)` | | It shows the person knows the topic |

`id` is unique (migration `020_achievements.cypher`).

## Example
```cypher
(dev:Person)-[:HAS_ACHIEVEMENT]->(award:Achievement {
  id: "6c1f...", title: "Northwind 2022 Engineering Excellence Award",
  description: "Won Northwind Analytics' internal Engineering Excellence Award for building the real-time inventory pipeline.",
  year: 2022, source: "resume", createdAt: datetime()
})
(award)-[:DEMONSTRATES]->(:Skill {name: "Apache Spark"})
(award)-[:DEMONSTRATES]->(:Skill {name: "Data Pipeline Development"})
(award)-[:DEMONSTRATES]->(:Topic {name: "Distributed Computing"})
```
