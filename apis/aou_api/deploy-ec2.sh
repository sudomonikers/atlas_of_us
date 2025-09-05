# EC2 Deployment Script for Atlas of Us API
# This script deploys the dockerized application to an EC2 instance

set -e

# Source .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
fi

# Check if EC2_HOST is set
if [ -z "$EC2_HOST" ]; then
    echo "Error: EC2_HOST environment variable is not set"
    echo "Please set it in .env file or with: export EC2_HOST=your-ec2-ip-address"
    exit 1
fi

# Configuration
EC2_HOST="${EC2_HOST:-}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY_PATH="${EC2_KEY_PATH:-~/.ssh/api_server_key}"
REMOTE_DIR="/home/$EC2_USER/aou_api"

echo "Deploying Atlas of Us API to EC2..."

# Create remote directory
echo "Creating remote directory..."
ssh-keygen -R $EC2_HOST
ssh -i "$EC2_KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "mkdir -p $REMOTE_DIR"

# Copy files to EC2
echo "Copying files to EC2..."
scp -i "$EC2_KEY_PATH" -o StrictHostKeyChecking=no -r \
    ./src \
    ./go.mod \
    ./go.sum \
    ./Dockerfile \
    ./docker-compose.yml \
    "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

# Copy production env file as .env
scp -i "$EC2_KEY_PATH" -o StrictHostKeyChecking=no ./.env.production "$EC2_USER@$EC2_HOST:$REMOTE_DIR/.env"

# Deploy on EC2
echo "Deploying on EC2..."
ssh -i "$EC2_KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << EOF
    cd $REMOTE_DIR
    
    # Stop existing containers
    sudo docker-compose down || true
    
    # Remove old images to free space
    sudo docker system prune -f
    
    # Build and start services
    sudo docker-compose up --build -d --remove-orphans
    
    # Show status
    sudo docker-compose ps
    
    echo "Deployment completed!"
    echo "API will be available at: https://api.atlas-of-us.com (via CloudFront)"
    echo "Direct API access: http://$EC2_HOST:8080"
    echo "Embeddings server: internal only (not exposed)"
EOF

echo "Deployment script completed!"
echo ""
echo "To check logs:"
echo "ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
echo ""
echo "To check service status:"
echo "ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST 'cd $REMOTE_DIR && docker-compose ps'"