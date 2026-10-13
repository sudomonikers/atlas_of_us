### EMAIL
# SES sends and receives mail for the whole domain (any-address@atlas-of-us.com).
# Inbound: MX -> SES -> raw MIME message stored in the mail bucket under inbound/, plus an SNS
# notification per message so something (a lambda, an email subscription) can react to it.
# Outbound: the domain identity is DKIM signed and uses mail.<domain> as its MAIL FROM, so SPF and
# DKIM both align for DMARC.
# Not doable in terraform:
#   - new accounts are in the SES sandbox (can only send to verified addresses). Request production
#     access in the SES console.
#   - only one receipt rule set can be active per account and region. This one replaces any other.
locals {
  mail_bucket_name       = "atlas-of-us-mail"
  mail_from_domain       = "mail.${local.website_name}"
  mail_inbound_prefix    = "inbound/"
  mail_rule_set_name     = "atlas-of-us-inbound"
  mail_receipt_rule_name = "store-all"
}

###SENDING IDENTITY
resource "aws_sesv2_email_identity" "domain" {
  email_identity = local.website_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# Easy DKIM always issues 3 tokens
resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = aws_route53_zone.main.zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${local.website_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity         = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

# bounces and complaints come back to the MAIL FROM domain
resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${local.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com -all"]
}

###DNS
# replaces the null MX that used to live in website_hosting.tf (same address, so it updates in place)
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.website_name
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.${local.region}.amazonaws.com"]
}

resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.website_name
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com -all"]
}

# reports go to our own inbound, so they land in the mail bucket
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${local.website_name}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=quarantine; rua=mailto:dmarc@${local.website_name}; fo=1"]
}

###INBOUND STORAGE
resource "aws_s3_bucket" "mail" {
  bucket = local.mail_bucket_name

  # holds every received email
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "mail" {
  bucket = aws_s3_bucket.mail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mail" {
  bucket = aws_s3_bucket.mail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "mail" {
  bucket = aws_s3_bucket.mail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPuts"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.mail.arn}/${local.mail_inbound_prefix}*"
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
        ArnLike = {
          "aws:SourceArn" = "arn:aws:ses:${local.region}:${data.aws_caller_identity.current.account_id}:receipt-rule-set/${local.mail_rule_set_name}:receipt-rule/${local.mail_receipt_rule_name}"
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.mail]
}

# one message per received email, with the S3 key of the stored message
resource "aws_sns_topic" "mail_inbound" {
  name = "atlas-of-us-mail-inbound"
}

resource "aws_sns_topic_policy" "mail_inbound" {
  arn = aws_sns_topic.mail_inbound.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.mail_inbound.arn
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
      }
    }]
  })
}

###RECEIVING
resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = local.mail_rule_set_name
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

resource "aws_ses_receipt_rule" "store" {
  name          = local.mail_receipt_rule_name
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  recipients    = [local.website_name] # every address on the domain
  enabled       = true
  scan_enabled  = true # spam/virus verdicts end up in the stored message headers
  tls_policy    = "Optional"

  s3_action {
    position          = 1
    bucket_name       = aws_s3_bucket.mail.id
    object_key_prefix = local.mail_inbound_prefix
    topic_arn         = aws_sns_topic.mail_inbound.arn
  }

  depends_on = [aws_s3_bucket_policy.mail, aws_sns_topic_policy.mail_inbound]
}

###API SEND ACCESS
# lets the API lambda send as any address on the domain
resource "aws_iam_role_policy" "api_email" {
  name = "${local.api_name}-email"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = aws_sesv2_email_identity.domain.arn
    }]
  })
}
