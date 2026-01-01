# =============================================================================
# IMAGE GENERATION API INFRASTRUCTURE
# Self-contained infrastructure for the image generation API service
# Port: 8082, Instance: g5.xlarge (GPU), On-demand startup with scheduled shutdown
# =============================================================================

# -----------------------------------------------------------------------------
# GPU AMI (Deep Learning AMI with NVIDIA drivers)
# -----------------------------------------------------------------------------

data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Amazon Linux 2023)*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# -----------------------------------------------------------------------------
# EC2 INSTANCE
# -----------------------------------------------------------------------------

# Security group for Image Gen API
resource "aws_security_group" "image_gen_api_sg" {
  name_prefix = "image-gen-api-sg"
  description = "Security group for Image Gen API EC2 instance"

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Image Gen API port
  ingress {
    from_port   = 8082
    to_port     = 8082
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "image-gen-api-sg"
  }
}

# IAM role for Image Gen API EC2 instance
resource "aws_iam_role" "image_gen_api_ec2_role" {
  name = "image-gen-api-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Image Gen API EC2 instance
resource "aws_iam_role_policy" "image_gen_api_ec2_policy" {
  name = "image-gen-api-ec2-policy"
  role = aws_iam_role.image_gen_api_ec2_role.id

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
        Resource = "*"
      }
    ]
  })
}

# Instance profile for Image Gen API EC2
resource "aws_iam_instance_profile" "image_gen_api_ec2_profile" {
  name = "image-gen-api-ec2-profile"
  role = aws_iam_role.image_gen_api_ec2_role.name
}

# User data script for Image Gen API (GPU instance with NVIDIA Container Toolkit)
locals {
  image_gen_api_user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e

    # Update system
    yum update -y

    # Install Docker
    yum install -y docker git

    # Start Docker service
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Install NVIDIA Container Toolkit
    curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | \
      tee /etc/yum.repos.d/nvidia-container-toolkit.repo
    yum install -y nvidia-container-toolkit
    nvidia-ctk runtime configure --runtime=docker
    systemctl restart docker

    # Create directory for API deployment
    mkdir -p /home/ec2-user/image_gen_api
    chown ec2-user:ec2-user /home/ec2-user/image_gen_api

    # Create models directory for caching HuggingFace models
    mkdir -p /home/ec2-user/image_gen_api/models
    chown ec2-user:ec2-user /home/ec2-user/image_gen_api/models

    # Install CloudWatch agent for monitoring
    yum install -y amazon-cloudwatch-agent
  EOF
  )
}

# EC2 instance for Image Gen API (GPU)
resource "aws_instance" "image_gen_api" {
  ami                    = data.aws_ami.deep_learning.id
  instance_type          = "g5.xlarge" # GPU instance with A10G 24GB
  key_name               = aws_key_pair.api_server_key.key_name
  vpc_security_group_ids = [aws_security_group.image_gen_api_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.image_gen_api_ec2_profile.name
  user_data              = local.image_gen_api_user_data

  root_block_device {
    volume_type = "gp3"
    volume_size = 200 # Deep Learning AMI ~50GB + Qwen models ~40GB + headroom
    encrypted   = true
  }

  tags = {
    Name = "image-gen-api-server"
  }
}

# Elastic IP for Image Gen API
resource "aws_eip" "image_gen_api_eip" {
  instance = aws_instance.image_gen_api.id
  domain   = "vpc"

  tags = {
    Name = "image-gen-api-eip"
  }
}

# CloudWatch Log Group for Image Gen API
resource "aws_cloudwatch_log_group" "image_gen_api_logs" {
  name              = "/aws/ec2/image-gen-api"
  retention_in_days = 14
}

# -----------------------------------------------------------------------------
# CLOUDFRONT DISTRIBUTION
# -----------------------------------------------------------------------------

# SSL certificate for image-gen subdomain
resource "aws_acm_certificate" "image_gen_api_cert" {
  provider = aws.us_east_1

  domain_name       = "image-gen.${local.website_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Certificate validation records
resource "aws_route53_record" "image_gen_api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.image_gen_api_cert.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "image_gen_api_cert" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.image_gen_api_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.image_gen_api_cert_validation : record.fqdn]
}

# CloudFront distribution for Image Gen API
resource "aws_cloudfront_distribution" "image_gen_api_cdn" {
  depends_on      = [aws_acm_certificate_validation.image_gen_api_cert]
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront distribution for Image Gen API"
  aliases         = ["image-gen.${local.website_name}"]

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  origin {
    domain_name = aws_eip.image_gen_api_eip.public_dns
    origin_id   = "image-gen-api-ec2-origin"

    custom_origin_config {
      http_port              = 8082
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      # Longer timeouts for image generation (can take 20+ seconds)
      origin_read_timeout    = 60
      origin_keepalive_timeout = 60
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "image-gen-api-ec2-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 300
  }

  # Cache behavior for health checks
  ordered_cache_behavior {
    path_pattern           = "/healthcheck"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "image-gen-api-ec2-origin"
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
    acm_certificate_arn      = aws_acm_certificate.image_gen_api_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
}

# -----------------------------------------------------------------------------
# ROUTE 53 DNS
# -----------------------------------------------------------------------------

# A record for image-gen subdomain
resource "aws_route53_record" "image_gen_api_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "image-gen.${local.website_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.image_gen_api_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.image_gen_api_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# AAAA record for image-gen subdomain (IPv6)
resource "aws_route53_record" "image_gen_api_aaaa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "image-gen.${local.website_name}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.image_gen_api_cdn.domain_name
    zone_id                = aws_cloudfront_distribution.image_gen_api_cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# LAMBDA STARTUP (On-Demand)
# -----------------------------------------------------------------------------

# IAM role for startup Lambda
resource "aws_iam_role" "image_gen_api_startup_lambda_role" {
  name = "image-gen-api-startup-lambda-role"

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

# IAM policy for startup Lambda
resource "aws_iam_role_policy" "image_gen_api_startup_lambda_policy" {
  name = "image-gen-api-startup-lambda-policy"
  role = aws_iam_role.image_gen_api_startup_lambda_role.id

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
          "ec2:DescribeInstances",
          "ec2:StartInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function to start EC2 instance
data "archive_file" "image_gen_api_startup_zip" {
  type        = "zip"
  output_path = "image_gen_api_startup.zip"
  source {
    content = <<EOF
import boto3
import os
import json

def handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = os.environ['INSTANCE_ID']

    try:
        response = ec2.describe_instances(InstanceIds=[instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']

        if state == 'stopped':
            ec2.start_instances(InstanceIds=[instance_id])
            print(f"Starting instance {instance_id}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Starting instance {instance_id}')
            }
        elif state == 'running':
            print(f"Instance {instance_id} is already running")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is already running')
            }
        else:
            print(f"Instance {instance_id} is in state: {state}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is in state: {state}')
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error starting instance: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "image_gen_api_startup" {
  filename         = "image_gen_api_startup.zip"
  function_name    = "image-gen-api-startup"
  role             = aws_iam_role.image_gen_api_startup_lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_gen_api_startup_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60

  environment {
    variables = {
      INSTANCE_ID = aws_instance.image_gen_api.id
    }
  }

  tags = {
    Name = "Image Gen API Startup"
  }
}

# SNS topic for CloudWatch alarm
resource "aws_sns_topic" "image_gen_api_alarm_topic" {
  name = "image-gen-api-5xx-alarm"
}

# SNS subscription to trigger Lambda
resource "aws_sns_topic_subscription" "image_gen_api_alarm_subscription" {
  topic_arn = aws_sns_topic.image_gen_api_alarm_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.image_gen_api_startup.arn
}

# Permission for SNS to invoke Lambda
resource "aws_lambda_permission" "image_gen_api_allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_gen_api_startup.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.image_gen_api_alarm_topic.arn
}

# CloudWatch alarm for 5xx errors on CloudFront
resource "aws_cloudwatch_metric_alarm" "image_gen_api_5xx_alarm" {
  alarm_name          = "image-gen-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Triggers when Image Gen API returns 5xx errors (likely instance is down)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.image_gen_api_cdn.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.image_gen_api_alarm_topic.arn]
}

# -----------------------------------------------------------------------------
# LAMBDA SHUTDOWN (Scheduled)
# -----------------------------------------------------------------------------

# IAM role for shutdown Lambda
resource "aws_iam_role" "image_gen_api_shutdown_lambda_role" {
  name = "image-gen-api-shutdown-lambda-role"

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

# IAM policy for shutdown Lambda
resource "aws_iam_role_policy" "image_gen_api_shutdown_lambda_policy" {
  name = "image-gen-api-shutdown-lambda-policy"
  role = aws_iam_role.image_gen_api_shutdown_lambda_role.id

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
          "ec2:DescribeInstances",
          "ec2:StopInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function to stop EC2 instance
data "archive_file" "image_gen_api_shutdown_zip" {
  type        = "zip"
  output_path = "image_gen_api_shutdown.zip"
  source {
    content = <<EOF
import boto3
import os
import json

def handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = os.environ['INSTANCE_ID']

    try:
        response = ec2.describe_instances(InstanceIds=[instance_id])
        state = response['Reservations'][0]['Instances'][0]['State']['Name']

        if state == 'running':
            ec2.stop_instances(InstanceIds=[instance_id])
            print(f"Stopped instance {instance_id}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Successfully stopped instance {instance_id}')
            }
        else:
            print(f"Instance {instance_id} is already {state}")
            return {
                'statusCode': 200,
                'body': json.dumps(f'Instance {instance_id} is already {state}')
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error stopping instance: {str(e)}')
        }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "image_gen_api_shutdown" {
  filename         = "image_gen_api_shutdown.zip"
  function_name    = "image-gen-api-shutdown"
  role             = aws_iam_role.image_gen_api_shutdown_lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_gen_api_shutdown_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60

  environment {
    variables = {
      INSTANCE_ID = aws_instance.image_gen_api.id
    }
  }

  tags = {
    Name = "Image Gen API Shutdown"
  }
}

# CloudWatch Event Rule to trigger Lambda at 12 AM EST daily
resource "aws_cloudwatch_event_rule" "image_gen_api_shutdown_schedule" {
  name                = "image-gen-api-shutdown-12am-est"
  description         = "Trigger Image Gen API shutdown at 12 AM EST daily"
  schedule_expression = "cron(0 5 * * ? *)" # 12:00 AM EST = 5:00 AM UTC
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "image_gen_api_shutdown_target" {
  rule      = aws_cloudwatch_event_rule.image_gen_api_shutdown_schedule.name
  target_id = "TriggerImageGenApiShutdown"
  arn       = aws_lambda_function.image_gen_api_shutdown.arn
}

# Permission for CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "image_gen_api_allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_gen_api_shutdown.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.image_gen_api_shutdown_schedule.arn
}

# -----------------------------------------------------------------------------
# OUTPUTS
# -----------------------------------------------------------------------------

output "image_gen_api_instance_id" {
  value       = aws_instance.image_gen_api.id
  description = "Image Gen API EC2 instance ID"
}

output "image_gen_api_public_ip" {
  value       = aws_eip.image_gen_api_eip.public_ip
  description = "Image Gen API public IP"
}

output "image_gen_api_url" {
  value       = "https://image-gen.${local.website_name}"
  description = "Image Gen API URL"
}
