### EVENTS
# The Atlas event bus. Every module publishes what happened to its sub-graph here (Skills events have the source
# atlas.skills), and every job that reacts to an event has its own rule and queue, named <event>-<module>, so one job's
# backlog, replay or failures never hold up another's. The queues all feed the atlas-jobs lambda (jobs_lambda.tf), which
# picks the handler by the queue. See documentation/architecture/skills.md.
locals {
  events_name = "atlas-events"

  # one entry per job. `module` is the module that reacts, and `concurrency` is how many of its events, and so its
  # bedrock calls, run at once, on top of every other queue's
  event_jobs = { for job in [
    { event = "SkillFillRequested", source = "atlas.skills", module = "Skills", concurrency = 5 },
    { event = "SkillFilled", source = "atlas.skills", module = "Personality", concurrency = 2 },
  ] : "${job.event}-${job.module}" => job }
}

resource "aws_cloudwatch_event_bus" "atlas" {
  name = local.events_name
}

# keeps every event, so a job added later can replay the history it missed (every SkillFilled, say) to its own rule
resource "aws_cloudwatch_event_archive" "atlas" {
  name             = local.events_name
  event_source_arn = aws_cloudwatch_event_bus.atlas.arn
  retention_days   = 0 # forever
}

### JOBS
resource "aws_cloudwatch_event_rule" "jobs" {
  for_each       = local.event_jobs
  name           = each.key
  event_bus_name = aws_cloudwatch_event_bus.atlas.name

  event_pattern = jsonencode({
    source        = [each.value.source]
    "detail-type" = [each.value.event]
  })
}

resource "aws_cloudwatch_event_target" "jobs" {
  for_each       = local.event_jobs
  rule           = aws_cloudwatch_event_rule.jobs[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.atlas.name
  arn            = aws_sqs_queue.events[each.key].arn
}

resource "aws_sqs_queue" "events" {
  for_each                   = local.event_jobs
  name                       = each.key
  visibility_timeout_seconds = 960   # longer than the function's timeout, so an event is never handed out twice at once
  message_retention_seconds  = 86400 # a flood of events, or a replay from the archive, waits here behind the concurrency limit

  # an event whose handler times out gets one more try, then is parked for a look
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.events_failed[each.key].arn
    maxReceiveCount     = 2
  })
}

resource "aws_sqs_queue" "events_failed" {
  for_each                  = local.event_jobs
  name                      = "${each.key}-failed"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue_policy" "events" {
  for_each  = local.event_jobs
  queue_url = aws_sqs_queue.events[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.events[each.key].arn
      Condition = { ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.jobs[each.key].arn } }
    }]
  })
}

resource "aws_lambda_event_source_mapping" "events" {
  for_each         = local.event_jobs
  event_source_arn = aws_sqs_queue.events[each.key].arn
  function_name    = aws_lambda_function.jobs.arn
  batch_size       = 1

  scaling_config {
    maximum_concurrency = each.value.concurrency
  }
}
