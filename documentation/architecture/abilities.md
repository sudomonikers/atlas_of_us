# How the Abilities Module Works

This explains how the abilities sub-graph gets filled out and how it connects to the rest of the Atlas. For
the graph itself, read `../data_model/abilities/abilities.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/abilities/` | Abilities: chapters of measurements, self-tests and abilities shown as comic animations of someone doing them, results and conditions drawn on a 3D model of the body, and a guide to the abilities |
| Pose models | `application/ui/atlas-of-us-ui/public/pose/` | MediaPipe's pose and hand landmarkers, which find where someone's body or hands are in each camera frame, in the browser |
| Speech model | `application/ui/atlas-of-us-ui/public/speech/` | TensorFlow's speech commands model, which hears short words such as up, down, left and right, in the browser, for answering the far eye chart out loud |
| 3D body | `application/ui/atlas-of-us-ui/public/anatomy/` | The models of the body, one file per layer, and which part each mesh is, served with the site |
| API | `application/apis/atlas-api/src/domains/abilities/` | Readings, their percentiles, and who a person is compared with; where a person stands on each ability; the anatomy; impairments; conditions, and adding ones from Mondo and HPO |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/abilities.rs` | Links a filled skill's levels to the abilities they take |
| Condition links | `application/apis/atlas-jobs/src/events/condition_added/abilities.rs` | Links a condition a person added to the body functions and parts it affects |
| Summary | `application/apis/atlas-jobs/src/jobs/abilities_summary.rs` | Writes Atlas's summary of everything a person has added |
| Seeds | `application/database/abilities_seed.cypher`, `onet_occupations_seed.cypher`, `abilities_norms_seed.cypher`, `abilities_characteristics_seed.cypher`, `abilities_functions_seed.cypher`, `abilities_anatomy_seed.cypher`, `abilities_conditions_seed.cypher` | The abilities and the occupations rated on them, from O\*NET, the measurements with their norms, from NHANES, the characteristics, the body functions, from the WHO's ICF, the anatomy, from FMA and BodyParts3D, and common conditions, from Mondo and HPO |
| Norms import | `application/database/abilities_norms_import/` | Works out the norms from NHANES, adds the self-tests with their published norms, and writes the norms seed |
| ICF import | `application/database/icf_import/` | Reads the WHO's ICF and its definitions from the ICD-API, and writes the body functions seed |
| Anatomy import | `application/database/anatomy_import/` | Reads FMA and BodyParts3D, writes the anatomy seed, and turns BodyParts3D's models into the 3D body |
| Conditions import | `application/database/conditions_import/` | Reads Mondo and HPO, and writes the conditions seed from a hand-picked list |
| Ontology search | EBI's Ontology Lookup Service (OLS) | Finds Mondo and HPO terms that aren't seeded, when a search finds few of ours |

## What we measure
The abilities of the O\*NET content model: capacities of the body and mind that make things easier or harder to learn,
such as strength, eyesight and memory. A person's place on each is a **value** from 0 to 1, a percentile among people
where 0.5 is typical, with a **confidence**, as for personality traits.

Measurements, such as height and push-ups, are numbers a person records. Most have norms from NHANES, the US
national health survey: the value at each percentile, by sex and age band. Self-tests are measurements a person takes
themselves, at home by following written steps or in the app, which times and scores them, with norms from published
surveys and studies. The Atlas's own tests are compared with Atlas users: the api works out their norms from
everyone's readings as readings come in. One of them, of typed answers, is scored by the api with Bedrock: a fast model
reads the answers, and embeddings measure how unusual they are. A person's percentile is worked out when
it's read, from their reading, their age when they took it and their sex for norms, so better norms update everyone at
once. Measurements that show an ability, such as push-ups for Dynamic Strength, are linked to it.

Characteristics, such as a person's sex, which hand they use, their eye color and their blood type, are facts about a
body that are one of a few choices rather than a number. A person answers each once, and can change it. Their sex also
decides who their readings are compared with, or everyone their age when they haven't said, so changing it works out
their abilities again. Which hand they use names the hand in the steps of the tests done with one.

Body functions are the WHO's ICF, the international standard for describing how a body works. Functions are linked to
the abilities they underlie and the measurements that read them, so an impairment shows which abilities it can hold
back.

The anatomy is the Foundational Model of Anatomy (FMA), the reference ontology of human anatomy, cut to the parts
BodyParts3D has 3D models of, from whole systems to single muscles, bones, vessels and nerves, and the main parts it has
no model of. Parts are linked to the functions they carry out. A person notes an impairment in a function or a part,
from mild to complete.

Conditions are diseases from Mondo and features from the Human Phenotype Ontology (HPO), the open ontologies used in
medical research. A few hundred common ones a person would know they have are seeded, each linked to the body functions
and parts it affects, and the most common are offered as a checklist under everyday names. Mondo and HPO have tens of
thousands more, so when a search finds few of ours it looks in the ontology search too, and one picked from there is
added as the ontology has it. The ontology's id is a condition's identity, so the
same condition is only ever added once. Every condition carries the ids of everything above it in its ontology, so a new
one is placed among the ones we have from those alone: under the nearest conditions it's a kind of, and over the nearest
ones that are kinds of it.

## What the user sees
Abilities opens on a story the first time: two people, drawn on a whiteboard, and how their bodies shape what
they could be great at, with the real Atlas shown along the way. Anyone can watch it; it ends on which chapter to start
with, and the chapters take an account. Once a person has seen it, Abilities opens on the chapters, and they can
play it again from there.

Abilities has three tabs: Chapters, Your results and Explore. Chapters lists the chapters, taken one at a time,
with how far through each the person is. Atlas narrates each scene, and each scene holds one thing: something to read, one measurement to take, one ability
to rate, or one list to fill in. A scene about a measurement or an ability shows a comic animation of someone doing it,
drawn in the same marker as the story, and a scene about where things sit in the body shows the 3D model of it, with
the camera flying to the parts it's about. The chapters are:
- Physical Characteristics: their sex, which hand they use and their other characteristics, then their size and shape (height,
  weight, body fat, waist, arm span, upper arm and leg lengths, hand span), resting heart rate and blood pressure.
- Strength and fitness, Coordination and speed, Senses, Mind: one chapter for each category of abilities. Each opens
  on what its abilities are, then has a scene for every measurement that shows one of its abilities, and ends on how
  they did: Atlas sums it up in plain words over a breakdown
  that fills the screen, with every ability's bar out of 100, the results
  waiting on other people to compare with, and the ones still to do a step away.
- Conditions and disabilities: impairments, then conditions. Each one lights up where it sits and tints the parts of
  the abilities it can affect.

Your results shows everything a person has added as a whole: Atlas's summary of it, their characteristics with their size
and vitals against people like them, every ability they have a place on laid out by area, the same drawn on the 3D body
with picking an ability lighting up the parts it uses and what its place comes from, their conditions and impairments, and what's
still to find out, with the chapter that finds it. Explore is a guide to the abilities: what they are, where they
come from (Fleishman's taxonomy and O\*NET), what they can't tell you, how the Atlas places people on them, and what
every test is compared with, then each area with its abilities as cards, each a still of its test. An ability opens
in place on its test's animation, how much practice helps, where its tests are taken, what they're compared with and
how much a reading says, then each test with a way to take it, and how to work on it.

Some home tests can be watched through the camera, so someone can do them alone: standing on one leg, the plank,
plate tapping and the two coin tests are timed, push-ups and bend, twist and touch are counted, and a vertical jump is measured from how long the
toes are off the ground. Steady hand is a test only the camera can take: how far a hand held out at arm's length
wanders in 20 seconds. A pose model finds the body, or the hands up close, in each frame in the browser,
and the video stays on the device. The test starts and stops on what the body does, beeps, and says the result out
loud, and the best of their tries is recorded.

The hearing test plays fading tones through headphones, with the volume first set by a noise as loud as normal
conversation, and estimates the hearing threshold from where each tone stops being heard.

The tab, chapter and scene are kept in the url.

A measurement shows the steps for its home test or runs its in-app test, records a reading and the day it was taken
(VO2 max can be worked out from how far someone runs in 12 minutes),
and shows where it sits among people of their sex and age, compared with men, women or everyone as they choose. An
impairment is in a body function or part, and a condition records how much it affects them, whether it was diagnosed
and whether it's under control. One search finds both, conditions by any of their names, everyday names and
abbreviations included, and body functions and parts, through full-text indexes that match plurals, prefixes and typos.
Measurements, impairments and conditions are only shown to the person who recorded them. The summary written from them
shows on their profile too, which others see only when they make it public.

## The tests
Each test shows one ability. On screen, the app runs and scores it; at home, the person follows written steps and
records the result, and some of those the camera can time or count instead.

**Reasoning**
| Test | How | What the person does | Score | Ability |
|---|---|---|---|---|
| Matrix Puzzles | On screen | Picks the figure that completes a grid of figures | right | Inductive Reasoning |
| Number Series | On screen | Types the next number of a series | right | Inductive Reasoning |
| Shape Rotation | On screen | Picks which block shape is the same one turned, with the rest mirrored | right | Visualization |
| Paper Folding | On screen | Picks how folded, punched paper looks opened out | right | Visualization |
| Perspective Taking | On screen | Imagines standing at one thing on a map and points to another | degrees off | Spatial Orientation |
| Syllogisms | On screen | Judges whether a conclusion follows from statements about made-up things | right | Deductive Reasoning |
| Design Fluency | On screen | Joins five dots into as many different designs as they can | designs | Fluency of Ideas |
| Brick Uses | On screen, scored by the api | Lists uses for a brick | points for the most unusual ideas | Originality |
| Spot the Problem | On screen | Taps what's wrong in everyday pictures, or says nothing is | pictures right | Problem Sensitivity |

**Attention**
| Test | How | What the person does | Score | Ability |
|---|---|---|---|---|
| Digit Span | On screen | Types back digits in order, one longer each time | digits | Memorization |
| Trail Making | On screen | Taps numbers and letters in turn: 1, A, 2, B and on | seconds | Information Ordering |
| Symbol Matching | On screen | Presses the digit a key pairs with each symbol | right | Perceptual Speed |
| Distracting Arrows | On screen | Says which way the middle of a row of arrows points | ms slower when the outer arrows disagree | Selective Attention |
| Card Sorting | On screen | Sorts cards by a hidden rule that changes | avoidable mistakes | Category Flexibility |
| Broken Words | On screen | Types words with parts of them hidden | right | Speed of Closure |
| Hidden Shapes | On screen | Finds which drawing hides a given shape | right | Flexibility of Closure |

**Reflexes and coordination**
| Test | How | What the person does | Score | Ability |
|---|---|---|---|---|
| Reaction Time | On screen | Presses when a target appears | ms | Reaction Time |
| Choice Reaction Time | On screen | Presses one button for a blue P and the other for anything else | ms | Response Orientation |
| Tapping | On screen | Taps one finger as fast as they can | taps | Wrist-Finger Speed |
| Tracking | On screen | Keeps the pointer on a drifting dot | % on target | Control Precision |
| Timing | On screen | Stops a moving dot at a mark, sometimes with the end of its path hidden | ms off | Rate Control |
| Two-Hand Steering | On screen | Steers a dot with one hand for each direction | targets | Multilimb Coordination |
| Track and Count | On screen | Tracks a dot while counting high beeps | points | Time Sharing |
| Steady Hand | Camera | Holds an arm out as still as they can | mm wandered | Arm-Hand Steadiness |

**Senses**
| Test | How | What the person does | Score | Ability |
|---|---|---|---|---|
| Visual Acuity | On screen, or a result typed in | Reads the eye chart from across the room | 20/x | Far Vision |
| Reading Chart | On screen | Reads small letters up close | 20/x | Near Vision |
| Hearing Threshold | On screen with headphones, or a result typed in | Says when each fading tone is gone | dB HL | Hearing Sensitivity |
| Competing Voices | On screen with headphones | Types the digits one voice says while two others talk over it | dB | Auditory Attention |
| Digits in Noise | On screen with headphones | Types the digits a voice says in noise | dB | Speech Recognition |
| Sound Shift | On screen with headphones | Says which way a sound moved between two bursts | microseconds | Sound Localization |
| Odd Color Out | On screen | Spots the tile of a slightly different hue | hue degrees | Visual Color Discrimination |
| Side Vision | On screen | Notices flashes off to the side while looking at a dot | flashes seen | Peripheral Vision |

**Fitness**
| Test | How | What the person does | Score | Ability |
|---|---|---|---|---|
| Push-Ups | At home or camera | Push-ups in a row | push-ups | Dynamic Strength |
| Vertical Jump | At home or camera | Jumps from standing | cm | Explosive Strength |
| Plank Hold | At home or camera | Holds a forearm plank | seconds | Trunk Strength |
| One-Leg Stand, Eyes Closed | At home or camera | Balances on one leg with eyes closed | seconds | Gross Body Equilibrium |
| Plate Tapping | At home or camera | Taps two spots far apart in turn | seconds | Speed of Limb Movement |
| Coin Transfer | At home or camera | Drops coins into a mug one at a time | seconds | Manual Dexterity |
| Coin Turning | At home or camera | Flips a row of coins | seconds | Finger Dexterity |
| Bend, Twist and Touch | At home or camera | Touches the floor, then twists to touch the wall behind | touches | Dynamic Flexibility |
| Hexagon Jump | At home | Jumps out and back over each side of a taped hexagon | seconds | Gross Body Coordination |
| Sit and Reach | At home | Reaches toward their toes with legs straight | cm | Extent Flexibility |
| Squat One-Rep Max | At home | Squats the heaviest they can, or a few reps worked out to one | kg | Static Strength |
| Grip Strength | A result typed in | Squeezes a hand dynamometer | kg | Static Strength |
| VO2 Max | A result typed in | From a fitness watch or a 12-minute run | ml/kg/min | Stamina |

Inductive Reasoning, Visualization and Static Strength each have two tests. Abilities shows the abilities a person can take a test of: Depth Perception, Glare Sensitivity, Night Vision and Speech Clarity have none, and are kept for skills and occupations.

## Abilities
A person's place on each ability is worked out from what they've recorded, by the api, whenever a reading, their sex
for norms or an impairment changes, and whenever they open Abilities, so norms that shift as other
people take the tests reach them. Every ability is worked out together in one query, and a change returns the result
with what it saved. The latest reading of each
measurement that shows an ability counts, weighted by how much that measurement says about it. An impairment in what the ability rests on is
noted beside it, and leaves where they stand as it is. Each ability has tips on working on it, one on what to do and one on working
around an impairment, and how much practice changes it. A chapter's breakdown offers the first on an ability where the
person is below typical, and the second wherever an impairment is noted. The result is kept on the person as HAS_ABILITY, which is what skills compare against: a skill level's
abilities show beside where the person stands, as its personality traits do, along with the person's conditions and
impairments in the functions and parts each ability rests on.

## Skill requirements
Every skill level is linked to the abilities it takes, so a person can see how what they have to work with fits a
skill. How much of an ability a level takes is a level on O\*NET's anchored scale, the same one O\*NET's job analysts
rate occupations on, so the Atlas's estimates sit beside expert ratings.

A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`). It finds the occupations nearest
the skill by meaning, and one LLM call reads the skill, its levels, each ability's anchors and those occupations with
what they take. It names the occupation whose work is doing the skill, if one of them is, and for each ability that
makes a real difference at a level, places it on the scale by the anchor tasks, starting from the occupation's ratings,
with how much it matters and why. It does nothing for a skill already worked out on the scale, and replaces
requirements written before it, so replaying the event archive to its rule recomputes the skills we have. A skill stays
usable without them.

## Linking added conditions
The seeded conditions link to the body functions and parts they affect by hand. One a person adds is linked by a job:
the api publishes `ConditionAdded`, and one LLM call reads the condition, its other names and what its broader
conditions affect, and picks from every body function and the major body parts: the organs, systems and regions. A condition stays usable without its links, and
a condition that has them is left as it is.

## Summary
Atlas writes a summary of everything a person has added when they ask for it on Your results. The api gathers what it's
written from (their characteristics, the latest reading of each measurement with where it sits, where they stand on
each ability, and their conditions and impairments with the abilities each can affect) and queues the
`abilities_summary` job with it. One LLM call writes it in Atlas's voice, and it's kept with what it was written from, so
a change to any of that marks it stale and they can ask for it again. It takes a place on a few abilities to ask, and
each one costs a credit, given back if it can't be written (see `credits.md`).

## The 3D body
The 3D body is BodyParts3D's models of a real human body, simplified when the anatomy seed is generated so the whole
body loads in a browser, and drawn in the browser with three.js as a comic x-ray: the skin is an inked figure, and the parts inside it are drawn in flat color with ink between them. Each layer is its own file,
loaded the first time it's shown. Every mesh is named, and a file beside the models says which part each one is. The
module's data sets are linked at a few points (conditions to parts and functions, measurements to parts and
functions, parts to the functions they serve). Lighting up a part lights up every mesh it's drawn with, or those of the parts within it and kinds of it;
a part with no model lights up the nearest part it belongs to that has one. An ability lights up the parts that serve
the functions it rests on, and a body function the parts that serve it.
