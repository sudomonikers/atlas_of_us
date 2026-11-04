# Fleshing out the ability tests

Real tests for the abilities that only have a self-rating, to work through one at a time. A self-rating is one pick from
O\*NET's three examples, which are job tasks nobody can judge themselves on ("invent a new type of man-made fiber"), so
it says little. A test gives a reading that can be compared with other people.

Where each ability stands now: 37 of the 46 have a measurement, and the other 9 have only the self-rating.

## What a test needs
- **A task a person can do alone**, in the browser or at home with what's in a house.
- **Norms from a source the Atlas can use**: published, from a sample of ordinary adults, and free of a license that
  rules the Atlas out. Each one goes in `physical_norms_import/src/published.rs` with its source and a confidence.
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
| Speech Recognition, Hearing Sensitivity | Digits in noise: three digits in rising background noise, with headphones | App | Smits 2004 and the WHO's hearWHO | Needs recordings of the digits, made for the Atlas |
| Fluency of Ideas | Type as many animals as you can in 60 s | App | Tombaugh, Kozak and Rees 1999, or the NACC's UDS 3 norms (Weintraub 2018) | Built as Animal Naming, compared with Atlas users. Needs the norm tables (paywalled or image-only) to compare with the published study |
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
| Visual Color Discrimination | Odd Colour Out | 30 goes, a staircase on hue |
| Peripheral Vision | Side Vision | 24 flashes out to 30 degrees and 4 blanks, on a screen 29 cm wide or more |
| Fluency of Ideas | Animal Naming | 60 seconds, an LLM keeps the different animals |
| Originality | Brick Uses | 2 minutes, an LLM keeps the genuine uses, scored on the three furthest from a brick and the most common uses (embeddings) |

| Trunk Strength | Plank Hold (home) | as long as you can hold it, with the app's stopwatch |
| Manual Dexterity | Coin Transfer (home) | 20 coins into a mug, one at a time |
| Finger Dexterity | Coin Turning (home) | turn over 10 coins with one hand |
| Speed of Limb Movement | Plate Tapping (home) | the Eurofit layout, 25 taps on each of two marks 80 cm apart |
| Gross Body Coordination | Hexagon Jump (home) | three times around a 60 cm taped hexagon |
| Dynamic Flexibility | Bend, Twist and Touch (home) | after Fleishman's test, as many as you can in the app's 20 second countdown |

Brick Uses compares answers with a fixed list of the uses people give most often. Every answer is kept on its reading,
so once there are plenty, the list can become the Atlas's own most common answers.

To build:

- **Arm-Hand Steadiness:** hold the phone out at arm's length for 20 s while its motion sensor measures the shake.
- **Sound Localization:** 3D sound in headphones.
- **Auditory Attention:** digits in noise with a second voice over them.
- **Speech Clarity:** read sentences aloud and score how many words speech recognition gets. It's biased against
  accents, so the wording needs care.

## Tier 3: a short questionnaire in place of the self-rating
For Night Vision, Glare Sensitivity, Depth Perception and Problem Sensitivity, which no screen or house can test, and as
the fallback for every ability until it has a test: 4 or 5 everyday questions answered on a scale, in place of one pick.
The Low Luminance Questionnaire (Owsley 2006) covers night vision and glare. A questionnaire stays the lowest confidence,
and any test outranks it.

## The order
1. Unblock the rest of tier 1: the norm tables, then the digit recordings.
2. The questionnaire, since it replaces the self-rating for every ability at once.
3. The rest of tier 2.
4. Once the Atlas's own tests have a few hundred readings, check each item: ones nearly everyone gets right or wrong, or
   that strong scorers miss, say little and should be swapped before the norms settle.
