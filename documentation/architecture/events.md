# How Events Work

Modules in the Atlas react to each other through events. A module writes a change to its sub-graph, then publishes an
event saying what happened. Any other module that cares has a job that runs when that event arrives. The publisher
knows nothing about who listens, so a new module can start reacting to skills, say, with no change to the Skills
module.

This page covers how events move through the Atlas and the rules events and jobs follow. The events each module
publishes are listed on that module's page, such as "Events" in `skills.md` and in `topics.md`.

## The pieces

| Piece | Where | What it is |
|---|---|---|
| The bus | `application/infrastructure/events.tf` | One EventBridge bus for the whole Atlas |
| The archive | `events.tf` | Keeps every event, so a job added later can replay the history it missed |
| Job queues | `events.tf` | One rule, SQS queue and dead-letter queue per job that reacts to an event |
| Publishing | `application/apis/atlas-shared/` | The one way events are put on the bus, shared by the API and the jobs |
| The worker | `application/apis/atlas-jobs/` | The Lambda every job queue feeds. It picks the handler by the queue the event came from |

## How an event moves

```
API or a job                           EventBridge                     SQS                       atlas-jobs Lambda
writes the graph,      ──publish──▶   the bus       ──rule──▶  SkillFilled-Personality  ──▶  the handler for
then publishes                        (+ archive)   ──rule──▶  SkillFilled-Skills       ──▶  that queue
```

1. **The publisher writes the graph first, then publishes.** The graph is the source of truth, and an event is a note
   that it changed.
2. **Each job has its own rule and queue,** named `<event>-<module>`. Several jobs can react to one event, and each
   gets its own copy.
3. **Each queue feeds the worker at its own pace,** with a small limit on how many run at once. A backlog, a replay or
   a failing handler on one queue never holds up another.
4. **The handler reads the graph** for what it needs, does its work, and may publish events of its own.

## The rules an event follows
- **Events are thin.** An event names the nodes the change happened to and little else. Consumers read the graph for
  the rest, so they always see the current state.
- **Naming:** the source is the module (`atlas.<module>`), and the event's name is a noun and a past-tense verb, such
  as `SkillFilled`. A request for work is named for the request, such as `SkillFillRequested`.
- **Every event carries a schema version,** bumped when its shape changes.
- **A failed publish is the publisher's to handle.** Where the graph would be left waiting on the event, the publisher
  undoes its write. Where the graph is usable without it, the failure is logged.

## The rules a handler follows
- **It is safe to run twice.** Events can be delivered more than once, and replays send old events again, so a handler
  checks whether its work is already done and writes idempotently.
- **It handles its own failures.** It logs what went wrong and, where it matters, records a state in the graph, such as
  a skill marked `failed`. The dead-letter queue only catches a handler that times out or crashes.
- **It is safe alongside copies of itself.** When two runs could clash, the handler makes the clash harmless.
- **It logs each run** with the ids it worked on, whether it succeeded and how long it took.

## Adding an event or a job
- **A new event** is published after the graph write and added to the events table on its module's page. With no job
  reacting to it, it still lands in the archive.
- **A new job** is an entry in the job list in `events.tf` (which creates its rule and queues), a handler in atlas-jobs,
  and a line in the module's page and in the event's "Who cares". When it should also run on past events, it's
  backfilled by replaying the archive to its rule alone, which leaves every other job untouched.

## Watching it run
Every handler logs to the atlas-jobs log group. Each queue's backlog shows how far behind a job is, and an event in a
dead-letter queue can be sent back once its handler is fixed.
