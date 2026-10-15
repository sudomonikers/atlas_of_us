# ADR: A persona regression harness for personality scoring

**Status:** Accepted, 15 Oct 2026
**Where it lives:** `application/ui/atlas-of-us-ui/src/personality/testing/`

## Context
The personality track scores 43 traits from free-text answers to 15 game-style scenes, using an LLM (see
`../personality.md`). That makes it hard to test in the usual ways:

- **There's no right answer to assert on.** The same answer can reasonably land a few points either side, and the model is not perfectly repeatable.
- **Small changes have large effects.** One line of the scoring prompt, one reworded question, or a change to how evidence is combined can move every trait for every person. We had no way to tell whether a change helped.
- **The full loop has many parts.** The UI builds the context for each answer, the API stores it and decides when to score, SQS queues the job, and the Lambda calls Bedrock and writes the scores back. Bugs showed up in the joins between them, such as old answers from a replayed scene being scored, and a deadlock when several people played at once.
- **We have no real users yet** to measure against.

We needed a repeatable way to measure how close the scores are to what the answers actually show, to compare one change
against the last, and to exercise the real pipeline end to end.

## Decision
We test with **scripted personas played through the real API**, and measure the scores against **targets set from the
persona's answers**.

### Personas
- Each persona is one file in `personas/`. It holds a test account, a one-line personality, a target from 0 to 1 for every
  trait, and a scripted answer to every prompt of every scene.
- There are ten, chosen to cover the extremes and the middle of most traits:

  | Persona | Personality |
  |---|---|
  | Ruth | an anxious, rule-bound, kind introvert |
  | Dev | a loud, warm, competitive salesperson who answers in one-liners |
  | Sam | a calm, imaginative, disorganised art teacher |
  | Morgan | a blunt, sceptical, stubborn operations manager |
  | Jules | a low, stuck, impulsive 24-year-old dropout |
  | Chris | deliberately ordinary and middle of the road |
  | Kai | a carefree, thrill-seeking surf instructor |
  | Noor | an analytical, unconventional, independent physicist |
  | Grace | a warm, generous retired nurse and community organiser |
  | Ray | a short-fused, suspicious, stubborn trucker |

- **Answers come before targets.** A persona's answers are written in character first. Its targets are then set trait by trait from what those answers actually show. Picturing the persona instead of reading the answers was the biggest source of error in every early round.
- The targets were checked by **blind raters**: ten independent subagents scored anonymised answer sheets without seeing the targets. They agreed with the targets to within 4.6 points on average.

### The run (`regression.mjs`)
For every persona at once:
1. Log in, creating the account the first time.
2. Call `DELETE /api/personality/answers` to clear its answers and scores, so every run starts like a new player.
3. Play all 15 scenes through the local API exactly as the UI's `ScriptPlayer` does: follow the branches its choices lead
   to, and send the same context, choices offered, facets and clock with each answer.
4. Wait for scoring between scenes, as the UI does. Scoring runs on every 5th finished scene; if the last scene didn't
   trigger it, call `POST /api/personality/rescore`.
5. Read back the scores, compare them with the targets and with the previous run, and save the run to `results/` as JSON
   (which the next run compares against) and as a markdown report.

`--check` checks every persona offline, without the API: every prompt on its path has an answer, every answer is used,
and every trait has a target. It is run after any change to a scene's prompts.

### The measure
- The headline number is the **average gap** between score and target across all 430 persona-trait pairs, on the 0 to 1 scale.
- Alongside it: the share within 10 points, the number more than 25 points off, the bias (whether scores run high or low), and the gap at the low, middle and high ends of the scale, which catches scores being pulled to the middle.
- After a run we read the scorer's evidence behind the biggest misses (`GET /api/personality/people/{id}/evidence`) and decide whether the scorer misread the answer, the trait's criteria were unclear, the trait had too little evidence, or the target was wrong. We write up findings before changing anything. The write-ups are `personality_round_1.md` to `personality_round_5.md`, and the current state is `scoring_capabilities.md`.

### How it's run
- It runs by hand, from the UI folder, against the local API: `node src/personality/testing/regression.mjs [persona...]`.
- Scoring happens in the deployed atlas-jobs Lambda, so a change to the scorer is deployed (`apis/atlas-jobs/deploy.sh`) before the run that tests it.
- A full run takes 5 to 7 minutes and costs about $7 of Bedrock calls.
- It is not part of CI.

## Consequences
**What it gave us**
- **A number to steer by.** The average gap went from about 12 points in round 1 to 7.1 points with holistic scoring, close to the blind raters' own 6.6. Each step along the way (facets, per-trait criteria, scoring all answers in one call) was kept or dropped on the strength of a run.
- **It ruled things out cheaply.** Haiku 4.5 scored 10.7 points and flattened profiles, so we stayed on Sonnet.
- **It found real bugs.** It found old answers from replayed scenes being scored. Running ten players at once also deadlocked the API, which led to the connection-pool fixes. Both fixes are now in the API.
- **It added one endpoint to the product.** `DELETE /api/personality/answers` lets a signed-in person clear their own answers and scores.

**What it costs and doesn't tell us**
- **The personas are easy players.** They answer every question fully, honestly and in character. Real players will be terser, evasive and inconsistent, and only Dev's one-liners test that at all.
- **Targets go stale.** They have to be revisited whenever a scene is added or reworded. The current targets predate The Soap House.
- **Costs grow with the game.** Each scene adds to the scripted answers in all ten personas, and every run costs real money, so it's run when a change calls for it, not on every commit.
- **Scores aren't exactly repeatable.** Rescoring the same answers moves traits by about 2 points, so differences smaller than that between runs are noise.

## Alternatives considered
- **Unit tests on the scorer with fixed expected scores.** Rejected: the model isn't repeatable to the point, and a fixed
  answer for one answer doesn't say whether the whole profile is right.
- **Calling the scorer directly, skipping the API and UI flow.** Cheaper, but it would have missed the context the UI builds, the when-to-score logic, and both bugs the harness found. Playing through the API keeps the test honest to what players actually send.
- **Real people with a validated questionnaire.** This is the real test, and it's the recommended next step: 10 to 20 people play all 15 scenes and also take the IPIP-NEO-120, which covers the same 30 Big Five facets. It couldn't be done before launch, and it can't be rerun after every change, so the persona harness stays as the fast loop alongside it.
