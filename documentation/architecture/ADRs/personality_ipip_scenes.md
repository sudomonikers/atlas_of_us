# ADR: Personality scenes built from IPIP-NEO items, measuring only the 30 Big Five facets

**Status:** Accepted, 21 Oct 2026
**Where it lives:** `application/ui/atlas-of-us-ui/src/personality/`, `application/apis/atlas-jobs/src/jobs/personality_scoring.rs`,
`application/database/personality_*.cypher`

## Context
The first version of the personality module measured 43 traits from 15 scenes: the 30 facets of the Big Five, plus 13
of our own (Patience, Resilience, Optimism, Perfectionism, Competitiveness, Stubbornness, Independence, Boldness,
Playfulness, Sensory Sensitivity, Decisiveness, Adaptability and Fairness). It worked, but it had problems we couldn't
fix by tuning:

- **The scenes were written to our own reading of each trait.** Each prompt listed the traits it was meant to draw out,
  but nothing tied a moment to a validated sign of that trait. When a trait scored badly, we couldn't tell whether the
  scorer, the scene or our idea of the trait was at fault.
- **The 13 extra traits had no validated items, and overlapped the facets.** Resilience sits close to low Vulnerability,
  Perfectionism blends Orderliness with Anxiety, and Stubbornness is partly low Cooperation. One answer moved several
  traits at once (trait bleed), and the scorer needed rules to keep them apart.
- **The scoring prompt carried 43 sets of hand-written criteria,** with high and low ends, preconditions and "belongs to
  a neighbouring trait" notes. It was long, hard to read and hard to change safely.
- **Nothing outside our own work could check the results.** No questionnaire measures our 13 traits, so there was no way
  to validate them against real people.

## Decision
**We measure only the 30 facets of the Big Five, and every scene is written to items from the IPIP-NEO.**

### The items
- The IPIP-NEO is the public-domain questionnaire behind the 30 facets: ten statements ("items") per facet, such as "I
  worry about things".
- We test 150 of its items, 5 per facet: the 4 kept in the validated IPIP-NEO-120 short form, plus one more chosen so
  each facet has an item keyed in the other direction, or because it works well in a scene.
- Liberalism drops the short form's two voting items, because "liberal" and "conservative" mean different things in
  different countries. It keeps five items that test the attitude without the labels.
- All 300 items are in `ipip_neo_items.md`. Which 150 we test, and why, is in `scene_grouping.md`.

### The scenes
- The 150 items are grouped into 18 scenes. Each item is in exactly one scene, and every facet is in at least two.
- **A scene turns its items into moments.** Instead of rating "I love large parties", the player is at one, and we read
  what they do and why. Both ends of every moment have to look reasonable.
- **Scenes come in three modes:** story (a hypothetical with choices and reasons), live (what the player actually does
  in the app) and interview (direct questions, with every frequency pinned down, for inner states a story can't show).
- **Every scene ends with a real-life question** about the player's own life.

### The scoring
- Scenes are scored in batches of 6, by play order, with one Bedrock call per batch.
- The prompt gives each facet a one-sentence definition of its high end. The low end is its opposite. A few facets have
  short notes on what belongs to a neighbouring facet instead. The 43 sets of criteria are gone.
- Evidence from all of a person's answers is combined as a plain weighted average in log-odds. We tried raising the
  combined evidence to a power, to push confident scores further from the middle. Every regression run favoured no power
  at all, so there is none.

## Evidence
From the persona regression harness (`personality_testing_harness.md`). The gap is the average distance between score
and target, in points on a 0 to 100 scale.

| | Original 10 personas | All 13 | 3 average personas, plus Chris |
|---|---|---|---|
| v1, 15 scenes, 43 traits | 6.9 | - | - |
| v2, 18 IPIP-NEO scenes, 30 facets | 6.7 | 6.2 | 4.9 |

- These are against the original targets, on the 30 facets only. v2 is the run of 21 Oct 2026
  (`testing/results/2026-10-21T04-20-07-915Z`), recomputed from its stored evidence with no power.
- **v2 matches v1 overall,** while every one of its moments is tied to a validated item.
- **v2 reads average people well,** who are most real players. v1 never played the three average personas, so there's no
  v1 number for them. With the power the scorer used before, v2 was 7.0 on them. Without it, 4.9.
- **After the targets were refreshed** against the v2 answers, v2 is 5.2 across all 13 personas. That number flatters
  v2: the targets were refreshed after seeing the scorer's worst misses, so it's partly circular. The fair comparison
  with v1 is the table above.

## Consequences
**What it gives us**
- **Every moment traces back to a validated item,** so a bad score can be traced to the scene, the item or the scorer.
- **A shorter, clearer scoring prompt,** with one definition per facet instead of 43 sets of criteria.
- **No trait bleed from the extra traits,** and no rules to keep them apart.
- **A real validation path.** Real players can take the IPIP-NEO-120 alongside the scenes, and their scores can be
  compared facet by facet. That wasn't possible for the 13 traits.

**What it costs**
- **The 13 traits are gone,** along with v1's 15 scenes and everyone's answers and scores from them. Production had no
  real users, so nobody lost anything that mattered.
- **Some things people care about aren't measured,** like resilience and fairness. They come back only if they get
  validated items that a scene can be written to.
- **Writing a scene is more constrained.** It starts from a fixed set of items rather than an idea for a situation, and
  every item has to be shown, not asked about.

## Alternatives considered
- **Keep the 13 traits alongside the facets.** Rejected: they have nothing to validate against, they overlap the facets,
  and they made the prompt and the scores harder to reason about.
- **Keep v1's scenes and only drop the 13 traits.** Rejected: the scenes still wouldn't be tied to validated items, and
  they were written to draw out the traits we were dropping.
- **Ask the IPIP-NEO items directly.** Rejected: rating statements about yourself is exactly what the module exists to
  avoid (see the module's README). We keep the questionnaire's content and drop its format.
