# Physical Norms Import

Writes `../physical_norms_seed.cypher`: the physical measurements (`documentation/data_model/physical_attributes/`), and
for each one the value at each of a list of percentiles, by sex and age band. Most norms are worked out from NHANES with
its survey weights (`src/measurements.rs`). The self-tests, which a person takes at home or in the app, have their norms
from published surveys and studies (`src/published.rs`). The seed is generated, so change those and run this again
rather than editing it.

## Getting NHANES
The import reads NHANES's SAS transport (`.xpt`) files: the exam files for each measurement and the demographics for
each survey cycle they come from. `--urls` lists them. Download them into `data/`, which git ignores:

```sh
mkdir -p data && cargo run -q --release -- --urls | while read url; do
  curl -sfLo "data/$(basename "$url")" "$url"
done
```

NHANES is by the CDC's National Center for Health Statistics, and is in the public domain.

## Running it
```sh
cargo run --release -- data ../physical_norms_seed.cypher
```

Then run the seed against the database, after `physical_abilities_seed.cypher`, since measurements link to the
abilities they show.

- **Who's in a norm:** everyone in the cycles with a value, a sex, an age and an exam weight, leaving out pregnant
  women. With several cycles, each one's weights are divided by how many there are.
- **Groups:** male, female and all, in the age bands 12 to 17, then by decade from 18 to 79, and 80 and over (NHANES
  records everyone 80 and over as 80). A group with fewer than 100 respondents is left out, so a measurement only has
  the ages NHANES tested it at: VO2 Max is 12 to 49, Body Fat 12 to 59 and Hearing Threshold 20 to 69.
- **Percentiles:** 1, 3, 5, then every 5 to 95, then 97 and 99. Each respondent sits at the middle of the share of the
  population their weight stands for, and values between them are interpolated.

| Measurement | NHANES file | Value |
|---|---|---|
| Height, Weight, Body Mass Index, Waist and Hip Circumference, Upper Arm and Upper Leg Length | BMX | As measured |
| Resting Heart Rate, Systolic and Diastolic Blood Pressure | BPXO | The mean of three oscillometric readings |
| Grip Strength | MGX | The best of three tries with each hand |
| VO2 Max | CVX | The estimate from the submaximal treadmill test (`CVDESVO2`) |
| Body Fat | DXX | Total percent fat from the DXA scan |
| Hearing Threshold | AUX | The pure tone average of 500, 1000, 2000 and 4000 Hz in the better ear. No response counts as 120 dB |
| Visual Acuity | VIX | The better eye's presenting acuity, with usual correction. Worse than 20/200 counts as 20/400 |

Visual acuity is recorded in steps (20/20, 20/25, 20/30...), so many percentiles share a value: most young adults see
20/20.

## Self-tests
`src/published.rs` holds each self-test's norms as its source gives them: values at percentiles, or a mean and standard
deviation for each group, which become values at the seed's percentiles (fitted as normal, or as log-normal for a value
bunched near zero like seconds balanced on one leg). Values are kept within what can be recorded, so a test's ceiling is
where the best readings bunch up.

| Test | Where it's done | Ability | Norms |
|---|---|---|---|
| Sit and Reach | Home | Extent Flexibility | Canadian Health Measures Survey cycle 5, ages 12 to 69 (Hoffmann and colleagues, Health Reports, 2019). Statistics Canada Open Licence |
| Vertical Jump | Home | Explosive Strength | The same survey's jumping height, ages 12 to 69 |
| Push-Ups | Home | Dynamic Strength | CSEP-PATH ratings, ages 15 to 69, read as fifths of people. Men from the toes, women from the knees, so there's no norm for everyone |
| One-Leg Stand, Eyes Closed | Home | Gross Body Equilibrium | Springer and colleagues, 2007, ages 18 and over, everyone together |
| Reaction Time | App | Reaction Time | Woods and colleagues, 2015, ages 18 to 65 |
| Choice Reaction Time | App | Response Orientation | Woods and colleagues, 2015, ages 18 to 65 |
| Digit Span | App | Memorization | Woods and colleagues, 2011, ages 18 to 65, forward span |
| Trail Making | App | Information Ordering | Tombaugh, 2004, Trail B, ages 18 to 89, all levels of education |

The Atlas's own tests (the reasoning tests, the tests of attention, coordination, the senses and ideas, and the home
tests after them in `src/published.rs`) have `Norms::Atlas`: the seed writes them with `atlasNorms` and no norms, and the api works out their norms
from Atlas users' readings (`apis/atlas-api/src/domains/physical/community.rs`). Re-running the seed keeps those norms.
Their item counts and time limits match the ui's `src/physical/puzzles.ts`.

Visual Acuity, from NHANES, can also be measured in the app: its `test` is `eye_chart`, set in `src/measurements.rs`.

`confidence` on each measurement is how much a reading says about the ability it shows. The self-tests' is lower than
NHANES's: their norms come from smaller or less representative samples, and the app's tests run on whatever screen and
mouse or touch screen a person has.

