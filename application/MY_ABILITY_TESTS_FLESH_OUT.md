# Fleshing out the ability tests

Real tests for the abilities, to work through one at a time. A test gives a reading that can be compared with other
people, and an ability shows in Abilities once it has one.

Where each ability stands now: 42 of the 46 have a measurement. Depth Perception, Glare Sensitivity, Night Vision and
Speech Clarity have none, since no screen or house can test them well, so they aren't asked about.

## What a test needs
- **A task a person can do alone**, in the browser or at home with what's in a house.
- **Norms from a source the Atlas can use**: published, from a sample of ordinary adults, and free of a license that
  rules the Atlas out. Each one goes in `abilities_norms_import/src/published.rs` with its source and a confidence.
- **The same procedure as the norms**, or a note in the measurement's description saying how it differs.

Sources ruled out by their license:
- **ICAR** (matrix reasoning, 3D rotation, letter-number series): academic use only, and "cannot be used for routine
  assessment". It has no norms either.
- **MaRs-IB** (matrix reasoning): non-commercial research only, with no population norms.
- **Commercial batteries**: WAIS, SDMT, the Golden Stroop, the Group Embedded Figures Test and NIH Toolbox.

## Tier 1: a test with norms that fit

| Ability | Test | Where | Norms | Status |
|---|---|---|---|---|
| Information Ordering | Trail Making B: tap 1, A, 2, B and on to 13 | App | Tombaugh 2004, ages 18 to 89 | Done |
| Far Vision | Eye chart: tumbling E on a screen sized with a bank card, from 3 m | App | NHANES visual acuity (the existing measurement) | Done |
| Speech Recognition | Digits in noise: three digits in a noise shaped like the voice, with headphones | App | Smits 2004 and the WHO's hearWHO | Built as Digits in Noise, compared with Atlas users, since its recordings (`public/voices`, made with Amazon Polly and `scripts/make-noise.mjs` by `scripts/make-voices.sh`) differ from the published ones |
| Fluency of Ideas | Join five dots with four lines into as many different designs as you can in 60 s | App | Ruff Figural Fluency Test and D-KEFS Design Fluency | Built as Design Fluency, compared with Atlas users |
| Wrist-Finger Speed | Finger tapping, 10 s tries | App | Hubel and colleagues 2013 (Woods lab, the same keyboard test) | Built as Tapping, compared with Atlas users. Needs the paper's tables (paywalled) to compare with the published study |
| Trunk Strength | Partial curl-ups to a beat | Home | CSEP-PATH, ages 15 to 69 | Plank Hold is built, compared with Atlas users. Curl-ups need the CSEP manual's table |
| Stamina (a second test) | YMCA 3-minute step test, then a 1-minute pulse count | Home | YMCA | Published copies of the table disagree; needs the YMCA manual |

To unblock the paywalled ones, a library copy of each paper or manual is enough: the norms are in one table.

## Tier 2: the Atlas's own tests, compared with Atlas users
Tests with no published norms that fit are compared with Atlas users. The api works out their norms from everyone's
latest reading as readings come in (`community.rs`), by age group once a group has 100 people. Until then a reading is
recorded but doesn't count toward the ability. Items are generated in the ui from fixed seeds (`puzzles.ts`), so everyone
takes the same test, and changing a generator, seed, count or time limit makes it a different test.

Done:

| Ability | Test | Items |
|---|---|---|
| Inductive Reasoning | Matrix Puzzles | 20 in 10 minutes, one to four features changing by rules |
| Inductive Reasoning | Number Series | 16 in 8 minutes, typed answers |
| Visualization | Shape Rotation | 16 in 7 minutes, the wrong choices mirror images |
| Visualization | Paper Folding | 14 in 7 minutes, one to three folds |
| Spatial Orientation | Perspective Taking | 12 in 6 minutes, scored by average degrees off |
| Deductive Reasoning | Syllogisms | 20 in 7 minutes, half that follow, made-up words |
| Perceptual Speed | Symbol Matching | 90 seconds, a key of nine symbols |
| Selective Attention | Distracting Arrows | 48 rows, scored by how much slower the conflicting ones are |
| Category Flexibility | Card Sorting | 60 cards, the rule changing after 6 right in a row |
| Speed of Closure | Broken Words | 20 in 4 minutes, from half the word showing down to a quarter |
| Flexibility of Closure | Hidden Shapes | 16 in 6 minutes |
| Wrist-Finger Speed | Tapping | best of three 10 second tries |
| Control Precision | Tracking | 45 seconds on a drifting dot |
| Rate Control | Timing | 20 tries, half with the end of the path hidden |
| Multilimb Coordination | Two-Hand Steering | 60 seconds, keyboard or touch screen |
| Time Sharing | Track and Count | 60 seconds of tracking while counting high beeps |
| Near Vision | Reading Chart | the eye chart at 40 cm, down to the smallest line the screen can draw |
| Visual Color Discrimination | Odd Color Out | 3 practice and 30 tries, a staircase on hue |
| Auditory Attention | Competing Voices | 3 practice and 16 rounds of three digits from one voice under two others, a staircase on their level settling at 3 rounds in 4 right |
| Speech Recognition | Digits in Noise | 2 practice and 24 rounds of three digits in noise, 2 dB up and down, settling at half right, scored as in the published test |
| Sound Localization | Sound Shift | 3 practice and 30 tries of a sound moving left or right by its timing between the ears, a staircase settling at about 7 in 10 right |
| Peripheral Vision | Side Vision | 24 flashes out to 30 degrees and 4 blanks, on a screen 29 cm wide or more |
| Fluency of Ideas | Design Fluency | 60 seconds of designs joining five dots with four lines, counted by the different sets of lines |
| Originality | Brick Uses | 2 minutes, an LLM keeps the genuine uses, scored on the three furthest from a brick and the most common uses (embeddings) |
| Problem Sensitivity | Spot the Problem | 17 everyday pictures in 4 minutes, about a third with nothing wrong, scored on pictures right, a tap counting only on the problem itself |

| Trunk Strength | Plank Hold (home) | as long as you can hold it, with the app's stopwatch |
| Manual Dexterity | Coin Transfer (home) | 20 coins into a mug, one at a time |
| Finger Dexterity | Coin Turning (home) | turn over 10 coins with one hand |
| Speed of Limb Movement | Plate Tapping (home) | the Eurofit layout, 25 taps on each of two marks 80 cm apart |
| Gross Body Coordination | Hexagon Jump (home) | three times around a 60 cm taped hexagon |
| Dynamic Flexibility | Bend, Twist and Touch (home) | after Fleishman's test, as many as you can in the app's 20 second countdown |

Brick Uses compares answers with a fixed list of the uses people give most often. Every answer is kept on its reading,
so once there are plenty, the list can become the Atlas's own most common answers.

## The order
1. Unblock the rest of tier 1: the norm tables.
2. The rest of tier 2.
3. Once the Atlas's own tests have a few hundred readings, check each item: ones nearly everyone gets right or wrong, or
   that strong scorers miss, say little and should be swapped before the norms settle.
