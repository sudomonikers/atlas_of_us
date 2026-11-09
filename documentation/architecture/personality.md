# How the Personality Module Works

This explains the personality module end to end: what the player does, what gets stored, and how answers become trait
scores. For why we measure personality through scenes built from the IPIP-NEO rather than a questionnaire, read the
module's README (`application/ui/atlas-of-us-ui/src/personality/README.md`) and `ADRs/personality_ipip_scenes.md`. For
the graph itself, read `../data_model/personality/personality.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/personality/` | The scenes, My Personality and Explore |
| API | `application/apis/atlas-api/src/domains/personality/` | Saves answers, decides when to score, queues scoring and contests, serves scores and evidence |
| Jobs | `application/apis/atlas-jobs/src/jobs/` | Scoring, reviewing contests and writing the report, with Bedrock |
| Skill requirements | `application/apis/atlas-jobs/src/events/skill_filled/` | Links a filled skill's levels to the traits they take |
| Jobs lambda | `application/infrastructure/jobs_lambda.tf` | The function the API hands jobs to |
| Seeds | `application/database/` | The traits, the scenarios and their questions, and the reading material for Explore |

## What we measure
The 30 facets of the Big Five, as defined by the IPIP-NEO. A person's score on each facet has a **value** from 0 to 1,
where 0.5 is typical, and a **confidence** for how much their answers say about it.

## The scenes
There are 18 scenes. Each is written to a set of IPIP-NEO items, five per facet across the game, with each item in
exactly one scene (see `scene_grouping.md` in the personality UI folder).

- **A scene is a script** of narration, dialogue and prompts. A prompt asks for free text, or offers choices and asks
  why, and choices branch the story.
- **Each prompt names the facets** it was written to test. The scorer gets them as a hint, not a limit.
- **Scenes come in three modes:** a **story** with choices, a **live** scene that watches what the player actually does
  in the app, and an **interview** with pinned-down questions about habits and inner states.
- **Some scenes run a real clock,** and each answer records how much time was left.
- **Every scene ends with a real-life question** about the player's own life, the strongest evidence we get.
- **Each scene and its questions are also in the graph,** so answers attach to them and scoring knows the play order.
  How to add a scene is in `CREATE_SCENE.md` in the personality UI folder.

## Answering
Each answer is saved as the player moves past a prompt, with the **context**: everything they saw since the last
prompt on the path they took, and the choices offered. The scorer needs it to know what they were answering.

- **Answering again** overwrites the old answer, and **replaying a scene** clears its old answers first, since a replay
  can take a different branch.
- **An unfinished scene resumes** where the player left off.

## Scoring
Scenes are scored in **batches of six** in play order, when every scene in a batch is finished. Replaying a scene in a
finished batch rescores it, and a person can ask for a full rescore.

1. The API marks the person as being scored, which locks the scenes until it's done, and queues the job.
2. The job makes **one LLM call per batch**, so the model sees patterns across six scenes at once. For each facet it
   lists **evidence**: which answer shows it, why, a level and a weight. Weights are capped by the kind of answer, so a
   real action or real-life detail counts more than a story choice or a bare claim about oneself.
3. The evidence is saved on each answer, and every facet's score is worked out again from all the person's evidence:
   the value is a weighted average, and the confidence rises with evidence and falls with disagreement. A facet with no
   evidence is left unmeasured.
4. The lock is cleared whether scoring worked or not, so a failed job never locks a player out.

**Cost guard:** jobs run a few at a time, and a monthly Bedrock budget cuts the jobs off once it's spent. The UI then
says the budget's gone.

## Showing the results
- **My Personality** shows every facet against everyone's average. Facets with little evidence are marked as an early
  read.
- **"Why?"** on a facet lists the answers behind it and what in them shows it, each of which can be contested.
- **Profiles** show a person's scores and report to whoever may see them, and public profiles can be shared with a
  link that previews well on social sites.
- **Explore** teaches the Big Five and each facet, and names the WHO ICF temperament and personality function that
  matches each, where one does.
- **The body meets personality** through those ICF functions, which the body functions seed links to the domains and
  facets by hand. A condition or impairment the person has noted in one shows on My Personality beside the domain or
  facet it matches, as something that can affect it, apart from the score.

## The report
Once every scene is finished and scored, the person gets a written report: a headline, an overview, a paragraph per
domain, and strengths and things to watch. It's rewritten after each scoring job and each accepted contest.

- **It's in Atlas's voice.**
- **It's private by design.** It's shown to anyone who can see the profile, so it describes patterns only, and never
  quotes or retells the person's answers.
- **A failed report keeps the old one,** and never fails the job that asked for it.

## Contesting evidence
A person can contest any piece of evidence, to explain why they answered as they did or to say it misread them.

- **The API checks it first.** The answer must be theirs, nothing may be scoring, and contests are limited per person
  and per piece of evidence to keep costs down.
- **A contest job reviews it** with the same rules as scoring, plus the person's note. It accepts only when the answers,
  read with the note, show something different, and replies to the person in a sentence or two.
- **An accepted contest** changes or removes that one piece of evidence and rescores. The write only lands if nothing
  changed in the meantime, and a contest that fails is rejected with a reply, so it never stays pending.
- **Contests last.** A later rescore reads the settled contests with each answer, so a fair explanation carries into
  the new evidence. Replaying a scene clears its contests.

## Skill requirements
Every skill level is linked to the personality traits it takes, so a person can see how their personality fits a
skill. A job reacts to `SkillFilled` from the Skills module (see `skills.md` and `events.md`): one LLM call names the
traits that make a real difference at each level, how much and why, and links the levels to them. It does nothing for
a skill that already has them, and a skill stays usable without them.

## Testing and accuracy
- **How it's tested:** a persona regression harness, described in `ADRs/personality_testing_harness.md`.
- **Accuracy:** across 13 personas, scores land within about 5 to 6 points of a careful reading of the same answers. This
  is not yet validated against real people. The numbers, and their caveats, are in `ADRs/personality_ipip_scenes.md`.
