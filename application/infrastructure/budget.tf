### Bedrock spend alarm and cutoff
# Emails when the month's Claude spend on bedrock reaches 80% of the limit, and when it's forecast to pass it, and cuts
# atlas-jobs off from bedrock once it's actually past it (bedrock_cutoff below). Claude is
# billed under its own marketplace service names rather than "Amazon Bedrock", so each model in use is listed: add a new
# model here when it's first used, or its spend goes unwatched
resource "aws_budgets_budget" "bedrock" {
  name         = "bedrock-monthly"
  budget_type  = "COST"
  limit_amount = "100"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Bedrock",
      "Claude Sonnet 4.6 (Amazon Bedrock Edition)",
      "Claude Haiku 4.5 (Amazon Bedrock Edition)",
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["sudomonikers@gmail.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["sudomonikers@gmail.com"]
  }
}

# Once actual spend passes the limit, Budgets attaches this deny to the jobs role, the only thing that calls bedrock.
# Billing data lags by up to a day, so spend can overshoot a little before it lands. It stays attached until reversed
# from the Budgets console (or the policy is detached from the role)
resource "aws_iam_policy" "bedrock_cutoff" {
  name = "bedrock-cutoff"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Deny"
      Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
      Resource = "*"
    }]
  })
}

# what Budgets acts as: allowed to attach and detach the cutoff on the jobs role, and nothing else
resource "aws_iam_role" "budget_action" {
  name = "bedrock-budget-action"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "budgets.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "budget_action" {
  name = "bedrock-budget-action"
  role = aws_iam_role.budget_action.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = ["iam:AttachRolePolicy", "iam:DetachRolePolicy"]
      Resource  = aws_iam_role.jobs.arn
      Condition = { ArnEquals = { "iam:PolicyARN" = aws_iam_policy.bedrock_cutoff.arn } }
    }]
  })
}

resource "aws_budgets_budget_action" "bedrock_cutoff" {
  budget_name        = aws_budgets_budget.bedrock.name
  action_type        = "APPLY_IAM_POLICY"
  approval_model     = "AUTOMATIC"
  notification_type  = "ACTUAL"
  execution_role_arn = aws_iam_role.budget_action.arn

  action_threshold {
    action_threshold_type  = "PERCENTAGE"
    action_threshold_value = 100
  }

  definition {
    iam_action_definition {
      policy_arn = aws_iam_policy.bedrock_cutoff.arn
      roles      = [aws_iam_role.jobs.name]
    }
  }

  subscriber {
    address           = "sudomonikers@gmail.com"
    subscription_type = "EMAIL"
  }
}
