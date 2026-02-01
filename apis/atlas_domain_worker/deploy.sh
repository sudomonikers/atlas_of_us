#!/bin/bash

# Deploy script for Atlas Domain Worker Lambda
# This script builds the Rust binary for AWS Lambda and deploys it

set -e

# Configuration
FUNCTION_NAME="domain-node-worker"
AWS_REGION="${AWS_REGION:-us-east-2}"
TARGET="x86_64-unknown-linux-musl"

echo "=== Atlas Domain Worker Lambda Deploy ==="
echo "Function: $FUNCTION_NAME"
echo "Region: $AWS_REGION"
echo "Target: $TARGET"
echo ""

# Check for required tools
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo is not installed"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    echo "Error: zip is not installed"
    exit 1
fi

# Check if cargo-lambda is installed
if ! command -v cargo-lambda &> /dev/null; then
    echo "cargo-lambda is not installed. Installing..."
    brew install cargo-lambda || pip3 install cargo-lambda
fi

# Step 1: Build the binary for Lambda
echo "=== Building for Lambda ($TARGET) ==="

# Use cargo-lambda for cross-compilation to Linux
cargo lambda build --release --target $TARGET

# The binary should be at target/lambda/atlas_domain_worker/bootstrap
BINARY_PATH="target/lambda/atlas_domain_worker/bootstrap"

if [ ! -f "$BINARY_PATH" ]; then
    echo "Error: Binary not found at $BINARY_PATH"
    exit 1
fi

echo "Binary built successfully"

# Step 2: Create the deployment package
echo "=== Creating deployment package ==="

# cargo-lambda already creates the binary as "bootstrap"
mkdir -p deploy
cp "$BINARY_PATH" deploy/bootstrap
chmod +x deploy/bootstrap

# Create the zip file
cd deploy
zip -j function.zip bootstrap
cd ..

PACKAGE_SIZE=$(du -h deploy/function.zip | cut -f1)
echo "Package created: deploy/function.zip ($PACKAGE_SIZE)"

# Step 3: Deploy to Lambda
echo "=== Deploying to Lambda ==="

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://deploy/function.zip \
    --region $AWS_REGION

echo ""
echo "=== Deployment complete ==="

# Wait for the function to be updated
echo "Waiting for function update to complete..."
aws lambda wait function-updated \
    --function-name $FUNCTION_NAME \
    --region $AWS_REGION

# Get function info
echo ""
echo "=== Function Info ==="
aws lambda get-function \
    --function-name $FUNCTION_NAME \
    --region $AWS_REGION \
    --query '{FunctionName: Configuration.FunctionName, Runtime: Configuration.Runtime, MemorySize: Configuration.MemorySize, Timeout: Configuration.Timeout, LastModified: Configuration.LastModified}' \
    --output table

# Cleanup
echo ""
echo "Cleaning up..."
rm -rf deploy

echo ""
echo "Done! Lambda function $FUNCTION_NAME has been updated."
