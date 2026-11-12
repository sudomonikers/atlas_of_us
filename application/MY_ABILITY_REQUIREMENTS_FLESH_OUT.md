# Grounding what a skill takes

How much of each ability a skill's levels take, on a scale that means an amount rather than a rank among people, and
from sources outside the model wherever there is one. Today an LLM names a "percentile from 0.5 to 1" for each
requirement with nothing to check it against, so a figure like 0.88 looks more precise than it is.

## The scale: O\*NET's level anchors
Every ability in the Atlas is an O\*NET ability, and O\*NET defines each one on a 0 to 7 level scale with example tasks
at fixed points. Stamina's are 1 "Walk 1/4 mile", 4 "Climb 6 flights of stairs" and 6 "Run 10 miles". The scale is a
flat amount: a 6 is a 10 mile run whoever else can do it. The abilities seed already has these examples, in the same
order as O\*NET's anchor file (checked for all 46), so each gets the level its example sits at.

- A requirement's `level` is the anchored level over 7, from 0 to 1, shown as a score out of 100.
- The scale is the same one O\*NET's job analysts rate occupations on, so expert ratings and the Atlas's own estimates
  land on one scale.

## Where the numbers come from
1. **Occupations rated by experts.** O\*NET 30.0 rates about 900 occupations on all 52 of its abilities, with a level
   (0 to 7) and an importance (1 to 5), from trained job analysts. These become `Occupation` nodes linked to the
   abilities they take.
2. **Matching a skill to occupations.** Each occupation is embedded from its title, alternate titles and description,
   on the same model as skills. A skill's nearest occupations by meaning are its reference points: Basketball finds
   Athletes and Sports Competitors, whose alternate titles include "Basketball Player" and "NBA Player". This works
   for every skill, including the ones users add, so it doesn't depend on where the skill came from.
3. **The model places each level against the anchors and the references.** One call reads the skill, its levels, each
   ability's anchors and the reference occupations with their rated levels. It names the occupation whose work is doing
   this skill, if there is one, and for each requirement picks a level on the 0 to 7 scale by the anchor tasks. The
   occupation's ratings are a reference, not the answer: O\*NET's Athletes averages every sport, so Stamina 4 there
   is low for an Expert basketball player, and the model says so in the reason.
4. **Later, people.** Once users have scores and their own level in a skill, what people at each level actually have
   replaces the estimate. The levels' `trust` (provisional, established) already says which a level is.

## The graph
- `(:Occupation {onetSoc, title, description, alternateTitles, vector})` from O\*NET 30.0, with a vector index.
- `(:Occupation)-[:TAKES_ABILITY {level, importance}]->(:Ability)`: level over 7 and importance from 0 to 1.
- `Ability.anchorLevels`: the level over 7 of each of its `examples`, in the same order.
- `(:Skill)-[:PERFORMED_IN]->(:Occupation)`: the occupation whose work is doing the skill, when the model names one.
- `REQUIRES_ABILITY` keeps `level`, `strength` and `reason`, with `level` on the anchored scale.
- `Skill.abilityScale = 'anchored'` once its requirements are worked out on the anchored scale, even when it takes
  none, so a skill linked the old way can be told apart.

## What gets built
| Piece | What | Status |
|---|---|---|
| `database/onet_import/` | Reads O\*NET's Occupation Data, Alternate Titles and Abilities, embeds each occupation, and writes `onet_occupations_seed.cypher`: the 894 occupations with their vectors, and what each takes | Built |
| `physical_abilities_seed.cypher` | Each ability's `anchorLevels`, from O\*NET's Level Scale Anchors | Built |
| `database/migrations/006_occupations.cypher` | The occupation id constraint and `occupation_vector` index | Built |
| atlas-jobs `SkillFilled-Physical` | Finds the skill's reference occupations, places each requirement on the anchored scale, links the skill to its occupation, and replaces requirements written on the old scale | Built |
| ui | Shows requirements as a score out of 100 (done) | Done |
| Docs | Data model, `architecture/physical.md`, the jobs README | Built |

## Recomputing the skills we have
The job runs again on a skill whose `abilityScale` isn't `anchored` yet, and replaces its requirements in one write. So
the existing skills are recomputed by replaying the event archive to the `SkillFilled-Physical` rule alone:

1. Run migration 006, the abilities seed and the occupations seed.
2. Deploy the new job.
3. Start a replay of the `atlas-events` archive from the bus's first day to now, with its destination filtered to the
   `SkillFilled-Physical` rule's ARN, so no other job runs again.
4. Each `SkillFilled` in the archive reruns the job for its skill. A skill filled more than once is recomputed once:
   the second run finds it already anchored.
5. Compare the count of ready skills with the count whose `abilityScale` is `anchored`. Any skill filled before the archive
   existed isn't in it, and can be sent to the worker as `{"handler": "SkillFilled-Physical", "event": {"detail":
   {"skillId": "..."}}}`.

It costs one Bedrock call per filled skill, at most 10 at a time, under the budget cutoff in `bedrock.rs`.

## Next: a person's scores on the same scale
A person's place on an ability is still a percentile among people, worked out from where their readings sit in the
norms. To compare it with a requirement it has to be on the anchored scale too:

- **Self-ratings** already are: a person picks the hardest example they can do, and each example now has its level.
- **Tests** need a one-time calibration from a reading to the anchored scale, for example which grip strength matches
  which strength anchor, from published data where it exists.

Until then a person's percentile and a requirement's anchored level sit on the same bar but don't mean the same thing.
