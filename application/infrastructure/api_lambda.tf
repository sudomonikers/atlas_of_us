### API LAMBDA
# Terraform creates the function from a placeholder and then ignores its code.
# Real code ships with apis/atlas-api/deploy.sh.
# Secrets (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, JWT_SECRET) are SecureString parameters under
# local.api_ssm_path, created outside terraform. Terraform reads them into the function's env vars,
# so they are in state (encrypted in S3, see backend.tf) but never in this repo.
locals {
  api_name     = "atlas-api"
  api_ssm_path = "/atlas-of-us/api"
  api_secrets  = toset(["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD", "JWT_SECRET"])
}

data "aws_ssm_parameter" "api" {
  for_each = local.api_secrets
  name     = "${local.api_ssm_path}/${each.key}"
}

resource "aws_lambda_function" "api" {
  function_name = local.api_name
  role          = aws_iam_role.api.arn
  runtime       = "provided.al2023"
  handler       = "bootstrap"
  architectures = ["arm64"]
  filename      = data.archive_file.api_placeholder.output_path
  memory_size   = 512
  timeout       = 60 # bedrock scoring can be slow. matches the cloudfront origin read timeout

  environment {
    variables = merge(
      { for name, param in data.aws_ssm_parameter.api : name => param.value },
      { BEDROCK_MODEL_ID = "us.anthropic.claude-sonnet-4-6" },
    )
  }

  # code is deployed outside terraform, don't roll it back to the placeholder
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_cloudwatch_log_group.api]
}

data "archive_file" "api_placeholder" {
  type        = "zip"
  output_path = "${path.module}/.build/api_placeholder.zip"

  source {
    filename = "bootstrap"
    content  = "#!/bin/sh\necho 'placeholder, run apis/atlas-api/deploy.sh' >&2\nexit 1\n"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.api_name}"
  retention_in_days = 14
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_cloudfront_origin_access_control" "api" {
  name                              = "${local.api_name}-url"
  description                       = "cloudfront signs its requests to the api function URL"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_lambda_permission" "api_url" {
  statement_id           = "AllowCloudFrontFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.cdn.arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "api_invoke" {
  statement_id             = "AllowCloudFrontInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.api.function_name
  principal                = "cloudfront.amazonaws.com"
  source_arn               = aws_cloudfront_distribution.cdn.arn
  invoked_via_function_url = true
}

###IAM
resource "aws_iam_role" "api" {
  name = "${local.api_name}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_logs" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "api" {
  name = "${local.api_name}-access"
  role = aws_iam_role.api.id

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
      }
    ]
  })
}
