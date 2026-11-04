# How the Physical Attributes Module Works

This explains how the physical attributes sub-graph gets filled out and how it connects to the rest of the Atlas. For
the graph itself, read `../data_model/physical_attributes/physical_attributes.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/physical/` | Physical Traits: recording measurements and taking self-tests, seeing where they sit, abilities, a 3D body to explore, and noting impairments and conditions |
| 3D body | `application/ui/atlas-of-us-ui/public/anatomy/` | The models of the body, one file per layer, and which part each mesh is, served with the site |
| API | `application/apis/atlas-api/src/domains/physical/` | Readings, their percentiles, and who a person is compared with; where a person stands on each ability; the anatomy; impairments; conditions, and adding ones from Mondo and HPO |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/physical.rs` | Links a filled skill's levels to the abilities they take |
| Condition links | `application/apis/atlas-jobs/src/events/condition_added/physical.rs` | Links a condition a person added to the body functions and parts it affects |
| Seeds | `application/database/physical_abilities_seed.cypher`, `physical_norms_seed.cypher`, `physical_functions_seed.cypher`, `physical_anatomy_seed.cypher`, `physical_conditions_seed.cypher` | The abilities, from O\*NET, the measurements with their norms, from NHANES, the body functions, from the WHO's ICF, the anatomy, from FMA and BodyParts3D, and common conditions, from Mondo and HPO |
| Norms import | `application/database/physical_norms_import/` | Works out the norms from NHANES, adds the self-tests with their published norms, and writes the norms seed |
| ICF import | `application/database/icf_import/` | Reads the WHO's ICF and its definitions from the ICD-API, and writes the body functions seed |
| Anatomy import | `application/database/anatomy_import/` | Reads FMA and BodyParts3D, writes the anatomy seed, and turns BodyParts3D's models into the 3D body |
| Conditions import | `application/database/conditions_import/` | Reads Mondo and HPO, and writes the conditions seed from a hand-picked list |
| Ontology search | EBI's Ontology Lookup Service (OLS) | Finds Mondo and HPO terms that aren't seeded, when a person looks for one |

## What we measure
The abilities of the O\*NET content model: capacities of the body and mind that make things easier or harder to learn,
such as strength, eyesight and memory. A person's place on each is a **value** from 0 to 1, a percentile among people
where 0.5 is typical, with a **confidence**, as for personality traits.

Measurements, such as height and grip strength, are numbers a person records. Most have norms from NHANES, the US
national health survey: the value at each percentile, by sex and age band. Self-tests are measurements a person takes
themselves, at home by following written steps or in the app, which times and scores them, with norms from published
surveys and studies. The Atlas's own tests are compared with Atlas users: the api works out their norms from
everyone's readings as readings come in. Two of them, of typed answers, are scored by the api with Bedrock: a fast model
reads the answers, and embeddings measure how unusual they are. A person's percentile is worked out when
it's read, from their reading, their age when they took it and their sex for norms, so better norms update everyone at
once. Measurements that show an ability, such as grip strength for Static Strength, are linked to it.

Body functions are the WHO's ICF, the international standard for describing how a body works. Functions are linked to
the abilities they underlie and the measurements that read them, so an impairment shows which abilities it can hold
back.

The anatomy is the Foundational Model of Anatomy (FMA), the reference ontology of human anatomy, cut to the parts
BodyParts3D has 3D models of, from whole systems to single muscles, bones, vessels and nerves, and the main parts it has
no model of. Parts are linked to the functions they carry out. A person notes an impairment in a function or a part,
from mild to complete.

Conditions are diseases from Mondo and features from the Human Phenotype Ontology (HPO), the open ontologies used in
medical research. A few hundred common ones a person would know they have are seeded, each linked to the body functions
and parts it affects. Mondo and HPO have tens of thousands more, so anything else is looked up in the ontology
search when a person asks for it, and added as the ontology has it. The ontology's id is a condition's identity, so the
same condition is only ever added once. Every condition carries the ids of everything above it in its ontology, so a new
one is placed among the ones we have from those alone: under the nearest conditions it's a kind of, and over the nearest
ones that are kinds of it.

## What the user sees
Physical Traits has five views. Measurements lists every measurement, grouped into body size, vitals, strength and
fitness, the senses, and reflexes and memory, with the steps for each home test and the in-app tests to take. A person records a reading and the day they took it, and sees their latest reading with where
it sits among people of their sex and age, and their earlier readings. They choose whether they're compared with men,
women or everyone. Abilities lists every ability with where they stand, what that comes from, the tests that measure it, and a rating on
its examples for the ones no test covers. Body map is a place to learn about the body: a 3D body to turn and zoom, in layers (skin, skeleton,
muscles, organs, nervous system, heart and vessels), where clicking any part, or finding it by name, lights it up and
opens everything about it, and picking a system or region lights up all of its parts. Impairments lists the ones
they've noted, with the abilities each can affect, and finds a body function or part to add by searching or browsing. Conditions lists the ones they've noted, with how
much each affects them, whether it was diagnosed, whether it's under control, and the parts of the body it affects; a
search finds a condition by any of its names, and looks further in Mondo and HPO for one that isn't listed.
Measurements, impairments and conditions are private: they're only shown to the person who recorded them.

## Abilities
A person's place on each ability is worked out from what they've recorded, by the api, whenever a reading, their sex
for norms, an impairment or a rating changes, and whenever they open their abilities. The latest reading of each
measurement that shows an ability counts, weighted by how much that measurement says about it. With no reading, their
own rating on the ability's examples stands in, with little confidence. An impairment in what the ability rests on
holds it back. The result is kept on the person as HAS_ABILITY, which is what skills compare against: a skill level's
abilities show beside where the person stands, as its personality traits do.

## Skill requirements
Every skill level is linked to the abilities it takes, so a person can see how what they have to work with fits a
skill. A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`): one LLM call names the
abilities that make a real difference at each level, how much of each as a percentile, how much it matters and why,
and links the levels to them. It does nothing for a skill that already has them, and a skill stays usable without
them.

## Linking added conditions
The seeded conditions link to the body functions and parts they affect by hand. One a person adds is linked by a job:
the api publishes `ConditionAdded`, and one LLM call reads the condition, its other names and what its broader
conditions affect, and picks from every body function and the major body parts: the organs, systems and regions. A condition stays usable without its links, and
a condition that has them is left as it is.

## Learning about the body
The 3D body is BodyParts3D's models of a real human body, simplified when the anatomy seed is generated so the whole
body loads in a browser, and drawn in the browser with three.js in a cel-shaded style. Each layer is its own file,
loaded the first time it's shown. Every mesh is named, and a file beside the models says which part each one is, so a
click opens that part. A part's page shows its FMA definition and other names, the wholes it belongs to and the parts
it's made of, the kinds of part it is, the functions it serves with the abilities they underlie and the measurements
that read them, the conditions that affect it, its measurements with where the person stands on each, and the person's
impairments. The physical data sets are linked at a few points (conditions to parts and functions, measurements to
parts and functions, parts to the functions they serve), and a part gathers everything linked to it, to the parts it
belongs to and is made of, and to the functions those serve, saying where each came from: the left lung shows asthma
through the lung. Opening a part lights up every mesh it's drawn with; a part with no model lights up the nearest part
it belongs to that has one.
