# Personality Graph
We model a person's personality with the Big Five: Openness, Conscientiousness, Extraversion, Agreeableness and
Neuroticism, each split into six facets as defined by the IPIP-NEO. There is one static node per facet, and a person's
personality is their relationships to those nodes. Each facet node gets an incoming relationship from everyone measured
on it, but queries only use it as an endpoint, so the interesting data is on the relationships. How answers become
scores is in `documentation/architecture/personality.md`.

## Nodes

| Label | Key properties | What it is |
|---|---|---|
| PersonalityModel | `name`, `overview`, history and limits | The Big Five itself, for the Explore reading material. There is one |
| PersonalityDomain | `key`, `name`, `overview`, `highGood`, `lowGood`, `highWatch`, `lowWatch` | One of the five domains |
| PersonalityTrait | `id`, `name`, `description`, `overview`, `highGood`, `lowGood`, `highWatch`, `lowWatch` | One of the 30 facets, the traits we measure |
| PersonalityScenario | `id`, `name`, `title`, `order` | A scene. `order` is its place in play order, which also sets its scoring batch |
| PersonalityScenarioQuestion | `id`, `key`, `order`, `prompt`, `real_life` | A question in a scene. `key` matches the prompt in the scene's script, the highest `order` is the last question, and `real_life` marks the question about the player's own life |
| JobRunning | `id`, `kind`, `startedAt` | A scoring job in progress for a person, which locks their scenes until it's done |

A Person also carries their personality report, once they're fully scored: `personalityReport`, a JSON string with a
headline, an overview, a paragraph per domain, strengths and things to watch, and `personalityReportAt`.

## Relationships

| Relationship | From → To | Properties | Meaning |
|---|---|---|---|
| HAS_DOMAIN | PersonalityModel → PersonalityDomain | | The model's five domains |
| HAS_FACET | PersonalityDomain → PersonalityTrait | | A domain's six facets |
| INTERACTS_WITH | PersonalityTrait → PersonalityTrait | `description` | How two traits combine, from the first one's point of view |
| HAS_PERSONALITY_TRAIT | Person → PersonalityTrait | `value`, `confidence` | How much of the trait they have, from 0 to 1 with 0.5 typical, and how much their answers say about it. No relationship means unmeasured, not average |
| HAS_QUESTION | PersonalityScenario → PersonalityScenarioQuestion | | A scene's questions |
| ANSWERED | Person → PersonalityScenarioQuestion | `id`, `answer`, `reasoning`, `context`, `facets`, `clockSeconds`, `clockLeft`, `clockRanOut`, `answeredDate`, `scoring`, `contests` | Their answer, with what they saw before it. `scoring` is the evidence the scorer found in it, and `contests` the person's challenges to that evidence, both JSON lists |
| HAS_JOB | Person → JobRunning | | A job running for them |
| REQUIRES_TRAIT | DreyfusLevel → PersonalityTrait | `level`, `strength`, `reason` | A skill level that takes the trait (see the Skills graph) |

## Example
```cypher
(:PersonalityModel {name: "Big Five"})-[:HAS_DOMAIN]->(:PersonalityDomain {key: "agreeableness"})-[:HAS_FACET]->(c:PersonalityTrait {name: "Cooperation"})

// Andrew is very cooperative, Lulu much less so
(andrew)-[:HAS_PERSONALITY_TRAIT {value: 0.9, confidence: 0.85}]->(c)
(lulu)-[:HAS_PERSONALITY_TRAIT {value: 0.2, confidence: 0.6}]->(c)

(:PersonalityScenario {name: "the_feud", order: 15})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: "the_war", order: 2})
(andrew)-[:ANSWERED {answer: "Knock on his door and suggest a mediator", reasoning: "A fence isn't worth years of not speaking", facets: ["Cooperation", "Anger"],
  scoring: '[{"trait":"Cooperation","evidence":"Looks for neutral ground over a fight they could win","level":0.7,"weight":0.6}]'}]->(q)
```
