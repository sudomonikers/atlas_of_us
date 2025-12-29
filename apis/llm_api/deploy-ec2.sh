#!/bin/bash
set -e

# Configuration
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ec2-user}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="/home/${EC2_USER}/embeddings_api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Validate required environment variables
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}Error: EC2_HOST environment variable is required${NC}"
    echo "Usage: EC2_HOST=your-ec2-ip ./deploy-ec2.sh"
    exit 1
fi

echo -e "${YELLOW}Deploying embeddings API to ${EC2_HOST}...${NC}"

# Create remote directory
echo -e "${GREEN}Creating remote directory...${NC}"
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "mkdir -p ${REMOTE_DIR}"

# Copy files to EC2
echo -e "${GREEN}Copying files to EC2...${NC}"
scp -i "$SSH_KEY" \
    Dockerfile \
    docker-compose.yml \
    "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/"

# Build and run on EC2
echo -e "${GREEN}Building and starting container on EC2...${NC}"
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << 'EOF'
cd ~/llm_api

# Stop existing container if running
docker compose down 2>/dev/null || true

# Build and start
docker compose up --build -d

# Show status
echo ""
echo "Container status:"
docker compose ps
EOF

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "LLM API available at: http://${EC2_HOST}:8081"
