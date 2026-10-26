#!/bin/sh
# Build the job worker for Lambda and push the code to the function terraform created.
# Needs docker running and AWS credentials.
set -eu
cd "$(dirname "$0")"

# static arm64 binary, built natively in alpine (musl). cargo's target dir lives in a docker volume
# because building through the macOS bind mount fails intermittently. apis/ is mounted, not just this crate, so the
# build can see ../atlas-shared
mkdir -p target/lambda
docker run --rm \
  -v "$PWD/..":/app \
  -v atlas-cargo-registry:/usr/local/cargo/registry \
  -v atlas-lambda-target:/target \
  -e CARGO_PROFILE_RELEASE_STRIP=true \
  -w /app/atlas-jobs \
  rust:alpine \
  sh -c 'apk add -q musl-dev && cargo build --release --target-dir /target && cp /target/release/atlas-jobs /app/atlas-jobs/target/lambda/bootstrap'

(cd target/lambda && rm -f bootstrap.zip && zip -q bootstrap.zip bootstrap)

# a config change (e.g. a terraform apply) may still be rolling out, and code updates are rejected until it's done
aws lambda wait function-updated-v2 --region us-east-1 --function-name atlas-jobs
aws lambda update-function-code \
  --region us-east-1 \
  --function-name atlas-jobs \
  --zip-file fileb://target/lambda/bootstrap.zip \
  --query 'LastUpdateStatus' --output text
aws lambda wait function-updated-v2 --region us-east-1 --function-name atlas-jobs
echo "deployed"
