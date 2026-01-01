#!/bin/bash
set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

# Configuration (env vars can still override .env)
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ec2-user}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="/home/${EC2_USER}/image_gen_api"

# Validate required variables
if [ -z "$EC2_HOST" ]; then
    echo "Error: EC2_HOST is required"
    echo "Set it in .env file or pass as environment variable"
    exit 1
fi

echo "Deploying to ${EC2_USER}@${EC2_HOST}..."

# Create remote directory
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "mkdir -p ${REMOTE_DIR}/app"

# Copy files
scp -i "$SSH_KEY" Dockerfile docker-compose.yml requirements.txt "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/"
scp -i "$SSH_KEY" -r app/* "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/app/"

# Build image and run
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "cd ${REMOTE_DIR} && docker build -t image-gen-api:latest . && docker-compose up -d"

echo "Deployment complete!"
echo "Service should be available at http://${EC2_HOST}:8082"
echo ""
echo "Check status with:"
echo "  ssh -i ${SSH_KEY} ${EC2_USER}@${EC2_HOST} 'cd ${REMOTE_DIR} && docker-compose logs -f'"
