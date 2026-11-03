# Fleshing out Physical Traits

Ideas for seeding the Physical Attributes graph and making it useful, to work through one at a time.

## What the rest of the Atlas already decides

- **Personality** is a small, static set of nodes, seeded with cypher. A person's score is a `value` from 0 to 1 on the
  relationship, with 0.5 typical, so it's relative to a population. Skills use it through REQUIRES_TRAIT from a
  DreyfusLevel.
- **Skills and Topics** have a huge long tail: ESCO stubs go through the api's gates and resolver, are filled on
  demand, and other modules hear about them through events. Every node has graded levels (Dreyfus, Bloom) with
  `observableSigns`.
- **The skills gate already routes `physical_attribute`** to the Physical module, and `SkillFilled` lists Physical
  Attributes as a listener. So the seed has two jobs: give an LLM linker good targets for skill-level requirements, and
  give a resolver something to match what users type ("I'm double-jointed").
- **Uberon, Mondo and HPO are anatomy and disease first.** None of them gives users what the roadmap promises: "what
  you can become depends on what you have to work with." A single `amount` from 0 to 1 fits abilities, but not height
  (neutral, not better or worse) or conditions (present, how severe, managed).

## The plan

Abilities first, anatomy last, in layers:

1. **Seed** O\*NET's physical, psychomotor and sensory abilities with their level anchors, plus measurements with
   population norms. This is what connects to the rest of the Atlas straight away: skills get physical requirements and
   users get percentiles that mean something.
2. **Attach self-test protocols** to those nodes, so physical is the first area that's checked rather than self-reported.
3. **Then** a slice of common conditions through a resolver, the functional framing of ICF, and a slim Uberon as the
   body map everything hangs on.

## The pieces

### 1. (Done) O\*NET Abilities

52 abilities from the Fleishman taxonomy: 9 physical (Static Strength, Stamina, Trunk Strength...), 10 psychomotor
(Manual Dexterity, Reaction Time, Arm-Hand Steadiness...), 12 sensory (Near Vision, Hearing Sensitivity, Night
Vision...) and 21 cognitive. Each comes with level anchors, concrete examples along its scale: Static Strength runs
from "push an empty shopping cart" to "lift 75-pound bags of cement onto a truck". O\*NET also rates about 900 occupations on every ability.
CC BY 4.0.

Seeded by `database/physical_abilities_seed.cypher`: one Ability node for each of 46 abilities, with the 15 cognitive
ones also labelled Cognitive, and a person's place on each as a percentile, HAS_ABILITY {value, confidence}, as for
personality.

- **Fits the existing shape.** Personality-sized, so it's seeded with cypher. The anchors map onto the
  `observableSigns` pattern of Dreyfus and Bloom levels. The `Hand-Eye Coordination` example in the data model is
  already an O\*NET-style ability.
- **(Done) Good targets for skill requirements.** The `SkillFilled-Physical` job links each skill's levels to the
  abilities they take, as REQUIRES_ABILITY {level, strength, reason}. "Cooking Novice requires Manual Dexterity" is a link an LLM gets right.
- **A cheap prior for those links.** ESCO skill → ESCO occupations that need it → O\*NET ability levels for those
  occupations, through the ESCO to O\*NET crosswalk.
- **Jobs on day one.** Physical requirements for occupations come with the data, for LinkedIn-but-better.
- **Gaps.** It's job-centric, so flexibility, endurance type and body composition come from the norms below.

### 2. Population norms

(Seeded) `database/physical_norms_import/` works out survey-weighted percentiles from NHANES and writes
`database/physical_norms_seed.cypher`: 15 measurements (body size, vitals, grip strength, VO2 max, body fat, hearing,
visual acuity) with norms by sex and age band. A person's percentile is worked out on read from their raw reading, their
age on the day and their `normSex`. The Physical Traits page (`ui/.../src/physical/`, api in `domains/physical/`) records
readings, shows each one's percentile, and sets `normSex`. Still to build: setting HAS_ABILITY from the measurements
that show an ability, and ANSUR II for body dimensions beyond NHANES's.

- **NHANES** (public domain): US distributions by age and sex for height, weight, grip strength, blood pressure,
  resting heart rate and more.
- **ANSUR II** (public domain): 93 body measurements from about 6,000 people.
- **Published fitness norms:** VO2max (FRIEND registry), push-ups, sit-and-reach.

What it gives:

- **`amount` means what personality's `value` means:** a raw value turned into a percentile for the person's age and
  sex.
- **"How do I compare"** readouts, and realistic trajectories for "who you could become" at a given age.
- **Fit and sizing** for Shopping-but-better (ANSUR), and height and fitness for matching.
- **Costs:** norms are mostly US and military. Measurement nodes need a raw value and unit beside the percentile.

### 3. Self-test protocols

Measurements that come with a test a person can do at home, from batteries like FitnessGram and Eurofit: the
ruler-drop reaction test, a 1.5 mile run, a dead hang, a Snellen chart.

- **The physical version of the personality scenarios:** do something and get measured, rather than rate yourself.
- **The Fibbing Serpent.** Physical is the one area where claims are cheap to check.
- **Progress.** Retesting gives tracking and trainability, so physical goals become as concrete as WANTS_TO_REACH.
- **Costs:** curation rather than an import. It sits on top of the abilities and norms.

### 4. WHO ICF

(Done) `database/icf_import/` reads the 2026-01 tabulation and each category's definition from the ICD-API, and writes
`database/physical_body_seed.cypher`: 346 body functions and 209 body structures (BodyFunction, BodyStructure), nested with
SUBFUNCTION_OF and SUBSTRUCTURE_OF, with functions linked to the abilities they UNDERLIE and the measurements that MEASURE them
(`src/links.rs`, chosen by hand). People note impairments (HAS_IMPAIRMENT {extent mild to complete, change for
structures}) on the Impairments view of Physical Traits, private to them. Activities (d) and environmental
factors (e) are left out. The structures are the body map (6).

About 1,400 categories across body functions, body structures and activities, hierarchical, with a 0 to 4 qualifier
scale.

- **Functional, not diagnostic.** "What can your body do" is friendlier than a diagnosis and closer to how skills
  think.
- **Limitations, handled well.** "Who you could become" adapts paths to a disability rather than hiding them.
- **Body structures** could stand in for Uberon at human scale.
- **Costs:** the scale tops out at "no impairment", so it can't express exceptional ability. Its activities chapter
  overlaps Skills. The license needs checking for commercial use.

### 5. A slice of HPO and Mondo, through a resolver

(Done) `database/conditions_import/` reads Mondo and HPO and writes `database/physical_conditions_seed.cypher`: 262
conditions chosen by hand in `src/picks.rs` (191 diseases from Mondo, 71 features from HPO), one Condition label with
the ontology id as `sourceId`, nested with SUBTYPE_OF and linked to the body functions and structures they AFFECT.
People note conditions (HAS_CONDITION {severity, diagnosed, managed}) on the Conditions view of Physical Traits, private
to them, like impairments. Anything not seeded is looked up in EBI's Ontology Lookup Service and added as the ontology
has it, placed above and below the conditions we have by their stored `ancestors`, and the `ConditionAdded-Physical`
job links it to the body functions and structures it AFFECTS with one LLM call.

Seed a few hundred common, self-reportable conditions: HPO terms with lay synonyms, or a common-conditions list such as
the Global Burden of Disease causes (asthma, ADHD, colour blindness, myopia, type 2 diabetes). Anything else becomes a
stub through a physical resolver, the same way skills and topics do, with the ontology id as its identity.

- **Reuses the resolver and stub machinery,** so cost follows use.
- **Condition-aware paths:** "colour blind, so here's what changes for an electrician."
- **Shopping and School:** products for real needs, learning paths for dyslexia and ADHD.
- **Costs:** this is health data, a special category under GDPR, and conditions sit close to the matching apps, where
  the ADA and discrimination law apply. It needs its own privacy model (visibility per relationship, never used for
  matching by default) before any of it ships. HPO's license limits changing its terms.

### 6. A slim Uberon as the body map

(Done, without Uberon) The ICF body structures are the body map, so there are no Uberon nodes to duplicate them. The
Body map view of Physical Traits draws the body front and back, and `src/physical/body_regions.ts` puts each structure in
a region by its code (the longest matching prefix wins, and what matches none is "All over"). Picking a region shows the
impairments and conditions noted there and notes an impairment in one of its structures.

Organ systems and major regions only, about 200 to 300 nodes, out of Uberon's 15,000+ classes across species.

- **The spine** measurements, abilities and conditions hang on: measurement → structure, condition → structure.
- **A clickable body map** in the UI.
- **Costs:** on its own it gives users nothing. Nobody places themselves on "pyloric antrum".

## Summary

| Piece | Size | Feeds skill requirements | Value to users now | Future apps | Risk |
|---|---|---|---|---|---|
| O\*NET Abilities | 46 | Strong | Medium | Jobs | Low |
| Norms | 50 to 100 measurements | Weak | High | Shopping, dating | Low |
| Self-tests | 20 to 40 | Indirect | High | Verification | Low |
| ICF | about 1,400 | Medium | Medium | Accessibility | License |
| Conditions slice | hundreds, then stubs | Medium | Medium | Shopping, school | High (privacy) |
| Body map | 15 regions over the ICF structures | None | Medium | Body map UI | Low |

## Decided

- **Cognitive abilities** are in Physical, with a second label, Cognitive.
- **Abilities are a percentile** like personality, not graded levels. O\*NET's anchors are examples along the scale.
- **Measurements are their own nodes.** PhysicalMeasurement with NHANES norms (MeasurementNorm per sex and age
  band), a person's readings as HAS_MEASUREMENT {value, measuredOn}, one per reading, and the percentile worked out on
  read. `better` (higher, lower or neither) covers neutral ones like height. Conditions are their own nodes (5).
- **Sex for norms.** An optional `normSex` on Person, used only to pick a norm. Without it a person is compared with
  everyone.
- **Abilities and skills.** An ability is a capacity of the body or mind that makes things easier or harder to learn,
  and a skill is something you get better at by learning how. O\*NET's verbal abilities (oral and written comprehension
  and expression) and quantitative abilities (mathematical reasoning, number facility) are skills, so they're left out
  of the seed. Originality and Fluency of Ideas stay as cognitive abilities. The skills and topics gates, and the
  SkillFilled prompts, send capacities like Manual Dexterity and Stamina to Physical.

## Open questions

- **Conditions and privacy.** Conditions are private to the person, like impairments. A visibility model per
  relationship is still needed before anything else, such as matching, uses them.
