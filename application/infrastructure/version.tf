terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28" # aws_lambda_permission.invoked_via_function_url
    }
    archive = {
      source = "hashicorp/archive"
    }
  }
}

provider "aws" {
  region                      = local.region
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_credentials_validation = true
  skip_requesting_account_id  = true
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}
