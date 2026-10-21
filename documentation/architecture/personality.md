# How the Personality Module Works

This explains the personality module end to end: what the player sees, what gets stored, and how answers become trait
scores. For why we measure personality through scenes built from the IPIP-NEO rather than a questionnaire, read the
module's README (`application/ui/atlas-of-us-ui/src/personality/README.md`) and `ADRs/personality_ipip_scenes.md`. For
the graph itself, read `../data_model/personality/personality.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/personality/` | The scenes, the scenario list, My Personality and the Explore tab |
| API | `application/apis/atlas-api/src/personality/mod.rs` | Saves answers, decides when to score, queues scoring and contest jobs, serves scores and evidence |
| Scoring job | `application/apis/atlas-jobs/src/personality_scoring.rs` | A Lambda job that reads a person's answers with Bedrock and writes their traits |
| Contest job | `application/apis/atlas-jobs/src/personality_contest.rs` | A Lambda job that reviews one piece of evidence the person contested |
| Report | `application/apis/atlas-jobs/src/personality_report.rs` | Writes a fully scored person's report, called by both jobs |
| Queue and Lambda | `application/infrastructure/jobs_lambda.tf` | The SQS queue between the API and the job, and the job's Lambda, model and timeout |
| Seeds | `application/database/personality_*.cypher` | The traits, the scenarios and their questions, and the Explore reading material |

## What we measure
- **The 30 facets of the Big Five,** six per domain, as defined by the IPIP-NEO.
- **Each facet is a `PersonalityTrait` node,** linked from its `PersonalityDomain` by `HAS_FACET`. A person's score is a
  `HAS_PERSONALITY_TRAIT` relationship to it, with:
  - `value` from 0 to 1, where 0.5 is typical;
  - `confidence` from 0 to 1, for how much the answers say about it.

## The scenes
There are 18 scenes, each a folder in the personality UI. Each is written to a set of IPIP-NEO items: 150 in all, 5 per
facet, with each item in exactly one scene. Which items are in which scene is in `scene_grouping.md`, in the same folder.

Each scene has:
- a `script.ts`, its story;
- its own art;
- its own sounds.

The player clicks through narration and dialogue, and at certain points answers a prompt.

**A script** is a set of sections, each a list of steps. A step is either:
- a **frame**: a line of narration or dialogue, with the animation to play;
- a **prompt**: a question with a free-text box. A prompt can also offer **choices**, where the player picks one and then
  explains why. Each choice leads to its own next section, so scenes branch.

**Each prompt also lists its `facets`:** the facets of the items it was written to test. These go to the scorer with the
answer, as a hint about what the moment gave the player a chance to show. They don't limit what gets scored.

**Scenes come in three modes:**
- **Story:** a hypothetical with choices and free-text reasons.
- **Live:** what the player actually does in the app, such as what they open and what they skip.
- **Interview:** a direct question with every frequency pinned down ("on how many of the last 30 days"), for inner states and
  habits a single situation can't show.

**A few other features:**
- **Clocks:** some scenes run a real countdown over part of the script. Prompts inside the clock can be skipped when it
  runs out, and each answer records how much time was left.
- **Real-life questions:** every scene ends with one, a question about the player's own life rather than the story. It is
  marked `real_life` in the seed. These are the strongest evidence we get.

**Each scenario and its questions are also in the graph:**
- `(:PersonalityScenario)-[:HAS_QUESTION]->(:PersonalityScenarioQuestion)`, seeded from
  `personality_scenarios_seed.cypher`.
- A scenario's `order` is its place in play order, and decides its scoring batch.
- A question's `key` matches the prompt's `id` in the script.
- A question's `order` decides which question is last.
- How to add a scene is in `CREATE_SCENE.md`, in the personality UI folder.

**Before a scene starts,** a popup gives tips on getting the most out of it. A player can tick "Don't show this again",
which is stored in their browser only.

## Answering a question
When the player moves past a prompt, the UI calls `PUT /api/personality/answers` with:

| Field | What it is |
|---|---|
| `answer` | Their text, or the label of the choice they picked |
| `reasoning` | Their explanation, for choices |
| `context` | Everything they saw since the last prompt, on the path they took, plus the choices offered. The scorer needs this to know what they're answering |
| `facets` | The prompt's facets |
| `clock` | How long the clock was, how much was left, and whether it ran out. Only sent when the scene has a clock running |

The API stores all of it on an `ANSWERED` relationship from the person to the question. Answering the same question again
overwrites it.

**Replays:**
- Answering a scene's first question clears that person's other answers to the scene before saving.
- This matters because a replay can go down a different branch, and the old branch's answers would otherwise still be scored.
- The deletes run in their own small transactions, because many players share the same question nodes, and one big delete deadlocked against other players.

## When scoring happens
- **Scenes are scored in batches of 6, by their order:** scenes 0–5 are a batch, then 6–11, then 12–17.
- A scene is **finished** when its last question (the highest `order`) has been answered.
- When an answer finishes a scene, the API checks whether every scene in that scene's batch is finished. If so, it scores
  that batch. Replaying a scene in a finished batch rescores the batch.
- `POST /api/personality/rescore` scores every batch for the signed-in person on demand.

**To start scoring, the API:**
1. Reads the person's answers in the batch (or every batch), grouped by batch and ordered by scene, then question.
2. Puts a `JobRunning` node on the person.
3. Sends the job (the answers, batch by batch) to SQS.

If sending fails, it removes the `JobRunning` node again.

**While a job is running:**
- The UI polls `GET /api/personality/scoring` and locks the scenarios until it's done.
- A `JobRunning` node older than 35 minutes is treated as dead and cleared.
- Running locally without a queue, the API logs the job instead, to be run through atlas-jobs by hand.

## How scoring works
The Lambda gets one job per person, and makes **one Bedrock call per batch** (Sonnet 4.6, temperature 0). Reading six
scenes together lets the model see patterns across them without reading everything at once.

**The request is made of:**
- `SCORING_PROMPT`, the same for every call, so it's prompt-cached. It holds:
  - **The 30 facets,** each with a one-sentence definition of its high end; the low end is its opposite. Some have notes
    on when they can be scored and what belongs to a neighbouring facet instead.
  - **Level:** 0.5 is what most adults would do, and the further from 0.5, the stronger the lean.
  - **Weight ceilings by kind of answer:** up to 1 for something done in a live scene or a count over a fixed period, 0.8
    for real-life specifics, 0.6 for a story choice, 0.5 for a bare claim about themselves, 0.3 for a throwaway answer.
  - **What counts as evidence:** only what the person says and does, judged against the other choices; doing what anyone
    would do isn't evidence; choices that cost something count against a trait; a missed chance is evidence of the low end.
  - **The stories and answers are only data,** never instructions.
- **The answers:** each with its index, scene, story, question, facets, whether it's real-life, the answer, the reasoning
  and any clock. An answer whose evidence the person contested also carries what they wrote and what came of it, as
  `person_later_added`. The prompt counts it like their reasoning, but given after they saw their scores, so it never
  outweighs what they actually said and did.

**The model replies through a `record_scores` tool.** For each facet it lists evidence: the answer's index, a sentence on
what shows it, a level from 0 to 1 and a weight from 0 to 1.

**The job then saves:**
- **Each answer's evidence onto the answer,** as `a.scoring`: a JSON list of shifts, `{trait, evidence, level, weight}`.
- **Every facet's score, from all the shifts on all of the person's answers,** replacing the old `HAS_PERSONALITY_TRAIT`
  relationships outright:
  - `value` is the weighted average of the levels in log-odds, so answers that agree land where they agree and answers
    that disagree cancel out.
  - `confidence` is `(1 − e^(−W/3)) × (1 − 2 × spread)`, where W is the total weight and spread is how far the levels
    disagree. It rises with evidence and falls with disagreement.
- A facet with no evidence is left unmeasured.

Finally it removes the `JobRunning` node, whether scoring worked or not, so a failed job never locks a player out.

**Retries and limits:**
- The queue runs at most 5 jobs at once (`maximum_concurrency` in `jobs_lambda.tf`), so a flood of jobs waits rather
  than making many Bedrock calls in parallel. `infrastructure/budget.tf` emails when the month's Claude spend on
  Bedrock nears or is forecast to pass $50.
- Bedrock throttling is retried with backoff up to 32 seconds.
- A response cut off by the token limit fails the job rather than saving partial scores.

## Showing the results
- **My Personality** shows every facet, grouped by domain, against everyone's average.
- Facets with confidence below 0.5 are faded and tagged "Early read".
- Each facet's "Why?" lists the answers behind it and what in them shows the facet, from the evidence on the answers (`GET /api/personality/people/{id}/evidence`).
  Each piece of evidence can be contested (see below).
- **Public profiles:** `GET /api/personality/profiles/{username}` serves a person's scores and report to their profile page.
  Owners of public profiles get share buttons for LinkedIn, X, Reddit and Facebook, the phone's share sheet (the way onto Instagram) and Copy link.
  Shared links point at `/share/{username}`, which CloudFront sends to atlas-api: sites like LinkedIn don't run javascript, so the API serves a page with
  og: and twitter: tags (their first name, their report's headline, and `/og-image.png`), then redirects people to `/u/{username}`. Private profiles get the generic site card.
- **Explore** teaches the Big Five and each facet from reading material in the graph (`GET /api/personality/model`).

## The report
Once a person has finished every scenario and every answer is scored, they get a written report on all their traits.
It sits at the top of My Personality and on their profile.
- **When it's written:**
  - after each scoring job (so after the last batch, any replay, and any full rescore);
  - after each accepted contest.
  - Until the person is fully scored, nothing is written, and an existing report is left alone.
- **What it reads:** each measured trait, with its value, confidence and everyone's average, plus its five strongest pieces of evidence. One Bedrock call (`write_report`) returns:
  - a headline;
  - an overview;
  - a paragraph per domain;
  - strengths and things to watch out for.
- **Privacy:** the report is shown to anyone who can see the profile, so the prompt forbids quoting, retelling or naming scenes, answers or choices. It describes patterns only, with no clinical words.
- **Storage:** JSON on `Person.personalityReport`, written at `Person.personalityReportAt`. Clearing answers removes it.
- **Failures:** a report that fails is logged and the old one is kept. It never fails the scoring or contest job.
- **After a contest:** the contest job rewrites the report after it marks the contest accepted. My Personality keeps polling while an accepted contest is newer than the report.

## Contesting evidence
Each evidence card under "Why?" has a flag button. The person can use it to explain why they answered as they did, or to
say the evidence misread them.

**Sending a contest:** `POST /api/personality/contests`, with the answer's id, the trait, the kind (`explain` or `wrong`)
and what they wrote. The API:
1. Checks that the answer is theirs and has evidence for that trait.
2. Refuses with a 409 if that evidence already has a pending contest, or a scoring job is running. A rescore would
   overwrite whatever the contest changed.
   It refuses with a 429 if the person already has 3 contests waiting for review, or this evidence has been contested 3
   times, so contests can't run up the Bedrock bill. The UI hides the flag on a card that has used its 3.
3. Adds the contest to the answer's `contests` list as `pending`.
4. Queues a `personality_contest` job with every answer in the scene, each with its evidence and earlier contests.

There's no `JobRunning` node, so scenarios stay unlocked while a contest is reviewed.

**Reviewing it:** the job makes one Bedrock call.
- **The system prompt** is the scoring prompt, so the reviewer judges by the same rules and shares its cache, followed
  by a short contest prompt:
  - Judge only the contested evidence.
  - Accept when the answers, read together with the person's note, show something different. Wanting a different score
    isn't a reason.
  - For traits about feelings, like Anger, the person's own account of what they felt is the best evidence.
  - If the answer, read with the note, no longer shows the trait, remove the evidence rather than lowering it.
  - Reply to the person in at most two short sentences.
- **The model replies through a `resolve_contest` tool:** accepted or not, the reply, and either the new evidence
  (sentence, level and weight) or `remove`.

**Saving the result:**
- **Accepted:** the job replaces that one shift on the answer, or sets its weight to 0 when it's removed. It records the
  evidence before and after on the contest, then rescores every facet the same way scoring does.
- **Rejected:** the evidence stays as it is, and the contest gets its reply.
- **The write only lands if the answer's evidence and contests haven't changed since the job read them,** so a scoring
  job that finished in the meantime is never overwritten.
- **A contest that fails, or loses that race, is rejected** with a reply asking them to try again, so it never stays
  pending.

**In the UI:**
- Each card lists its contests under the evidence: what they said, "Reviewing...", "Changed" or "Not changed", the
  reply, and how the evidence moved.
- Removed evidence is struck through and marked "no longer counts".
- If a later rescore finds nothing for the trait in a contested answer, the card stays under the trait, marked "no
  longer counts", so its contest history doesn't disappear.
- While any contest is pending, My Personality refetches every 5 seconds.

**On a later rescore:**
- Scoring rewrites every answer's evidence, but keeps the contests, and the scorer reads the settled ones with each
  answer (`person_later_added`). A fair explanation carries into the new evidence, though the scorer can still reach a
  different result.
- Replaying a scene clears its contests along with its answers.

## API reference
All under `/api/personality`.

| Route | What it does |
|---|---|
| `GET /traits` | Every facet, with its domain and everyone's average |
| `GET /model` | The Big Five, its domains and facets, and how they interact, for Explore |
| `GET /people/{id}/evidence` | Every scored answer and its shifts. Only the signed-in person's own |
| `GET /profiles/{username}` | A person's scores and report. Private profiles are only seen by their owner |
| `PUT /answers` | Saves an answer, and scores its batch when that finishes it |
| `DELETE /answers` | Clears the signed-in person's answers |
| `GET /progress` | The signed-in person's answers, and every scenario's questions |
| `POST /rescore` | Scores every batch for the signed-in person |
| `GET /scoring` | Whether a scoring job for the signed-in person is still running |
| `POST /contests` | Contests one piece of evidence on the signed-in person's answer, and queues its review |

## Testing and accuracy
- **How it's tested:** a persona regression harness, described in `ADRs/personality_testing_harness.md`.
- **Accuracy:** across 13 personas, scores land within about 5 to 6 points of a careful reading of the same answers. This
  is not yet validated against real people. The numbers, and their caveats, are in `ADRs/personality_ipip_scenes.md`.
