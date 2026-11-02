# How the Physical Attributes Module Works

This explains how the physical attributes sub-graph gets filled out and how it connects to the rest of the Atlas. For
the graph itself, read `../data_model/physical_attributes/physical_attributes.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| API | `application/apis/atlas-api/src/domains/physical/` | The physical routes |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/physical.rs` | Links a filled skill's levels to the abilities they take |
| Seeds | `application/database/physical_abilities_seed.cypher` | The abilities, from O\*NET |

## What we measure
The abilities of the O\*NET content model: capacities of the body and mind that make things easier or harder to learn,
such as strength, eyesight and memory. A person's place on each is a **value** from 0 to 1, a percentile among people
where 0.5 is typical, with a **confidence**, as for personality traits.

## Skill requirements
Every skill level is linked to the abilities it takes, so a person can see how what they have to work with fits a
skill. A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`): one LLM call names the
abilities that make a real difference at each level, how much of each as a percentile, how much it matters and why,
and links the levels to them. It does nothing for a skill that already has them, and a skill stays usable without
them.
