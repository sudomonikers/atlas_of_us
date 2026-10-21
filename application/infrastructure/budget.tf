### Bedrock spend alarm
# Emails when the month's Claude spend on bedrock reaches 80% of the limit, and when it's forecast to pass it. Claude is
# billed under its own marketplace service names rather than "Amazon Bedrock", so each model in use is listed: add a new
# model here when it's first used, or its spend goes unwatched
resource "aws_budgets_budget" "bedrock" {
  name         = "bedrock-monthly"
  budget_type  = "COST"
  limit_amount = "50"
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
