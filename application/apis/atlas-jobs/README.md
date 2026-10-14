# Atlas Jobs

The Atlas of Us job worker. The api queues slow work on SQS, and this works through the queue one job at a time.
Each message is `{"kind": "...", "job": {...}}` and carries everything the job needs.

| kind | what it does |
|---|---|
| `personality_scoring` | Rescores every personality trait of one person from all their scenario answers in one Bedrock call, then removes the `JobRunning` node the api put on them, so the ui unlocks the scenarios again. |

## Deploying

On Lambda, the queue invokes the worker with one record at a time. `infrastructure/jobs_lambda.tf` creates the queue and the function. To ship new code, run `./deploy.sh`.
