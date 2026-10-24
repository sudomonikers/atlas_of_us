# Atlas Jobs

The Atlas of Us job worker. The api queues slow work on SQS, and this works through the queue one job at a time.
Each message is `{"kind": "...", "job": {...}}` and carries everything the job needs.

It also works through each module's events queue (`infrastructure/events.tf`). Each of those messages is an event from
the `atlas-events` bus, and its `detail-type` picks the handler in `events.rs`. Handlers publish to the bus named by
`EVENT_BUS_NAME`.

| kind | what it does |
|---|---|
| `personality_scoring` | Scores one person's answers in batches of 6 scenarios, one Bedrock call per batch. It records the evidence for each trait on the answers it came from, then scores every trait from all of the person's evidence and rewrites their report (`personality_report.rs`) once they're fully scored. The api queues it when the person finishes every scenario in a batch, or replays one in a finished batch. Then it removes the `JobRunning` node the api put on them, so the ui unlocks the scenarios again. |
| `personality_contest` | Reviews one piece of evidence the person contested, by explaining their answer or saying the evidence misread it. One Bedrock call reads every answer in that scene, with its evidence and what the person said before, and either changes or removes just that evidence, or rejects the contest. Either way it writes a reply for the person. When the evidence changes, it rescores every trait and rewrites the report. A contest that can't be reviewed is rejected, so it never stays pending. |
| `personality_report` | Rewrites one person's report (`{"person_id": "..."}`) without rescoring them, if they're fully scored. The api never queues it. Send it by hand to write reports for people scored before reports existed. |

## Deploying

On Lambda, each queue invokes the worker with one record at a time. `infrastructure/jobs_lambda.tf` creates the jobs queue and the function, and `infrastructure/events.tf` creates the bus and the events queues. To ship new code, run `./deploy.sh`.
