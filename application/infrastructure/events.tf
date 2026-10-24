### EVENTS
# The Atlas event bus. Every module publishes what happened to its sub-graph here (Skills events have the source
# atlas.skills), and each module that reacts to events has its own rule and queue, so one module's backlog or failures
# never hold up another's. The queues all feed the atlas-jobs lambda (jobs_lambda.tf), which picks a handler by the
# event's detail-type. See documentation/architecture/skills.md.
locals {
  events_name = "atlas-events"
}

resource "aws_cloudwatch_event_bus" "atlas" {
  name = local.events_name
}

# keeps every event, so a module added later can replay the history it missed (every SkillFilled, say) to backfill
resource "aws_cloudwatch_event_archive" "atlas" {
  name             = local.events_name
  event_source_arn = aws_cloudwatch_event_bus.atlas.arn
  retention_days   = 0 # forever
}

### SKILLS CONSUMER
# the events the Skills module reacts to itself: filling a stub and screening a proposal
resource "aws_cloudwatch_event_rule" "skills" {
  name           = "atlas-skills"
  event_bus_name = aws_cloudwatch_event_bus.atlas.name

  event_pattern = jsonencode({
    source        = ["atlas.skills"]
    "detail-type" = ["SkillFillRequested", "SkillProposalSubmitted"]
  })
}

resource "aws_cloudwatch_event_target" "skills" {
  rule           = aws_cloudwatch_event_rule.skills.name
  event_bus_name = aws_cloudwatch_event_bus.atlas.name
  arn            = aws_sqs_queue.skills_events.arn
}

resource "aws_sqs_queue" "skills_events" {
  name                       = "atlas-skills-events"
  visibility_timeout_seconds = 960   # longer than the function's timeout, so an event is never handed out twice at once
  message_retention_seconds  = 86400 # a flood of fills waits here behind the concurrency limit

  # an event whose handler times out gets one more try, then is parked for a look
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.skills_events_failed.arn
    maxReceiveCount     = 2
  })
}

resource "aws_sqs_queue" "skills_events_failed" {
  name                      = "atlas-skills-events-failed"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue_policy" "skills_events" {
  queue_url = aws_sqs_queue.skills_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.skills_events.arn
      Condition = { ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.skills.arn } }
    }]
  })
}

resource "aws_lambda_event_source_mapping" "skills_events" {
  event_source_arn = aws_sqs_queue.skills_events.arn
  function_name    = aws_lambda_function.jobs.arn
  batch_size       = 1

  # at most this many skills events, and so this many bedrock calls, at once, on top of the jobs queue's own limit
  scaling_config {
    maximum_concurrency = 5
  }
}
