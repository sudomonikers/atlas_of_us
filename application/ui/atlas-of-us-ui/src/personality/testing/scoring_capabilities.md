# Personality scoring: where it stands (15 Oct 2026)

A summary of what the personality track can measure today, how well, at what cost, and what we don't yet know. The
detail behind it is in `personality_round_1.md` to `personality_round_5.md` and `results/`.

## The setup
- **15 scenes:** about 115 answers per person, a mix of free text and choices with reasoning.
- **Real-life questions:** each scene has one, about the player's own life (`real_life` in the seed).
- **Facets:** every question records the traits it was written to draw out, and those travel with the answer.
- **Holistic scoring:** one Sonnet 4.6 call (`atlas-jobs`) reads all of a person's answers at once. It scores after the 5th, 10th and 15th finished scene; a replay also rescores once all 15 are done.
- **What each scoring sets:** a value and a confidence for each of the 43 traits, plus up to three answers per trait that show it most clearly. Those answers become the "Why?" on My Personality.
- **What the scorer works from:**
  - the scoring prompt;
  - per-trait criteria: what high and low look like, and which neighbouring trait an answer belongs to instead;
  - the "typical is the baseline" rule;
  - the facets, as evidence of what a person had a chance to show.
- **UI:** traits with confidence below 0.5 are shown faded, with an "Early read" tag.

## How accurate it is
These figures are from the last full regression on Sonnet, against answer-based targets for 10 test personas with very different profiles.

| Measure | Result |
|---|---|
| Average gap between score and target | **7 points** (0.071 on a 0–1 scale) |
| Average gap against independent blind raters | **7 points** (0.066) |
| Scores within 10 points of target | **77%** (333 of 430) |
| Scores more than 25 points off | **2%** (8 of 430) |
| Average bias | +2 points, almost none |
| Traits left unmeasured | none; average confidence 0.79 |

| Where the target is | Average gap | Bias |
|---|---|---|
| Low (below 35) | 7 points | +4 |
| Middle | 9 points | +3 |
| High (above 65) | 6 points | −1 |

**Measured best:** Competitiveness, Dutifulness and Gregariousness (4 points), then Orderliness, Cheerfulness and Anxiety (5).

**Measured worst:** Modesty and Cooperation (14 points), Adaptability (12), Immoderation (10), then Fairness, Decisiveness and Perfectionism (9). The social and moral traits are consistently the hardest, because they show up in subtle trade-offs rather than in what people say about themselves.

**How it got here**

| Stage | Average gap |
|---|---|
| Round 1, averaging per answer | about 12 points, with everything pulled to the middle and a flattering bias |
| Rounds 2–5: accumulating evidence, scoring rules, per-trait criteria | 11–14 points |
| 10-persona baseline, per-scene scoring | 10.7 points |
| Facets | 10.0 points |
| Holistic scoring | **7.1 points** |

The single biggest gain came from reading each person's answers all at once instead of one scene at a time.

**Stability:**
- Re-scoring identical answers moves traits by about 2 points on average.
- A full replay can move a trait that rests on very little evidence by more.

## Cost
- **Each scoring:** about 30k input tokens and 10k output, roughly $0.25 on Sonnet 4.6. The fixed prompt and criteria are cached.
- **A player who finishes all 15 scenes:** 3 scorings, about **$0.75**.
- **A full 10-persona regression:** about $7 and 5–6 minutes.
- **Haiku 4.5 (tested):** about $0.21 per player. It flattens profiles (low traits 12 points high, high traits 7 points low, gap 11 points instead of 7), so we went back to Sonnet.

## What we can and can't claim
**Can claim:**
- **Agreement with a careful reader:** given articulate, honest answers to these scenes, the scorer places someone on 43 traits within about 7 points of a careful reading of the same answers, at both ends of the scales as well as the middle, with each score explained.

**Can't claim yet:**
- **Self-checking:**
  - The personas, the targets, the blind raters and the scorer are all Claude.
  - The 7 points shows the scorer reproduces a model's careful reading of the answers.
  - It doesn't show that the answers or the readings match real people's personalities.
  - Holistic scoring reads the answers the same way the raters did, which flatters the agreement.
- **Real players:**
  - The personas answer every question fully and in character.
  - Real players will be terser, joke around, contradict themselves and skip.
  - Dev's one-liners did fine, but we haven't tested evasive or inconsistent answers.
- **Confidence:** whether it tracks real accuracy isn't validated.
- **Targets:** they don't account for The Soap House answers yet. Some remaining misses (for example Kai's Modesty) come from that.

## Fixed along the way
- **Replay bug:** a replayed scene down a different branch kept the old answers, and they were scored. Answering a scene's first question now clears that scene's old answers first.
- **API deadlocks:** result streams held pooled connections, so ten simultaneous players hung the API. Each query now releases its connection as soon as it's read. The old-answer deletes run in their own small transactions.
- **Request logging:** the API logs every request's start and finish, with debug logs for each scoring step.
- **Clearing a test account:** `DELETE /api/personality/answers` clears the signed-in person's own answers and scores. The harness uses it, so every run starts from scratch.

## Recommended next steps
1. **Validate against real people, which matters most.**
   - 10–20 people play all 15 scenes, and also take the free IPIP-NEO-120 questionnaire, which covers the same 30 Big Five facets.
   - Compare the two sets of scores.
   - Until then, every accuracy figure here is the model checking itself.
2. **Refresh the targets for 15 scenes:** blind raters on the full answer sheets.
3. **A terse or evasive test persona,** to see how the scorer handles thin and contradictory answers.
4. **The social and moral traits:** Modesty, Cooperation, Adaptability.
   - Look at which scenes give real trade-offs for them.
   - Rework the choices that still have one obviously good option.
5. **Production:** the atlas-api deployed earlier already scores every 5 scenes. `DELETE /api/personality/answers` was added after that deploy, so production doesn't have it yet.
