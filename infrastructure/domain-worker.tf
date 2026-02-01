# =============================================================================
# DOMAIN NODE WORKER INFRASTRUCTURE
# SQS queue + Lambda processor for async node generation
# =============================================================================

# -----------------------------------------------------------------------------
# SQS QUEUES
# -----------------------------------------------------------------------------

# Dead letter queue for failed jobs
resource "aws_sqs_queue" "domain_node_jobs_dlq" {
  name                      = "domain-node-jobs-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "domain-node-jobs-dlq"
  }
}

# Main job queue
resource "aws_sqs_queue" "domain_node_jobs" {
  name                       = "domain-node-jobs"
  visibility_timeout_seconds = 360    # 6 minutes (Lambda timeout + buffer)
  message_retention_seconds  = 86400  # 1 day
  receive_wait_time_seconds  = 20     # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.domain_node_jobs_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "domain-node-jobs"
  }
}

# -----------------------------------------------------------------------------
# LAMBDA IAM ROLE & POLICIES
# -----------------------------------------------------------------------------

resource "aws_iam_role" "domain_worker_role" {
  name = "domain-worker-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "domain_worker_policy" {
  name = "domain-worker-policy"
  role = aws_iam_role.domain_worker_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          aws_sqs_queue.domain_node_jobs.arn,
          aws_sqs_queue.domain_node_jobs_dlq.arn
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# LAMBDA FUNCTION
# -----------------------------------------------------------------------------

# Note: The actual Rust binary will be built and deployed separately.
# This creates a placeholder that will be updated during deployment.
# Lambda function to stop EC2 instance
data "archive_file" "domain_worker_placeholder" {
  type        = "zip"
  output_path = "zip_files/domain_worker_placeholder.zip"
  source {
    content = <<EOF
async fun main() {

}
EOF
    filename = "main.rs"
  }
}

resource "aws_lambda_function" "domain_worker" {
  filename         = data.archive_file.domain_worker_placeholder.output_path
  function_name    = "domain-node-worker"
  role             = aws_iam_role.domain_worker_role.arn
  handler          = "main.main"
  source_code_hash = data.archive_file.domain_worker_placeholder.output_base64sha256
  runtime          = "provided.al2023"
  timeout          = 300 # 5 minutes
  memory_size      = 512

  environment {
    variables = {
      NEO4J_URI          = local.NEO4J_URI
      NEO4J_USER         = local.NEO4J_USER
      NEO4J_PASSWORD     = local.NEO4J_PASSWORD
      EMBEDDING_ENDPOINT = "http://${aws_eip.embeddings_api_eip.public_ip}:8081/embedding"
      LLM_ENDPOINT       = var.llm_endpoint
      QUEUE_URL          = aws_sqs_queue.domain_node_jobs.url
      ANTHROPIC_API_KEY  = var.anthropic_api_key
    }
  }

  tags = {
    Name = "Domain Node Worker"
  }
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "domain_worker_sqs_trigger" {
  event_source_arn                   = aws_sqs_queue.domain_node_jobs.arn
  function_name                      = aws_lambda_function.domain_worker.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0

  # Limit concurrent executions to avoid overwhelming Neo4j
  scaling_config {
    maximum_concurrency = 10
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "domain_worker_logs" {
  name              = "/aws/lambda/domain-node-worker"
  retention_in_days = 14
}

# -----------------------------------------------------------------------------
# VARIABLES
# -----------------------------------------------------------------------------

variable "llm_endpoint" {
  description = "LLM API endpoint URL"
  type        = string
  default     = ""
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude"
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# OUTPUTS
# -----------------------------------------------------------------------------

output "domain_node_queue_url" {
  value       = aws_sqs_queue.domain_node_jobs.url
  description = "Domain node job queue URL"
}

output "domain_node_queue_arn" {
  value       = aws_sqs_queue.domain_node_jobs.arn
  description = "Domain node job queue ARN"
}

output "domain_node_dlq_url" {
  value       = aws_sqs_queue.domain_node_jobs_dlq.url
  description = "Domain node dead letter queue URL"
}
