### EVIDENCE BUCKET
# Files people give as evidence for where they are with a topic, under evidence/<personId>/<evidenceId>.
# The browser uploads and downloads them directly with short-lived urls the API presigns
# (apis/atlas-api/src/domains/topics/engagement.rs), so the bucket stays private.
locals {
  evidence_bucket_name = "atlas-of-us-evidence"
}

resource "aws_s3_bucket" "evidence" {
  bucket = local.evidence_bucket_name

  tags = {
    Name = "Evidence Files"
  }
}

resource "aws_s3_bucket_public_access_block" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# the site, and the ui's dev server, upload with PUT and download with GET
resource "aws_s3_bucket_cors_configuration" "evidence" {
  bucket = aws_s3_bucket.evidence.id

  cors_rule {
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${local.website_name}", "http://localhost:5173"]
    allowed_headers = ["Content-Type"]
    max_age_seconds = 3600
  }
}

###API ACCESS
# the API presigns uploads and downloads, checks an upload arrived (HeadObject needs GetObject) and deletes removed files
resource "aws_iam_role_policy" "api_evidence" {
  name = "${local.api_name}-evidence"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.evidence.arn}/evidence/*"
    }]
  })
}
