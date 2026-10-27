# Atlas Jobs

The Atlas of Us job worker. The api queues slow work on SQS, and this works through the queue one job at a time.
Each message is `{"kind": "...", "job": {...}}` and carries everything the job needs.

It also works through the events queues (`infrastructure/events.tf`). Each of those messages is an event from the
`atlas-events` bus. Every job that reacts to an event has its own queue, named `<event>-<module>`, and the queue picks
the handler in `src/events/mod.rs`. Handlers publish to the bus named by `EVENT_BUS_NAME`, and log the event when it
isn't set. `documentation/architecture/events.md` walks through adding a new event or a job that reacts to one.

The code is laid out the same way:

| Where | What's in it |
|---|---|
| `src/main.rs` | Takes each record and sends it to `jobs` or `events` by the queue it came from |
| `src/bedrock.rs` | Calls to Claude on Bedrock, shared by everything, with retries and the budget cutoff |
| `src/ideas.rs` | The Idea resolver, which the topic fill runs on the Ideas it names |
| `../atlas-shared/` | Code shared with the api: the event bus, the skills and topics resolvers, and the fast model and embeddings they call |
| `src/jobs/` | The jobs the api queues, one file each, picked by `kind` in `mod.rs` |
| `src/events/` | One folder per event, such as `skill_filled/`, with one file per module that reacts to it, such as `personality.rs` for `SkillFilled-Personality`. `mod.rs` picks the handler by queue and builds the bus |

| queue | what it does |
|---|---|
| `SkillFillRequested-Skills` | Fills a `filling` skill (`events/skill_fill_requested/skills.rs`). One Bedrock call writes its five Dreyfus levels, then the skill is `ready` and `SkillFilled` is published. A fill that fails sets the skill to `failed` and publishes `SkillFillFailed`. A skill that isn't `filling` is left as it is. |
| `SkillFilled-Skills` | Links a filled skill's levels to the levels of the skills they need (`events/skill_filled/skills.rs`). One Bedrock call names each prerequisite, the level of it needed, its `strength` and `reason`, on the lowest level it applies to. The resolver finds each one we have and creates a stub (never filled) for each one we don't, and the job writes them as `REQUIRES_SKILL`, checking after each write and taking it out again if it made a loop. A skill that isn't `ready`, or already has prerequisites, is left as it is. |
| `SkillFilled-Topics` | Links a filled skill's levels to the topics they need knowledge of (`events/skill_filled/topics.rs`). One Bedrock call names each topic, the `bloom` level of it needed, its `strength` and `reason`, on the lowest level it applies to. The topic resolver finds each one we have and creates a stub (never filled) for each one we don't, and the job writes them as `REQUIRES_KNOWLEDGE` from the skill's level to the topic's Bloom level. A skill that isn't `ready`, or already needs topics, is left as it is. |
| `TopicFillRequested-Topics` | Fills a `filling` topic (`events/topic_fill_requested/topics.rs`). One Bedrock call writes its six Bloom levels and names its Ideas with the Ideas each requires. The Idea resolver finds each Idea we already have, then the levels, the Ideas and their `REQUIRES_KNOWLEDGE` links are written, the topic is `ready`, and any link that made a loop is taken out again. It publishes `IdeaCreated` for each new Idea and `TopicFilled`. A fill that fails sets the topic to `failed` and publishes `TopicFillFailed`. A topic that isn't `filling` is left as it is. |
| `SkillFilled-Personality` | Links a filled skill's levels to the personality traits they take (`events/skill_filled/personality.rs`). One Bedrock call names each trait's `level`, `strength` and `reason` on the lowest level it applies to, and the job writes them as `REQUIRES_TRAIT`. A skill that isn't `ready`, or already has trait requirements, is left as it is. |

| kind | what it does |
|---|---|
| `personality_scoring` | Scores one person's answers in batches of 6 scenarios, one Bedrock call per batch. It records the evidence for each trait on the answers it came from, then scores every trait from all of the person's evidence and rewrites their report (`jobs/personality_report.rs`) once they're fully scored. The api queues it when the person finishes every scenario in a batch, or replays one in a finished batch. Then it removes the `JobRunning` node the api put on them, so the ui unlocks the scenarios again. |
| `personality_contest` | Reviews one piece of evidence the person contested, by explaining their answer or saying the evidence misread it. One Bedrock call reads every answer in that scene, with its evidence and what the person said before, and either changes or removes just that evidence, or rejects the contest. Either way it writes a reply for the person. When the evidence changes, it rescores every trait and rewrites the report. A contest that can't be reviewed is rejected, so it never stays pending. |
| `personality_report` | Rewrites one person's report (`{"person_id": "..."}`) without rescoring them, if they're fully scored. The api never queues it. Send it by hand to write reports for people scored before reports existed. |

## Deploying

On Lambda, each queue invokes the worker with one record at a time. `infrastructure/jobs_lambda.tf` creates the jobs queue and the function, and `infrastructure/events.tf` creates the bus and the events queues. To ship new code, run `./deploy.sh`, which builds in docker with `apis/` mounted so it can see `atlas-shared`.
