# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Atlas of Us API, a Go-based REST API that provides knowledge graph functionality using Neo4j as the backend database. The API is designed to work with embeddings for semantic search and similarity matching.

## Common Development Commands

### Build and Run
```bash
# Build the application
go build -o main ./src/

# Run with Docker Compose (includes embeddings service)
docker-compose up --build

# Build Docker image only
docker build -t aou_api .
```

### Development
```bash
# Install dependencies
go mod download

# Generate Swagger documentation
swag init

# Run tests (if any exist)
go test ./...

# Format code
go fmt ./...

# Vet code
go vet ./...
```

### Deployment
```bash
# Deploy to EC2
./deploy-ec2.sh

# Check deployment status
ssh -i "${EC2_KEY_PATH:-~/.ssh/api_server_key}" "${EC2_USER:-ec2-user}@$EC2_HOST" 'cd ~/aou_api && docker-compose ps'
```

## Architecture Overview

### Core Components

**Application Structure:**
- `main.go`: Entry point, initializes database, logger, and router
- `router/router.go`: Route definitions and middleware setup
- `models/app_context.go`: Shared application context with database and logger
- `database/neo4j.go`: Neo4j database connection and management
- `auth/auth.go`: Authentication handlers (login, signup, healthcheck)

**Handler Layers:**
- `handlers/graph/`: Knowledge graph operations (CRUD for nodes/relationships)
- `handlers/profile/`: User profile management
- `helpers/`: Utility functions (S3, embeddings, similarity search)

**Middleware:**
- JWT authentication for secure routes
- CORS configuration
- Logging middleware
- Context injection

### Key Architecture Patterns

**Database Access:**
- Uses Neo4j graph database with official Go driver
- Connection pooling with retry logic
- All database operations go through the `AppContext.NEO4J` instance

**API Design:**
- RESTful endpoints under `/api/` base path
- Secure routes under `/api/secure/` requiring JWT authentication
- Swagger documentation available at `/swagger/index.html`

**External Dependencies:**
- Embeddings service (llama-cpp) for semantic search
- S3 for file storage
- JWT for authentication

### Docker Setup

The application runs in a multi-container setup:
- `api`: Main Go application (port 8080)
- `embeddings`: llama-cpp embeddings server (internal port 8080)

Health checks are configured for both services.

### Key Routes

**Public:**
- `GET /api/` - Health check
- `POST /api/login` - User authentication
- `POST /api/sign-up` - User registration

**Secure (requires JWT):**
- `GET /api/secure/graph/get-nodes` - Retrieve graph nodes
- `POST /api/secure/graph/create-node` - Create new nodes
- `POST /api/secure/graph/similar-nodes` - Find similar nodes using embeddings
- `POST /api/secure/helper/embedding` - Generate embeddings

## Development Notes

- Uses Gin framework for HTTP routing
- Zap for structured logging
- Swagger for API documentation generation
- Uses Go modules for dependency management
- Designed for deployment on EC2 with Docker
- Supports both development and production logging configurations
- The deployed code on EC2 gets shutdown every night at 12 ET for cost savings reasons. If it is not hittable you may need to manually restart the EC2 instance.