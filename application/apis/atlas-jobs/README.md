# Atlas Jobs

The Atlas of Us job worker. The api queues slow work on SQS, and this works through the queue one job at a time.
Each message is `{"kind": "...", "job": {...}}` and carries everything the job needs.

| kind | what it does |
|---|---|
| `personality_scoring` | Scores one person from all of their answers at once: one Bedrock call reads every answer, with the story they saw before each question, and sets every trait along with the answers that show it most clearly. The api queues it each time the person finishes another 5 scenarios. Then it removes the `JobRunning` node the api put on them, so the ui unlocks the scenarios again. |

## Deploying

On Lambda, the queue invokes the worker with one record at a time. `infrastructure/jobs_lambda.tf` creates the queue and the function. To ship new code, run `./deploy.sh`.
