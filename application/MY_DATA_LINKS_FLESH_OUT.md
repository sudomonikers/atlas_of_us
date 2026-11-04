# Fleshing out the links between data sets

Every data import in the Atlas, how the data they write connects, and where it should connect but doesn't yet, to work
through one at a time.

## The imports

### Generated seeds
Each reads its source once and writes a `.cypher` seed in `application/database/`.

| Import | Source | Writes |
|---|---|---|
| `physical_norms_import` | NHANES (CDC) | `PhysicalMeasurement` and `MeasurementNorm` (percentiles by sex and age band); measurement `MEASURES` ability |
| `icf_import` | WHO ICF and the ICD-API's definitions | 346 `BodyFunction`s with `SUBFUNCTION_OF`; function `UNDERLIES` ability; measurement `MEASURES` function |
| `anatomy_import` | FMA and BodyParts3D | 3,488 `BodyPart`s with `SUBPART_OF`, `PART_SUBTYPE_OF` and `major`; part `SERVES` function; measurement `MEASURES` part; the 3D body in `ui/atlas-of-us-ui/public/anatomy/` |
| `conditions_import` | Mondo and HPO | 262 `Condition`s with `SUBTYPE_OF` and `ancestors`; condition `AFFECTS` function or part |

### Imports through the api
Each asks the live api for every item, the way a user asks, so it goes through the gates, the resolver and the events.

| Import | Source | Writes |
|---|---|---|
| `skills_import` | ESCO's skills (Tabiya's csv export) | `Skill` stubs, then `SkillCreated` and the fill jobs |
| `topics_import` | ESCO's knowledge (the same csvs) | `Topic` stubs, filled when someone needs them |

### Hand-written seeds
- `physical_abilities_seed`: 46 O\*NET `Ability` nodes.
- `personality_seed`, `personality_explore_seed`, `personality_scenarios_seed`: the Big Five model, domains, facets and
  `INTERACTS_WITH`, and the scenarios with their questions.
- `auth_constraints` and `migrations/001` to `005`.

### Jobs that add data at runtime
- `SkillFilled`, in the Skills, Personality, Physical and Topics modules: each writes one kind of requirement from a
  skill level, `REQUIRES_SKILL`, `REQUIRES_TRAIT`, `REQUIRES_ABILITY` or `REQUIRES_KNOWLEDGE`.
- `TopicFillRequested`.
- `ConditionAdded`, in Physical: `AFFECTS`.

## How they connect

```
                 Skill ──REQUIRES_ABILITY──┐        (SkillFilled, Physical job)
                   │                      ▼
   REQUIRES_TRAIT  │  REQUIRES_KNOWLEDGE  Ability ◄──UNDERLIES── BodyFunction ◄──SERVES── BodyPart
        ▼          ▼                      ▲                     ▲   ▲                ▲
 PersonalityTrait  BloomLevel/Topic       └──MEASURES── PhysicalMeasurement ─MEASURES┘   │
                                                             (also MEASURES BodyPart) ───┘
                                          Condition ──AFFECTS──► BodyFunction | BodyPart
```

- **Physical is densely linked within itself.** Measurements, functions, parts and conditions meet at functions and
  parts, and a part's page gathers everything linked to it, to the parts above and below it, and to the functions those
  serve.
- **Ability is Physical's one link to the rest of the Atlas.** Skills point at it, and so do functions and measurements.
- **Personality and Topics link only to Skills**, through `REQUIRES_TRAIT` and `REQUIRES_KNOWLEDGE`.
- **The two kinds of import work differently.** The ESCO imports exercise the live api, end to end. The Physical
  imports write static reference data that the api reads across.

## Where they should connect

1. **(Done) Set where a person stands on each ability.** The api works out `HAS_ABILITY` from readings, self-tests,
   ratings and impairments, and skill levels show their abilities beside it. Tests for the abilities that only have a
   self-rating are in `MY_ABILITY_TESTS_FLESH_OUT.md`. What it was:
   - Measurements already `MEASURE` abilities and readings already have percentiles: grip strength could give Static
     Strength, and visual acuity Near Vision and Far Vision.
   - Impairments could cap it: a complete impairment in b2100 rules out a typical Far Vision.
   - The skill achievement view (`apis/atlas-api/src/domains/skills/achievement.rs`) compares the person's skills,
     knowledge and traits with what a level requires, but leaves out `REQUIRES_ABILITY`.
   - This joins measurements to skills.

2. **Show how conditions and impairments bear on skills.** The path condition → function → ability ← skill level is
   already in the graph, and nothing reads it.
   - A skill page could say "carpal tunnel syndrome affects Manual Dexterity, which this level relies on".
   - A part's page could list the skills behind the abilities it already shows.

3. **Link Mondo diseases to their HPO features.** HPO publishes disease-to-feature annotations (`phenotype.hpoa`, by
   OMIM and Orphanet id, which Mondo cross-references), so a disease could link to its features: Marfan syndrome to
   joint hypermobility. HPO's logical definitions also name the anatomy each feature is in (Uberon, which
   cross-references FMA), which could give an added HPO feature its `AFFECTS` links without the LLM, or check the LLM's
   picks.

4. **Link measurements to the conditions they bear on.** Blood pressure and hypertension share b420, and BMI and waist
   circumference share a function with obesity, but nothing says a reading is in a condition's range. A direct link, or
   a range on it, would let the Measurements view point to relevant conditions, as information rather than diagnosis.

5. **Link ICF's personality functions to the Big Five.** `b126 Temperament and personality functions` is seeded, and
   its sub-functions (extraversion, agreeableness, conscientiousness, openness and more) map almost one to one onto the
   Big Five domains. A hand-picked mapping would be the first link between Physical and Personality. Mental health
   conditions that affect b126 would then sit next to traits, which needs careful wording in the ui.

6. **Use a person's conditions to suggest their impairments.** A condition's `AFFECTS` links name the functions and
   parts it usually impairs, so noting a condition could offer them as impairments to note. The two are kept apart now,
   and only meet on a part's page.

7. **Link the anatomy to Topics.** The body map is a place to learn, and Topics is the learning graph. ESCO's knowledge
   has anatomy, physiology and their branches, which systems and organs could link to, so learning more from a part
   leads to a topic.

8. **Use the source data left on the table.**
   - ESCO's skill-to-skill relations (essential and optional, `skill_to_skill_relations.csv` in the same Tabiya export)
     could seed or check the `REQUIRES_SKILL` and `REQUIRES_KNOWLEDGE` the jobs write.
   - ICF's activities and participation (d) overlap Skills. A crosswalk would tie impairments to everyday activities,
     such as walking and dressing, as well as to job skills.

## The order

1 and 2 first: they make the ability links that already exist count for a person, and need no new source data. 3 is the
most valuable new data. 5 is a small hand-picked mapping that brings Personality in.
