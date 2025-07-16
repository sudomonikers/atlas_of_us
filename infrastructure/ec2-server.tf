# Data source for latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for EC2 instance
resource "aws_security_group" "api_server_sg" {
  name_prefix = "api-server-sg"
  description = "Security group for API server EC2 instance"

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

  # SSH access (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Custom API port (if your Go API runs on a different port)
  ingress {
    from_port   = 8080
    to_port     = 8080
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
    Name = "api-server-sg"
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "ec2_api_role" {
  name = "ec2-api-role"

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

# IAM policy for EC2 instance (CloudWatch logs, S3 access if needed)
resource "aws_iam_role_policy" "ec2_api_policy" {
  name = "ec2-api-policy"
  role = aws_iam_role.ec2_api_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_api_profile" {
  name = "ec2-api-profile"
  role = aws_iam_role.ec2_api_role.name
}

# Key pair for SSH access (you'll need to create this manually or import existing)
resource "aws_key_pair" "api_server_key" {
  key_name   = "api-server-key"
  public_key = file("${path.module}/api-server-key.pub") # Place your public key in this file
}

# User data script to set up the server
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker git

    # Start Docker service
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Create directory for API deployment
    mkdir -p /home/ec2-user/aou_api
    chown ec2-user:ec2-user /home/ec2-user/aou_api

    # Install CloudWatch agent for monitoring
    yum install -y amazon-cloudwatch-agent
  EOF
  )
}

# EC2 instance
resource "aws_instance" "api_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro" # Development instance - much cheaper
  key_name               = aws_key_pair.api_server_key.key_name
  vpc_security_group_ids = [aws_security_group.api_server_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_api_profile.name
  user_data              = local.user_data

  # Root volume configuration - reduced for development
  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }


  tags = {
    Name = "atlas-of-us-api-server"
  }
}

# Elastic IP for static IP address
resource "aws_eip" "api_server_eip" {
  instance = aws_instance.api_server.id
  domain   = "vpc"

  tags = {
    Name = "atlas-of-us-api-eip"
  }
}

# CloudWatch Log Group for API logs
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/ec2/atlas-of-us-api"
  retention_in_days = 14
}

# Output the instance details
output "ec2_instance_id" {
  value = aws_instance.api_server.id
}

output "ec2_public_ip" {
  value = aws_eip.api_server_eip.public_ip
}
