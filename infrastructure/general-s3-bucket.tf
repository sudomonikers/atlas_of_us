resource "aws_s3_bucket" "general_bucket" {
  bucket = local.general_bucket_name

  tags = {
    Name = "General Purpose S3 Bucket"
  }
}

resource "aws_s3_bucket_versioning" "general_bucket_versioning" {
  bucket = aws_s3_bucket.general_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "general_bucket_encryption" {
  bucket = aws_s3_bucket.general_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}