### JOBS LAMBDA
# Slow work, like rescoring someone's personality with long bedrock calls, doesn't fit the api's 60 seconds behind
# cloudfront. The api invokes apis/atlas-jobs asynchronously with the job, and each events rule invokes it with an event
# (events.tf). Lambda holds invocations until there's room under the function's concurrency.
# Terraform creates the function from a placeholder and then ignores its code.
# Real code ships with apis/atlas-jobs/deploy.sh.
locals {
  jobs_name = "atlas-jobs"
}

# jobs and events that failed both tries, with what they were invoked with, to send again once fixed
resource "aws_sqs_queue" "jobs_failed" {
  name                      = "${local.jobs_name}-failed"
  message_retention_seconds = 1209600
}

resource "aws_lambda_function" "jobs" {
  function_name = local.jobs_name
  role          = aws_iam_role.jobs.arn
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  architectures = ["arm64"]
  filename      = data.archive_file.jobs_placeholder.output_path
  memory_size   = 512
  timeout       = 900

  # at most this many jobs and events, and so this many bedrock calls, at once. Invocations past it wait in lambda's own
  # queue, for up to the invoke config's maximum event age, without using up their tries
  reserved_concurrent_executions = 10

  environment {
    variables = merge(
      { for name, param in data.aws_ssm_parameter.api : name => param.value if name != "JWT_SECRET" },
      { BEDROCK_MODEL_ID = "us.anthropic.claude-sonnet-4-6", EVENT_BUS_NAME = aws_cloudwatch_event_bus.atlas.name },
    )
  }

  # code is deployed outside terraform, don't roll it back to the placeholder
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_cloudwatch_log_group.jobs]
}

data "archive_file" "jobs_placeholder" {
  type        = "zip"
  output_path = "${path.module}/.build/jobs_placeholder.zip"

  source {
    filename = "bootstrap"
    content  = "#!/bin/sh\necho 'placeholder, run apis/atlas-jobs/deploy.sh' >&2\nexit 1\n"
  }
}

resource "aws_cloudwatch_log_group" "jobs" {
  name              = "/aws/lambda/${local.jobs_name}"
  retention_in_days = 14
}

# a job or event whose run times out or crashes gets one more try, then is parked in the failed queue. Handlers handle
# their own errors, so only those reach here
resource "aws_lambda_function_event_invoke_config" "jobs" {
  function_name                = aws_lambda_function.jobs.function_name
  maximum_retry_attempts       = 1
  maximum_event_age_in_seconds = 21600

  destination_config {
    on_failure {
      destination = aws_sqs_queue.jobs_failed.arn
    }
  }

  # lambda checks the role can send to the failed queue when this is created
  depends_on = [aws_iam_role_policy.jobs]
}

###IAM
resource "aws_iam_role" "jobs" {
  name = "${local.jobs_name}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "jobs_logs" {
  role       = aws_iam_role.jobs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "jobs" {
  name = "${local.jobs_name}-access"
  role = aws_iam_role.jobs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # cross region inference profiles route to the model in any us region
        Effect = "Allow"
        Action = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
        Resource = [
          "arn:aws:bedrock:*:${data.aws_caller_identity.current.account_id}:inference-profile/*",
          "arn:aws:bedrock:*::foundation-model/*",
        ]
      },
      {
        # failed invocations are parked in the failed queue
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = [aws_sqs_queue.jobs_failed.arn]
      },
      {
        # handlers publish what they did, such as a skill being filled (events.tf)
        Effect   = "Allow"
        Action   = ["events:PutEvents"]
        Resource = [aws_cloudwatch_event_bus.atlas.arn]
      }
    ]
  })
}
