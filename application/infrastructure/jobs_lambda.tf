### JOBS LAMBDA
# Slow work, like rescoring someone's personality with long bedrock calls, doesn't fit the api's 60 seconds behind
# cloudfront. The api queues it here and apis/atlas-jobs works through the queue, one job at a time.
# Terraform creates the function from a placeholder and then ignores its code.
# Real code ships with apis/atlas-jobs/deploy.sh.
locals {
  jobs_name = "atlas-jobs"
}

resource "aws_sqs_queue" "jobs" {
  name                       = local.jobs_name
  visibility_timeout_seconds = 960 # longer than the function's timeout, so a job is never handed out twice at once
  message_retention_seconds  = 3600

  # a job that times out gets one more try, then is parked for a look
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_failed.arn
    maxReceiveCount     = 2
  })
}

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

  environment {
    variables = merge(
      { for name, param in data.aws_ssm_parameter.api : name => param.value if name != "JWT_SECRET" },
      { BEDROCK_MODEL_ID = "us.anthropic.claude-sonnet-4-6" },
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

resource "aws_lambda_event_source_mapping" "jobs" {
  event_source_arn = aws_sqs_queue.jobs.arn
  function_name    = aws_lambda_function.jobs.arn
  batch_size       = 1

  # at most this many jobs, and so this many bedrock calls, at once. A flood of jobs waits in the queue instead of fanning
  # out, and unlike reserved concurrency nothing is throttled, so no job burns its two tries waiting
  scaling_config {
    maximum_concurrency = 5
  }
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
        # anthropic models are sold through the marketplace, and the first call subscribes the account to them
        Effect   = "Allow"
        Action   = ["aws-marketplace:ViewSubscriptions", "aws-marketplace:Subscribe"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = [aws_sqs_queue.jobs.arn]
      }
    ]
  })
}
