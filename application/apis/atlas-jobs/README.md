# Atlas Jobs

The Atlas of Us job worker. The api queues slow work on SQS, and this works through the queue one job at a time.
Each message is `{"kind": "...", "job": {...}}` and carries everything the job needs.

| kind | what it does |
|---|---|
| `personality_scoring` | Scores one person's answers to the scenarios in the job, one Bedrock call per scenario with the story they saw before each question, then recombines every trait from all of their scored answers and removes the `JobRunning` node the api put on them, so the ui unlocks the scenarios again. |

## Deploying

On Lambda, the queue invokes the worker with one record at a time. `infrastructure/jobs_lambda.tf` creates the queue and the function. To ship new code, run `./deploy.sh`.
