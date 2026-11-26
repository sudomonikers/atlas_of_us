# ADR: Personality scenes have no real-time clocks

**Status:** Accepted, 25 Nov 2026
**Where it lives:** `application/ui/atlas-of-us-ui/src/personality/`, `application/apis/atlas-api/src/domains/personality/mod.rs`,
`application/apis/atlas-jobs/src/jobs/personality_scoring.rs`, `application/database/migrations/028_no_scene_clocks.cypher`

## Context
Four scenes ran a real countdown over part of their script: The Bad Day (4 minutes, from the traffic lights to the
interview room), The Big Party (3 minutes, until the band starts), The Emergency (3 minutes, from the fire to the all
clear) and The Cabin (3 minutes, while waiting for Cal).

- **A script could declare a clock:** its length in seconds, the Section that started it, the Section that stopped it,
  and a "late" Section the player jumped to, from wherever they were, the moment it ran out. Prompts left between the
  two were skipped.
- **The player showed a countdown** at the top of the screen, and the scene's art could follow it: a watch in The Bad
  Day, smoke filling the card in The Emergency, the wall clock's hands in The Cabin. Scenario cards carried a "Timed"
  tag.
- **A run couldn't be resumed part way through a clock,** so it restarted just before the clock started.
- **Each answer given under a clock saved where it stood:** `clockSeconds`, `clockLeft` and `clockRanOut` on
  `ANSWERED`. The scorer got them as a `clock` field on the answer.
- **The persona harness** paused and fast-forwarded the page's clock so each timed answer was given with a scripted
  number of seconds left, and could run a clock out.

## Decision
**Scenes have no real-time clocks.** Every scene plays at the player's own pace, and every prompt on the path they
choose is asked.

<!-- TODO: why the clocks were removed -->

## Consequences
**What it gives us**
- **Every path asks every one of its prompts,** so no evidence is lost to a run-out clock, and a scene is finished only
  by answering its last question.
- **A simpler player:** no deadline, no jump to a late Section, and a run resumes from its first unanswered prompt.
- **A simpler answer:** the API takes and stores only the answer, reasoning, context and facets, and the scorer reads
  only those.
- **A simpler harness:** personas no longer need the page's clock installed, paused or moved on.

**What it costs**
- **Time pressure is no longer something a scene can test.** The four scenes still tell of a deadline in the story,
  but nothing enforces it, and how long a player takes says nothing to the scorer.
- **The run-out endings are gone:** The Bad Day's late arrival, The Big Party's band starting mid-sentence, The
  Emergency's call to 911 and The Cabin's Cal arriving before you've finished, with their art and the siren sound.
- **Old answers lose their clock.** Migration 028 removes `clockSeconds`, `clockLeft` and `clockRanOut` from every
  `ANSWERED`. Answers given on a late Section kept the same question ids, so they stay and are scored as given.
