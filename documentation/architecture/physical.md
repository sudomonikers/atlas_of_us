# How the Physical Attributes Module Works

This explains how the physical attributes sub-graph gets filled out and how it connects to the rest of the Atlas. For
the graph itself, read `../data_model/physical_attributes/physical_attributes.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/physical/` | Physical Traits: recording measurements and seeing where they sit, and noting impairments and conditions |
| API | `application/apis/atlas-api/src/domains/physical/` | Readings, their percentiles, and who a person is compared with; impairments; conditions, and adding ones from Mondo and HPO |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/physical.rs` | Links a filled skill's levels to the abilities they take |
| Condition links | `application/apis/atlas-jobs/src/events/condition_added/physical.rs` | Links a condition a person added to the body functions and structures it affects |
| Seeds | `application/database/physical_abilities_seed.cypher`, `physical_norms_seed.cypher`, `physical_body_seed.cypher`, `physical_conditions_seed.cypher` | The abilities, from O\*NET, the measurements with their norms, from NHANES, the body functions and structures, from the WHO's ICF, and common conditions, from Mondo and HPO |
| Norms import | `application/database/physical_norms_import/` | Works out the norms from NHANES and writes the norms seed |
| ICF import | `application/database/icf_import/` | Reads the WHO's ICF and its definitions from the ICD-API, and writes the body functions and structures seed |
| Conditions import | `application/database/conditions_import/` | Reads Mondo and HPO, and writes the conditions seed from a hand-picked list |
| Ontology search | EBI's Ontology Lookup Service (OLS) | Finds Mondo and HPO terms that aren't seeded, when a person looks for one |

## What we measure
The abilities of the O\*NET content model: capacities of the body and mind that make things easier or harder to learn,
such as strength, eyesight and memory. A person's place on each is a **value** from 0 to 1, a percentile among people
where 0.5 is typical, with a **confidence**, as for personality traits.

Measurements, such as height and grip strength, are numbers a person records. Each has norms from NHANES, the US
national health survey: the value at each percentile, by sex and age band. A person's percentile is worked out when
it's read, from their reading, their age when they took it and their sex for norms, so better norms update everyone at
once. Measurements that show an ability, such as grip strength for Static Strength, are linked to it.

Body functions and structures are the WHO's ICF, the international standard for describing how a body works. A person
notes an impairment in one, from mild to complete. Functions are linked to the abilities they
underlie and the measurements that read them, so an impairment shows which abilities it can hold back.

Conditions are diseases from Mondo and features from the Human Phenotype Ontology (HPO), the open ontologies used in
medical research. A few hundred common ones a person would know they have are seeded, each linked to the body functions
and structures it affects. Mondo and HPO have tens of thousands more, so anything else is looked up in the ontology
search when a person asks for it, and added as the ontology has it. The ontology's id is a condition's identity, so the
same condition is only ever added once. Every condition carries the ids of everything above it in its ontology, so a new
one is placed among the ones we have from those alone: under the nearest conditions it's a kind of, and over the nearest
ones that are kinds of it.

## What the user sees
Physical Traits has three views. Measurements lists every measurement, grouped into body size, vitals, strength and
fitness, and the senses. A person records a reading and the day they took it, and sees their latest reading with where
it sits among people of their sex and age, and their earlier readings. They choose whether they're compared with men,
women or everyone. Impairments lists the ones they've noted, with the abilities each can affect, and finds a body
function or structure to add by searching or browsing WHO's chapters. Conditions lists the ones they've noted, with how
much each affects them, whether it was diagnosed, whether it's under control, and the parts of the body it affects; a
search finds a condition by any of its names, and looks further in Mondo and HPO for one that isn't listed.
Measurements, impairments and conditions are private: they're only shown to the person who recorded them.

## Skill requirements
Every skill level is linked to the abilities it takes, so a person can see how what they have to work with fits a
skill. A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`): one LLM call names the
abilities that make a real difference at each level, how much of each as a percentile, how much it matters and why,
and links the levels to them. It does nothing for a skill that already has them, and a skill stays usable without
them.

## Linking added conditions
The seeded conditions link to the body functions and structures they affect by hand. One a person adds is linked by a
job: the api publishes `ConditionAdded`, and one LLM call reads the condition, its other names and what its broader
conditions affect, and picks from every body function and structure. A condition stays usable without its links, and
a condition that has them is left as it is.
