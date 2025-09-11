# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Rust-based REST API server for Atlas of Us, a personal growth application built around a comprehensive knowledge graph. The API provides secure endpoints for user authentication, graph management, profile data, and helper services with Neo4j integration.

## Architecture

### Core Framework
- **Language**: Rust (edition 2024)
- **Web Framework**: Axum with async/await support
- **Database**: Neo4j graph database via neo4rs driver
- **Authentication**: JWT-based with middleware
- **CORS**: Configurable origins with tower-http
- **Logging**: Structured logging with tracing crate

### External Services Integration
- **Embeddings**: llama-cpp server for text embeddings
- **Storage**: AWS S3 for file uploads and retrieval
- **Password Security**: Argon2 for hashing

### Deployment Architecture
- **Containerization**: Multi-stage Docker build with Alpine Linux
- **Orchestration**: Docker Compose with embeddings service
- **Target Platform**: x86_64 Linux (EC2 deployment)
- **Health Checks**: Built-in endpoints for both API and embeddings

## Common Development Commands

### Local Development
```bash
# Check code compilation without building
cargo check

# Build the project
cargo build

# Run in development mode
cargo run

# Run with specific log level
RUST_LOG=debug cargo run

# Format code
cargo fmt

# Lint code
cargo clippy

# Run tests (if any exist)
cargo test
```

### Docker Development
```bash
# Build and run with Docker Compose (includes embeddings service)
# On Apple Silicon Macs for local development
docker-compose up --build

# Build for Apple Silicon (local development)
docker build -t atlas-of-us-api:latest .
docker run --env-file .env -p 8000:8000 atlas-of-us-api:latest

# Build for x86_64 (deployment target)
docker build --platform linux/amd64 -t atlas-of-us-api:latest .

# Check container logs
docker-compose logs -f api
```

### Deployment
```bash
# Deploy to EC2 (requires .env.production and EC2 configuration)
./deploy-ec2.sh
```

## Code Architecture

### Domain-Driven Structure
```
src/
├── main.rs                 # Server initialization and routing
├── domains/               # Business logic domains
│   ├── auth/              # Authentication (JWT, signup, login)
│   ├── profile/           # User profile management
│   └── graph/             # Knowledge graph operations
└── common/                # Shared utilities
    ├── handlers.rs        # Helper route handlers
    ├── embedding.rs       # Text embedding generation
    ├── s3.rs             # AWS S3 operations
    ├── neo4j_utils.rs    # Database utilities
    ├── similarity.rs     # Node similarity calculations
    ├── image_generation.rs # Image processing
    └── logging_middleware.rs # Request logging
```

### Database Connections
Neo4j connections use connection pooling (max 10 connections, fetch size 500). The Graph instance is passed as Axum state to all handlers.

### Authentication Flow
JWT middleware validates tokens on `/api/secure/*` routes. Tokens are generated on successful login and must be included in Authorization headers.

### Error Handling
Use Axum's built-in error handling with appropriate HTTP status codes. Log errors with the tracing crate for debugging.

### Async Patterns
All handlers are async functions. Use `tokio::main` for the server runtime and leverage async/await throughout.

### Docker Multi-Stage Build
The Dockerfile uses a builder pattern to cache dependencies separately from source code, optimizing build times during development. Note: local development on Apple Silicon Macs uses native ARM64 builds, while deployment targets x86_64 EC2 instances.

## Important Notes

- **Security**: Never commit secrets to Git. Use environment files (.env, .env.production)
- **Deployment**: EC2 deployment script handles cross-compilation for x86_64 architecture
- **Dependencies**: Heavy use of async ecosystem (tokio, axum, neo4rs)
- **Embeddings**: Internal service communication via Docker network
- **Health Checks**: Both API and embeddings service have health endpoints for monitoring
- **CORS**: Strictly configured for specific allowed origins
- **Logging**: Structured logging with configurable levels via RUST_LOG environment variable