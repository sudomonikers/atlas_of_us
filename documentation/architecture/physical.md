# How the Physical Attributes Module Works

This explains how the physical attributes sub-graph gets filled out and how it connects to the rest of the Atlas. For
the graph itself, read `../data_model/physical_attributes/physical_attributes.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/physical/` | Physical Traits: recording measurements and seeing where they sit |
| API | `application/apis/atlas-api/src/domains/physical/` | Readings, their percentiles, and who a person is compared with |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/physical.rs` | Links a filled skill's levels to the abilities they take |
| Seeds | `application/database/physical_abilities_seed.cypher`, `physical_norms_seed.cypher` | The abilities, from O\*NET, and the measurements with their norms, from NHANES |
| Norms import | `application/database/physical_norms_import/` | Works out the norms from NHANES and writes the norms seed |

## What we measure
The abilities of the O\*NET content model: capacities of the body and mind that make things easier or harder to learn,
such as strength, eyesight and memory. A person's place on each is a **value** from 0 to 1, a percentile among people
where 0.5 is typical, with a **confidence**, as for personality traits.

Measurements, such as height and grip strength, are numbers a person records. Each has norms from NHANES, the US
national health survey: the value at each percentile, by sex and age band. A person's percentile is worked out when
it's read, from their reading, their age when they took it and their sex for norms, so better norms update everyone at
once. Measurements that show an ability, such as grip strength for Static Strength, are linked to it.

## What the user sees
Physical Traits lists every measurement, grouped into body size, vitals, strength and fitness, and the senses. A person
records a reading and the day they took it, and sees their latest reading with where it sits among people of their sex
and age, and their earlier readings. They choose whether they're compared with men, women or everyone. Measurements are
private: they're only shown to the person who recorded them.

## Skill requirements
Every skill level is linked to the abilities it takes, so a person can see how what they have to work with fits a
skill. A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`): one LLM call names the
abilities that make a real difference at each level, how much of each as a percentile, how much it matters and why,
and links the levels to them. It does nothing for a skill that already has them, and a skill stays usable without
them.
