# Fleshing Out the Knowledge Graph

Brainstorm, 2026-11-17. Analysis only; nothing here is built yet.

## Where it stands

The Topics schema is ahead of the product built on it. The graph defines how a person relates to an Idea:
`UNDERSTANDS`, `BELIEVES` (with `conviction`, `warrant` and `centrality`), `ENDORSES`, `HOLDS` and `CURIOUS_ABOUT`.
No API query writes or reads any of them today. A person's whole relationship to knowledge is one self-reported Bloom
level per topic, plus evidence.

So the biggest opportunity isn't new structure. It's making use of what's already modeled. Most of the features below
build on edges that already exist: `CONTRADICTS`, `SUPPORTS`, `ANALOGOUS_TO`, `REQUIRES_KNOWLEDGE` and `centrality`.

Users tend to get excited by four things: surprising truths about themselves, comparison with others, visible
progress, and play. The ideas are grouped by those.

## 1. Surprising truths: your worldview

### Belief and values scenes
The personality engine already turns choices in a scene, plus the person's reasoning, into scored evidence. The same
approach could produce `BELIEVES`, `ENDORSES` and `HOLDS` edges with reasons attached. Dilemmas show a person's values
far better than a "rate how much you value tradition" question does, which is the same argument behind the
personality scenes.

### Published taxonomies and population norms
Ground values and beliefs the way Abilities uses O\*NET and NHANES:

- **Values:** Schwartz's basic values (10 or 19) and Moral Foundations Theory. Both are small, well studied and easy
  to seed as `value` Ideas.
- **Contested claims with real distributions:**
  - The PhilPapers Survey gives professional philosophers' views on about 100 questions: "You side with 72% of
    philosophers on free will."
  - The World Values Survey and Pew give general-population baselines.

Either gives belief percentiles, just as grip strength has norms.

### Dissonance detector
The feature that fits the brand best. The graph already has what it needs:

- The person believes two claims that `CONTRADICTS` each other.
- They endorse a norm that clashes with a value they hold strongly.
- Their stated values don't match what their personality scenes showed.

Atlas points these out: "Gently. Mostly." It speaks directly to the "users lie to themselves" item that `summary.md`
lists as out of scope, and gives the "competing voices" work somewhere to go.

### Load-bearing beliefs
Use `centrality` and `SUPPORTS` chains to show which belief holds up the most others: "If this one fell, 14 others
would wobble." An unusual view of yourself that people will want to share.

### Why you believe it
`warrant` is already on the edge. Break down how much of what a person believes rests on evidence, authority,
upbringing or intuition.

## 2. Progress: verified knowledge, not claimed knowledge

### Bloom-level checks
Each level already has `observableSigns` and `exampleEvidence`, and Ideas are typed, so checks can be generated per
level:

| Level | Check |
|---|---|
| Remember | Recall questions |
| Understand | Explain it in your own words, LLM-graded like Brick Uses |
| Apply | A new scenario |
| Analyze | Break a case into its parts and say how they relate |
| Evaluate | Argue one side of a contested claim |
| Create | Combine the Ideas into something new, LLM-graded against the level's signs |

The result is a verified level next to the claimed one. The gap between the two is a personal finding in itself.

### Calibration score
Ask how sure the person is before each answer. Overconfidence is measurable, cheap to collect and fascinating to see.
Another bias the person becomes aware of.

### Knowledge that fades
Skills already flag "getting rusty." Topics could do the same, with spaced review of the Ideas a person has said they
understand.

### Inferred `UNDERSTANDS`
Asking people to tick Ideas one by one won't scale. Infer the edges from Bloom placement and check results, and ask
the person to confirm only the surprising ones.

## 3. Play: the map itself

### Fog of war
Show the Ideas whose prerequisites a person fully meets but which they don't know yet: the edge of what they know.
It's one graph query on existing data, and the map theme fits it: uncharted territory you can see the edge of.

### Analogy bridges
`ANALOGOUS_TO` is the most delightful edge in the graph: "You understand entropy in physics, so you're one step from
information theory." Leaps between fields, built from what the person already knows.

### The shape of your knowledge
Breadth against depth (T-shaped, comb-shaped, specialist, polymath), compared with other Atlas users. Pride in rare
knowledge: "Only 0.4% of mapped people know this."

### Rabbit holes
Guided walks along `PRECEDES` (history) or `SPECIALIZES` chains, so exploring feels like a story rather than a list.

### Debate maps
For any contested claim, show both sides' `SUPPORTS` chains as steelmen, with the person's own position marked.

## 4. Comparison and who you could become

### Occupations need knowledge too
Abilities already seeds O\*NET's ability ratings for 894 occupations. O\*NET also rates the same occupations on 33
knowledge areas, with a level and an importance for each. Seeding an `Occupation -> Topic` edge gives "dream job,
here's the knowledge gap" with almost no LLM involved, and makes the core "who you could become" promise much more
concrete.

### What a book would give you
When the Works graph lands, a `COVERS` edge from Work to Idea can show "This book gives you 23 Ideas you don't have
yet, and 4 that would challenge beliefs you hold." Personalized reading recommendations, and a start on the Things and
Products plug-in on the roadmap.

### Teachers and learners
Match one person's `CURIOUS_ABOUT` with another's `ENGAGES_TOPIC` at Analyze or above. An early, useful piece of the
Social graph.

### Famous minds
Generate knowledge and values profiles of historical figures: "Your map overlaps 61% with Ben Franklin's." Very
shareable. The profiles must be labeled as reconstructions.

### Friends side by side
Shared Ideas, opposing beliefs, and who could teach whom. The roadmap's "put your maps side by side," applied to
knowledge.

## Graph changes each feature needs

| Feature | New nodes or seeds | New edges or properties |
|---|---|---|
| Belief and values scenes | Value Ideas from Schwartz and Moral Foundations; belief scenes | Uses existing `BELIEVES`, `ENDORSES`, `HOLDS` |
| Population norms for beliefs | PhilPapers, WVS or Pew distributions per claim | A norm on a claim Idea, like `MeasurementNorm` |
| Dissonance detector | None | Uses existing `CONTRADICTS`, `SUPPORTS` |
| Load-bearing beliefs | None | Uses existing `centrality`, `SUPPORTS` |
| Bloom-level checks | Check items per BloomLevel | A verified level on `ENGAGES_TOPIC`, or a separate edge |
| Calibration score | None | Stated confidence on each check answer |
| Knowledge that fades | None | A last-reviewed date on `UNDERSTANDS` |
| Fog of war, analogy bridges | None | Uses existing `REQUIRES_KNOWLEDGE`, `ANALOGOUS_TO` |
| Occupation knowledge | O\*NET's 33 knowledge areas, resolved to Topics | `Occupation -> Topic` with `level`, `importance` |
| Book coverage | Works | `Work -> Idea` coverage |
| Famous minds | Historical people | Their edges to Ideas and Topics |

## Priorities

1. **Fog of war and analogy bridges.** Pure queries on existing data: the cheapest wins, and very visual. They make
   the Explorer personal.
2. **Belief and values scenes, seeded with Schwartz, Moral Foundations and PhilPapers or WVS norms.** Brings the unused
   half of the schema to life and reuses the scene engine.
3. **Dissonance detector.** The most on-brand feature. Depends on 2.
4. **O\*NET knowledge links to occupations.** A small seed that makes "who you could become" credible.
5. **Verified Bloom checks with a calibration score.** Addresses the honesty problem for knowledge specifically.

## Open questions

- **Should beliefs be public?** Under the no-privacy-gating rule they follow the profile's public toggle like
  everything else. Political and religious beliefs may still deserve a deliberate decision.
- **How many Ideas does a fill create?** Belief features need contested claims with real rivals. A fill writes only a
  topic's core Ideas, which may be too thin for debate maps and dissonance checks.
- **Where does the broad backbone come from?** ESCO leans toward what jobs need. Wikipedia's Vital Articles (Levels 1
  to 5) would give a broad backbone of general knowledge before users fill the gaps.
