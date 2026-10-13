# state lives in the general bucket (versioned, encrypted, public access blocked). that bucket is
# managed in this config too, so it has prevent_destroy
terraform {
  backend "s3" {
    bucket  = "atlas-of-us-general-bucket"
    key     = "terraform/infrastructure.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}
