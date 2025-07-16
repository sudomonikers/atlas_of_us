# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Infrastructure Commands

### Terraform Operations
```bash
# Initialize Terraform (run first time or when adding new providers)
terraform init

# Plan changes (see what will be created/modified/destroyed)
terraform plan

# Apply changes to infrastructure
terraform apply

# Destroy all infrastructure (use with caution)
terraform destroy

# Format Terraform files
terraform fmt

# Validate configuration
terraform validate

# Show current state
terraform show

# List all resources in state
terraform state list

# Import existing resources
terraform import <resource_type>.<resource_name> <resource_id>
```

### AWS CLI Operations
```bash
# Check current AWS identity
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# Sync files to S3 bucket
aws s3 sync ./dist s3://atlas-of-us-site --delete

# Check CloudFront distribution status
aws cloudfront list-distributions

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"

# Check EC2 instances
aws ec2 describe-instances --filters "Name=tag:Name,Values=atlas-of-us-api-server"

# Start/Stop EC2 instance manually (useful during development)
aws ec2 start-instances --instance-ids <instance-id>
aws ec2 stop-instances --instance-ids <instance-id>

# SSH to EC2 instance
ssh -i api-server-key ec2-user@<instance-ip>

# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ec2-auto-shutdown"
```

## Architecture Overview

### Infrastructure Components

This Terraform configuration deploys a complete web application infrastructure for Atlas of Us on AWS:

**Core Infrastructure:**
- **EC2 Instance**: `t3.micro` instance running the Go API server with Docker (⚠️ **DEVELOPMENT SIZE** - upgrade to `t3.medium` or larger for production)
- **S3 Buckets**: 
  - `atlas-of-us-site`: Static website hosting for React frontend
  - `atlas-of-us-general-bucket`: General purpose storage with versioning and encryption
- **CloudFront CDN**: Two distributions for website and API with SSL termination
- **Route 53**: DNS management for `atlas-of-us.com` domain and API subdomain
- **ACM Certificates**: SSL certificates for main domain and API subdomain

**Security & Access:**
- **IAM Roles**: EC2 instance profile with S3 and CloudWatch permissions
- **Security Groups**: Configured for HTTP/HTTPS, SSH, and API access (port 8080)
- **SSH Key Pair**: For EC2 instance access

**Monitoring & Logging:**
- **CloudWatch**: Log groups for API server logs with 14-day retention
- **Elastic IP**: Static IP address for API server

**Cost Optimization (Development):**
- **Lambda Scheduler**: Automatically shuts down EC2 instance at 12 AM EST daily to save costs
- **Auto-restart**: Docker containers configured with `restart: unless-stopped` policy

### Key Configuration Details

**Domain Setup:**
- Main site: `atlas-of-us.com` → CloudFront → S3 static hosting
- API endpoint: `api.atlas-of-us.com` → CloudFront → EC2 instance (port 8080)

**SSL Configuration:**
- Certificates must be in `us-east-1` region for CloudFront compatibility
- DNS validation used for certificate verification

**API Server Configuration:**
- EC2 instance configured with Docker and Docker Compose
- User data script installs dependencies and sets up deployment directory
- CloudWatch agent installed for monitoring
- Storage: 8GB root volume + 20GB additional volume (⚠️ **DEVELOPMENT SIZE** - increase to 20GB + 100GB for production LLM models)

**Environment Variables (from locals.tf):**
- Database: Neo4j hosted database connection details
- Authentication: JWT secret key configuration
- Application: Gin framework in release mode

## File Structure

```
infrastructure/
├── ec2-server.tf           # EC2 instance, security groups, IAM roles
├── website_hosting.tf      # S3, CloudFront, Route 53, SSL certificates
├── general-s3-bucket.tf    # Additional S3 bucket for general storage
├── lambda-scheduler.tf     # Lambda function for auto-shutdown at 12 AM EST
├── locals.tf              # Configuration variables and secrets
├── version.tf             # Terraform and AWS provider versions
├── api-server-key.pub      # SSH public key for EC2 access
├── terraform.tfstate       # Current infrastructure state
└── terraform.tfstate.backup # Previous state backup
```

## Security Considerations

- SSH access is currently open to `0.0.0.0/0` - should be restricted in production
- Database credentials and JWT secrets are stored in `locals.tf` - should use AWS Secrets Manager
- API server security group allows access from all IPs - consider IP restrictions
- S3 bucket for website has public read access through CloudFront OAI

## Deployment Dependencies

**Related Components:**
- **API Server**: Located in `../apis/aou_api/` - deployed via Docker to EC2
- **Frontend**: Located in `../ui/atlas-of-us-web-ui/` - deployed to S3 bucket
- **Database**: External Neo4j hosted database (connection details in locals.tf)

**Deployment Flow:**
1. Infrastructure provisioned with Terraform
2. API server deployed to EC2 using Docker Compose
3. Frontend built and deployed to S3 bucket
4. CloudFront distributions serve both API and frontend with SSL