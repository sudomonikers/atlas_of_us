### WAF
# In front of the cloudfront distribution (cloudfront web ACLs have to live in us-east-1).
# AWS's managed lists drop known bad IPs and exploit payloads everywhere; the rate limits are per IP over
# 5 minutes and only look at /api, so the static site is never limited. Blocked requests get a 429 whose
# plain text body the ui shows as is, like the api's own 4xx messages
locals {
  waf_window_seconds = 300
}

resource "aws_wafv2_web_acl" "cdn" {
  provider = aws.us_east_1
  name     = "atlas-of-us-cdn"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  custom_response_body {
    key          = "rate_limited"
    content      = "You're doing that too often. Wait a few minutes and try again."
    content_type = "TEXT_PLAIN"
  }

  rule {
    name     = "aws-ip-reputation"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesAmazonIpReputationList"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "aws-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-known-bad-inputs"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "aws-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # password guessing and scripted sign ups
  rule {
    name     = "rate-limit-auth"
    priority = 2

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limited"
        }
      }
    }

    statement {
      rate_based_statement {
        limit                 = 20
        evaluation_window_sec = local.waf_window_seconds
        aggregate_key_type    = "IP"

        scope_down_statement {
          or_statement {
            statement {
              byte_match_statement {
                search_string         = "/api/auth/login"
                positional_constraint = "EXACTLY"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
            statement {
              byte_match_statement {
                search_string         = "/api/auth/create-user"
                positional_constraint = "EXACTLY"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit-auth"
      sampled_requests_enabled   = true
    }
  }

  # each rescore is a full bedrock call
  rule {
    name     = "rate-limit-rescore"
    priority = 3

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limited"
        }
      }
    }

    statement {
      rate_based_statement {
        limit                 = 10
        evaluation_window_sec = local.waf_window_seconds
        aggregate_key_type    = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string         = "/api/personality/rescore"
            positional_constraint = "EXACTLY"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit-rescore"
      sampled_requests_enabled   = true
    }
  }

  # everything else on the api. Generous: the ui polls the scoring job every 3 seconds (100 per window)
  rule {
    name     = "rate-limit-api"
    priority = 4

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limited"
        }
      }
    }

    statement {
      rate_based_statement {
        limit                 = 1000
        evaluation_window_sec = local.waf_window_seconds
        aggregate_key_type    = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string         = "/api/"
            positional_constraint = "STARTS_WITH"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit-api"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "atlas-of-us-cdn"
    sampled_requests_enabled   = true
  }
}
