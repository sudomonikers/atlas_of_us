### EVENTS
# The Atlas event bus. Every module publishes what happened to its sub-graph here (Skills events have the source
# atlas.skills, and Topics events atlas.topics), and every job that reacts to an event has its own rule, named
# <event>-<module>, which invokes the atlas-jobs lambda (jobs_lambda.tf) with the event and the job's name, so the lambda
# picks the handler. See documentation/architecture/events.md.
locals {
  events_name = "atlas-events"

  # one entry per job. `module` is the module that reacts
  event_jobs = { for job in [
    { event = "SkillFillRequested", source = "atlas.skills", module = "Skills" },
    { event = "SkillFilled", source = "atlas.skills", module = "Skills" },
    { event = "SkillFilled", source = "atlas.skills", module = "Personality" },
    { event = "SkillFilled", source = "atlas.skills", module = "Physical" },
    { event = "SkillFilled", source = "atlas.skills", module = "Topics" },
    { event = "TopicFillRequested", source = "atlas.topics", module = "Topics" },
    { event = "ConditionAdded", source = "atlas.physical", module = "Physical" },
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

# the lambda is invoked asynchronously: lambda holds the event until there's room under the function's concurrency, and
# retries and parks failures by the function's invoke config (jobs_lambda.tf)
resource "aws_cloudwatch_event_target" "jobs" {
  for_each       = local.event_jobs
  rule           = aws_cloudwatch_event_rule.jobs[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.atlas.name
  arn            = aws_lambda_function.jobs.arn

  input_transformer {
    input_template = "{\"handler\": \"${each.key}\", \"event\": <aws.events.event.json>}"
  }
}

resource "aws_lambda_permission" "jobs_events" {
  for_each      = local.event_jobs
  statement_id  = "AllowEvents-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jobs.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.jobs[each.key].arn
}
