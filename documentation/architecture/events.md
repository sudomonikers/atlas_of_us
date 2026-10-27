# How Events Work

Modules in the Atlas react to each other through events. A module writes a change to its sub-graph, then publishes an
event saying what happened. Any other module that cares has a job that runs when that event arrives. The publisher
knows nothing about who listens, so a new module can start reacting to skills, say, with no change to the Skills
module.

This page covers how events move through the Atlas, and the steps for adding a new event or a new job that reacts to
one. The events each module publishes are listed on that module's page, such as "Events" in `skills.md`.

## The pieces

| Piece | Where | What it is |
|---|---|---|
| The bus | `application/infrastructure/events.tf` | One custom EventBridge bus for the whole Atlas, `atlas-events` |
| The archive | `events.tf` | Keeps every event on the bus forever, so a job added later can replay the history it missed |
| `event_jobs` | `events.tf` | One entry per job that reacts to an event. Each entry gets its own rule, SQS queue and dead-letter queue |
| `publish` | `application/apis/atlas-shared/src/events.rs` | The one function that puts events on the bus, used by both the API and atlas-jobs |
| The worker | `application/apis/atlas-jobs/` | The Lambda every events queue feeds. It picks the handler by the queue the event came from |
| Handlers | `atlas-jobs/src/events/<event>/<module>.rs` | One file per job, such as `skill_filled/personality.rs` |

## How an event moves

```
API or a handler                       EventBridge                     SQS                       atlas-jobs Lambda
writes the graph, then  ──publish──▶  atlas-events  ──rule──▶  SkillFilled-Personality  ──▶  events::handle picks
events::publish(...)                  (+ archive)    ──rule──▶  SkillFilled-Skills       ──▶  the handler by queue
```

1. **The publisher writes the graph first, then publishes.** The graph is the source of truth, and an event is a note
   that it changed. `publish(bus, source, detail_type, schema_version, detail)` adds an `eventId`, the
   `schemaVersion` and `occurredAt` to `detail` and sends it. When `EVENT_BUS_NAME` is unset, as when running locally,
   the event is logged and the call succeeds.
2. **Each job has a rule** on the bus, named `<event>-<module>`, that matches the event's `source` and `detail-type`
   and sends it to that job's queue of the same name. Several jobs can react to one event, and each gets its own copy.
3. **Each queue feeds the atlas-jobs Lambda** one event at a time (`batch_size = 1`), with at most `concurrency`
   events from that queue running at once. A backlog, a replay or a failing handler on one queue leaves every other
   queue to run at its own pace.
4. **`events::handle`** in `atlas-jobs/src/events/mod.rs` reads the queue name and calls the handler for it, passing
   the event's `detail`.
5. **The handler reads the graph** for what it needs, does its work, and may publish events of its own. The fill job,
   for example, reacts to `SkillFillRequested` and publishes `SkillFilled` when it's done.

## The rules an event follows

- **Events are thin.** `detail` names the nodes the change happened to by id (a skill by `skillId`, a level by its
  skill's id and its `rank`) and little else. Consumers read the graph for the rest, so they always see the current
  state.
- **The source is the module:** `atlas.<module>`, such as `atlas.skills`. The `detail-type` is the event's name, a
  noun and a past-tense verb in PascalCase, such as `SkillFilled` or `SkillFillFailed`. A request for work to happen
  is named for the request, such as `SkillFillRequested`.
- **Every event carries a `schemaVersion`.** A change to an event's shape bumps it.
- **A failed publish is the publisher's to handle.** Where the graph would be left waiting on the event, the publisher
  undoes its write: when publishing `SkillFillRequested` fails, the API puts the skill back to the status it had.
  Where the graph is usable without the event, such as `SkillFilled`, the failure is logged.

## The rules a handler follows

- **It is safe to run twice.** SQS can deliver an event more than once, and replays send old events again. A handler
  checks the graph before working (the prerequisites job leaves a skill alone when it already has prerequisites) and
  writes with `MERGE`.
- **It handles its own failures.** `run` returns nothing: it logs what went wrong and, where it matters, writes a
  state to the graph, such as the fill job setting a skill to `failed` and publishing `SkillFillFailed`. The event is
  then done. The queue's redrive (two tries, then the `-failed` dead-letter queue) only catches a handler that times
  out or crashes the Lambda.
- **It is safe alongside copies of itself.** With `concurrency` of 2 or more, two events for the same queue run at
  once. A handler whose writes could clash with another run's makes the clash harmless, as the prerequisites job does
  by writing each link and then checking it made no loop.
- **It logs in a span** named for the job, with the ids it works on, and ends with a `finished` line carrying `ok` and
  `latency_ms`, so every run can be found and timed in CloudWatch.

## Adding a new event

1. **Write the graph change, then publish** with `atlas_shared::events::publish`:
   ```rust
   if let Err(e) = events::publish(bus, "atlas.skills", "SkillLevelClaimed", 1, json!({"skillId": id, "rank": rank})).await {
       tracing::error!(skill_id = id, "{e}");
   }
   ```
   In the API the bus is `state.bus`. In atlas-jobs a handler builds it with `crate::events::bus(&config)`.
2. **Add it to the events table on the module's page,** such as "The events" in `skills.md`: its name, when it's
   published, and who reacts to it.

An event with no job reacting to it still lands in the archive, so a job added later can replay it.

## Adding a job that reacts to an event

1. **Add an entry to `event_jobs`** in `events.tf`:
   ```hcl
   { event = "SkillFilled", source = "atlas.skills", module = "Topics", concurrency = 2 },
   ```
   `module` is the module that reacts, and the entry's key, `SkillFilled-Topics`, names the rule, the queue and its
   dead-letter queue. `concurrency` is how many of its events run at once, and Lambda runs at least 2. Each running
   event is a Bedrock call or two, and every queue's calls share the account's Bedrock limits, so keep it low. The
   Lambda's IAM policy and the queue's policy already cover every queue in `event_jobs`.
2. **Write the handler** at `atlas-jobs/src/events/<event>/<module>.rs`, here `events/skill_filled/topics.rs`, and add
   `pub mod topics;` to `events/skill_filled/mod.rs`. A new event gets a new folder in snake case, such as
   `events/skill_level_claimed/`, with a `mod.rs` that says who publishes it, and `mod skill_level_claimed;` in
   `events/mod.rs`. The handler's shape:
   ```rust
   #[derive(Deserialize)]
   struct Filled {
       #[serde(rename = "skillId")]
       skill_id: String,
   }

   pub async fn run(graph: &Graph, detail: Value) {
       let filled = match serde_json::from_value::<Filled>(detail) {
           Ok(filled) => filled,
           Err(e) => return tracing::error!("unreadable SkillFilled: {e}"),
       };
       let span = tracing::info_span!("skill_topics", skill_id = filled.skill_id);
       async {
           let started = Instant::now();
           let linked: Result<bool, BoxError> = async {
               //read the graph, check there's work to do, do it
           }.await;
           match &linked {
               Ok(true) => {}
               Ok(false) => tracing::info!("the skill isn't ready or is already linked, so it was left as it is"),
               Err(e) => tracing::error!("linking the skill to its topics failed: {e}"),
           }
           tracing::info!(ok = linked.is_ok(), latency_ms = started.elapsed().as_millis() as u64, "finished");
       }.instrument(span).await
   }
   ```
3. **Add the queue to the dispatch** in `events::handle`:
   ```rust
   "SkillFilled-Topics" => skill_filled::topics::run(graph, event.detail).await,
   ```
4. **Document it:** a row in the queue table in `atlas-jobs/README.md`, the job in the module's page, and its queue
   in the "Who cares" column of the event's row.
5. **Deploy:** `terraform apply` in `application/infrastructure` creates the rule and queues, and
   `apis/atlas-jobs/deploy.sh` ships the handler.
6. **Backfill from the archive** when the job should also run on events from before it existed. A replay sent to only
   the new rule leaves every other job alone:
   ```
   aws events start-replay --region us-east-1 --replay-name SkillFilled-Topics-backfill --event-source-arn arn:aws:events:us-east-1:145880140878:archive/atlas-events --event-start-time 2026-10-24T18:00:00Z --event-end-time <now, UTC> --destination '{"Arn":"arn:aws:events:us-east-1:145880140878:event-bus/atlas-events","FilterArns":["arn:aws:events:us-east-1:145880140878:rule/atlas-events/SkillFilled-Topics"]}'
   ```
   `aws events describe-replay --region us-east-1 --replay-name SkillFilled-Topics-backfill` shows how far it's got.
   The events wait in the job's queue and run at its `concurrency`.

## Watching it run

- **Logs:** every handler logs to the `/aws/lambda/atlas-jobs` log group as JSON lines. Search by the span name or a
  `skill_id`, or for `finished` lines with `"ok":false`.
- **Backlogs:** each queue's `ApproximateNumberOfMessagesVisible` is how many of its events are waiting.
- **Dead letters:** an event in `<event>-<module>-failed` timed out or crashed the Lambda twice. It stays there for
  14 days, and once the handler is fixed it can be moved back to its queue with an SQS redrive.
