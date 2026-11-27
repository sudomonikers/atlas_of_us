# The soulmates site, soulmates.atlas-of-us.com (application/ui/atlas-soulmates-ui). It's served like the main site: its
# own bucket behind its own CloudFront, which sends /api/* to the same API lambda, so it uses the same accounts with no
# CORS. The main site's certificate covers it (*.atlas-of-us.com), and its WAF and SPA rewrite are shared.

locals {
  soulmates_name        = "soulmates.${local.website_name}"
  soulmates_bucket_name = "atlas-of-us-soulmates-site"
}

###S3 BUCKET
resource "aws_s3_bucket" "soulmates" {
  bucket        = local.soulmates_bucket_name
  force_destroy = true
}

# only CloudFront reads it, through its origin access identity
resource "aws_s3_bucket_public_access_block" "soulmates" {
  bucket = aws_s3_bucket.soulmates.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_identity" "soulmates" {
  comment = "OAI for the soulmates site bucket"
}

resource "aws_s3_bucket_policy" "soulmates" {
  bucket = aws_s3_bucket.soulmates.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.soulmates.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.soulmates.arn}/*"
      }
    ]
  })
}

###CLOUDFRONT
resource "aws_cloudfront_distribution" "soulmates" {
  depends_on          = [aws_acm_certificate_validation.cert]
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "The soulmates site"
  default_root_object = "index.html"
  http_version        = "http2" # as the main site's, for safari
  aliases             = [local.soulmates_name]
  web_acl_id          = aws_wafv2_web_acl.cdn.arn

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  origin {
    domain_name = aws_s3_bucket.soulmates.bucket_regional_domain_name
    origin_id   = aws_s3_bucket.soulmates.id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.soulmates.cloudfront_access_identity_path
    }
  }

  # the API lambda, signed by the same origin access control as the main site's
  origin {
    domain_name              = split("/", aws_lambda_function_url.api.function_url)[2]
    origin_id                = "api-lambda-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.api.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.soulmates.id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "api-lambda-origin"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
}

# lets this distribution call the API's function URL, as the main site's does (api_lambda.tf)
resource "aws_lambda_permission" "api_url_soulmates" {
  statement_id           = "AllowSoulmatesCloudFrontFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.soulmates.arn
  function_url_auth_type = "AWS_IAM"
}

###DNS
resource "aws_route53_record" "soulmates_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.soulmates_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.soulmates.domain_name
    zone_id                = aws_cloudfront_distribution.soulmates.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "soulmates_aaaa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.soulmates_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.soulmates.domain_name
    zone_id                = aws_cloudfront_distribution.soulmates.hosted_zone_id
    evaluate_target_health = false
  }
}
