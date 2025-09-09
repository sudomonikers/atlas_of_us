###ROUTE 53
# Create the hosted zone
# Use existing domain registration (assuming domain is registered)
resource "aws_route53_zone" "main" {
  name = local.website_name
}

# Create NS records to point to the hosted zone
resource "aws_route53_record" "ns" {
  allow_overwrite = true
  name            = local.website_name
  ttl             = 30
  type            = "NS"
  zone_id         = aws_route53_zone.main.zone_id

  records = aws_route53_zone.main.name_servers
}
# Create SOA record
resource "aws_route53_record" "soa" {
  allow_overwrite = true
  name            = local.website_name
  type            = "SOA"
  ttl             = 30
  zone_id         = aws_route53_zone.main.zone_id

  records = [
    "${aws_route53_zone.main.name_servers[0]}. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
  ]
}

# Create A record for the domain pointing to CloudFront
resource "aws_route53_record" "website_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.website_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Create AAAA record for IPv6
resource "aws_route53_record" "website_aaaa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.website_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Create A record for API subdomain pointing to CloudFront
resource "aws_route53_record" "api_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${local.website_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.api_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.api_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Create AAAA record for API subdomain (IPv6)
resource "aws_route53_record" "api_aaaa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${local.website_name}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.api_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.api_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# Create MX records if needed for email
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.website_name
  type    = "MX"
  ttl     = 300

  records = [
    "0 ." # Null MX record indicating no mail server
  ]
}

### TXT Records for Domain Ownership Verification
resource "aws_route53_record" "txt_apex" {
  name    = "_.${local.website_name}"
  zone_id = aws_route53_zone.main.zone_id
  ttl     = 900
  type    = "TXT"
  records = ["${aws_cloudfront_distribution.cdn.domain_name}_cname.${local.website_name}"]
}

resource "aws_route53_record" "txt_wildcard" {
  name    = "_*.${local.website_name}"
  zone_id = aws_route53_zone.main.zone_id
  ttl     = 900
  type    = "TXT"
  records = [aws_cloudfront_distribution.cdn.domain_name]
}

###S3 BUCKET
resource "aws_s3_bucket" "bucket" {
  bucket        = local.ui_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "bucket" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "hosting" {
  bucket = aws_s3_bucket.bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

###SSL CERT
# Create the certificate
resource "aws_acm_certificate" "cert" {
  provider = aws.us_east_1

  domain_name               = local.website_name
  subject_alternative_names = ["*.${local.website_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Certificate validation records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# SSL certificate for API subdomain (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "api_cert" {
  provider = aws.us_east_1
  
  domain_name       = "api.${local.website_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Certificate validation records for API certificate
resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "api_cert" {
  provider = aws.us_east_1
  
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

###CLOUDFRONT
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for S3 bucket"
}

resource "aws_cloudfront_distribution" "cdn" {
  depends_on          = [aws_acm_certificate_validation.cert]
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for my S3 bucket"
  default_root_object = "index.html"
  aliases             = [local.website_name]

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  origin {
    domain_name = aws_s3_bucket.bucket.bucket_regional_domain_name
    origin_id   = aws_s3_bucket.bucket.id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.bucket.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "bucket" {
  bucket = aws_s3_bucket.bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.bucket.arn}/*"
      }
    ]
  })
}

### API CLOUDFRONT DISTRIBUTION
resource "aws_cloudfront_distribution" "api_cdn" {
  depends_on      = [aws_acm_certificate_validation.api_cert]
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront distribution for Atlas of Us API"
  aliases         = ["api.${local.website_name}"]

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  origin {
    domain_name = aws_instance.api_server.public_dns
    origin_id   = "api-ec2-origin"

    custom_origin_config {
      http_port              = 8000
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "api-ec2-origin"
    viewer_protocol_policy = "allow-all"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }

    # API responses should not be cached heavily
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 300
  }

  # Cache behavior for health checks
  ordered_cache_behavior {
    path_pattern           = "/health"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "api-ec2-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 60
    max_ttl     = 300
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.api_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
}