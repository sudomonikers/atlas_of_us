# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Rust-based REST API server for Atlas of Us, a personal growth application built around a comprehensive knowledge graph. The API provides secure endpoints for user authentication, graph management, profile data, AI-powered domain generation, and helper services with Neo4j integration.

## Quick Start

```bash
# Start the embeddings service (required)
llama-server --hf-repo sudomoniker/all-MiniLM-L6-v2-Q8_0-GGUF --embeddings --port 8080

# Run the API server
cargo run
```

## Architecture

### Core Framework
- **Language**: Rust (edition 2024)
- **Web Framework**: Axum with async/await support
- **Database**: Neo4j graph database via neo4rs driver
- **Authentication**: JWT-based with middleware
- **CORS**: Configurable origins with tower-http

### Directory Structure

```
src/
├── main.rs              # Server initialization (simplified)
├── config/
│   └── mod.rs           # Centralized AppConfig from env vars
├── error/
│   └── mod.rs           # Unified AppError with IntoResponse
├── router/
│   └── mod.rs           # Route registration and middleware
├── domains/
│   ├── auth/            # Authentication (JWT, login, signup)
│   │   ├── handlers.rs
│   │   ├── services.rs
│   │   ├── models.rs
│   │   └── middleware.rs
│   ├── profile/         # User profile management
│   │   ├── handlers.rs
│   │   ├── services.rs
│   │   └── models.rs
│   ├── graph/           # Knowledge graph operations
│   │   ├── handlers.rs
│   │   ├── models.rs
│   │   └── services/    # Split service modules
│   │       ├── mod.rs
│   │       ├── node.rs
│   │       ├── relationship.rs
│   │       ├── search.rs
│   │       └── domain.rs
│   └── agent/           # AI-powered domain generation
│       ├── handlers.rs
│       ├── models.rs
│       ├── orchestrator.rs
│       ├── llm/
│       │   ├── mod.rs
│       │   ├── provider.rs
│       │   └── llama_cpp.rs
│       ├── prompts/
│       │   ├── mod.rs
│       │   └── templates.rs
│       └── steps/
│           ├── mod.rs
│           ├── domain_architect.rs
│           ├── knowledge_generator.rs
│           ├── skill_generator.rs
│           ├── trait_generator.rs
│           ├── milestone_generator.rs
│           ├── level_distributor.rs
│           └── prerequisite_mapper.rs
└── common/              # Shared utilities
    ├── mod.rs
    ├── handlers.rs      # S3 and embedding endpoints
    ├── embedding.rs     # Text embedding generation
    ├── s3.rs            # AWS S3 operations
    ├── image_generation.rs
    ├── neo4j_utils.rs   # Bolt4 to Bolt5 format conversion
    ├── similarity.rs    # Node similarity search
    └── logging_middleware.rs
```

### Domain Responsibilities

| Domain | Purpose | Key Files |
|--------|---------|-----------|
| **auth** | JWT authentication, login, signup | middleware.rs handles JWT validation |
| **profile** | User profile with relationships | Returns user + affiliated nodes |
| **graph** | Knowledge graph CRUD | Split into node/relationship/search/domain |
| **agent** | AI domain generation | 7-step orchestrated pipeline via SSE |

### External Services Integration
- **Embeddings**: llama-cpp server for text embeddings (EMBEDDING_ENDPOINT)
- **LLM**: llama-cpp or compatible for domain generation (LLM_ENDPOINT)
- **Image Generation**: DALL-E 3 for domain avatars (IMAGE_GEN_ENDPOINT)
- **Storage**: AWS S3 for file uploads (S3_BUCKET)
- **Password Security**: Argon2 for hashing

## Common Development Commands

### Local Development
```bash
cargo check              # Check compilation
cargo build              # Build the project
cargo run                # Run in development mode
RUST_LOG=debug cargo run # Run with debug logging
cargo fmt                # Format code
cargo clippy             # Lint code
cargo test               # Run tests
```

### Docker Development
```bash
# Build and run with Docker Compose (includes embeddings service)
docker compose up --build

# Build for Apple Silicon (local development)
docker build -t atlas-of-us-api:latest .

# Build for x86_64 (EC2 deployment)
docker build --platform linux/amd64 -t atlas-of-us-api:latest .
```

### Deployment
```bash
./deploy-ec2.sh  # Deploy to EC2 (requires .env.production)
```

## Configuration

All configuration is via environment variables. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| NEO4J_URI | No | Neo4j connection (default: 127.0.0.1:7687) |
| NEO4J_USER | No | Database user (default: neo4j) |
| NEO4J_PASSWORD | No | Database password (default: neo4j) |
| ALLOWED_ORIGIN | Yes | CORS allowed origin |
| JWT_SECRET | No | JWT signing secret (set in production!) |
| EMBEDDING_ENDPOINT | Yes | Embedding service URL |
| LLM_ENDPOINT | No | LLM service URL (for agent) |
| IMAGE_GEN_ENDPOINT | No | Image generation API URL |
| IMAGE_GEN_API_KEY | No | Image generation API key |
| AWS_REGION | No | AWS region (default: us-east-2) |
| S3_BUCKET | No | S3 bucket name |

## API Endpoints

### Public Routes
- `GET /api/healthcheck` - Health check
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns JWT)

### Protected Routes (require JWT in Authorization header)

**Helper Routes**
- `GET /api/secure/helper/s3-object` - Retrieve S3 object
- `POST /api/secure/helper/s3-upload` - Upload to S3
- `POST /api/secure/helper/embedding` - Generate text embedding

**Graph Routes**
- `GET /api/secure/graph/get-nodes` - Query nodes with relationships
- `GET /api/secure/graph/get-node-with-relationships-by-search-term` - Vector search
- `POST /api/secure/graph/create-node` - Create node with embedding
- `PUT /api/secure/graph/update-node` - Update node properties
- `POST /api/secure/graph/create-relationship` - Create relationship
- `PUT /api/secure/graph/update-relationship` - Update relationship
- `POST /api/secure/graph/delete-relationship` - Delete relationship
- `POST /api/secure/graph/similar-nodes` - Find similar nodes
- `GET /api/secure/graph/search-nodes` - Text search nodes
- `GET /api/secure/graph/domain` - Get domain with levels
- `GET /api/secure/graph/validate-domain-name` - Check if domain exists
- `POST /api/secure/graph/create-domain` - Create domain with levels
- `PUT /api/secure/graph/update-domain` - Update domain

**Profile Routes**
- `GET /api/secure/profile/user-profile/{username}` - Get user profile

**Agent Routes**
- `POST /api/secure/agent/generate-domain` - Generate domain via SSE

## Agent Domain Generation Pipeline

The agent uses a 7-step orchestrated pipeline to generate complete domains:

1. **DomainArchitectStep** - Creates domain structure and avatar
2. **KnowledgeGeneratorStep** - Generates knowledge nodes
3. **SkillGeneratorStep** - Generates skill nodes
4. **TraitGeneratorStep** - Generates trait nodes
5. **MilestoneGeneratorStep** - Generates milestone nodes
6. **LevelDistributorStep** - Distributes concepts across levels
7. **PrerequisiteMapperStep** - Maps prerequisite relationships

### SSE Event Types
- `started` - Generation started
- `agent_started` - Agent step beginning
- `step_progress` - Progress update
- `similarity_check` - Checking for similar nodes
- `verification_result` - LLM verification result
- `node_created` - Node was created
- `agent_completed` - Agent step finished
- `completed` - Full generation complete
- `failed` - Generation failed

### Similarity Thresholds
- **0.95+**: Auto-reuse existing node
- **0.70-0.95**: LLM verification required
- **<0.70**: Create new node

## Key Patterns

### Error Handling
Use the unified `AppError` from `src/error/mod.rs`:
```rust
use crate::error::{AppError, AppResult};

async fn my_handler() -> AppResult<Json<Value>> {
    // Returns proper HTTP status codes automatically
}
```

### Database Connections
Neo4j uses connection pooling (max 10 connections, fetch size 500). The Graph instance is passed as Axum state to all handlers.

### Service Module Pattern
Graph services are split into logical modules:
- `services::node` - Node CRUD operations
- `services::relationship` - Relationship CRUD
- `services::search` - Search and similarity
- `services::domain` - Domain management

All functions are re-exported from `services/mod.rs` for backward compatibility.

### Async Patterns
All handlers are async functions using Tokio runtime. SSE streaming uses `async-stream` crate.

## Important Notes

- **Security**: Never commit secrets. Use .env files
- **Deployment**: EC2 deployment auto-shuts down at 12 AM EST
- **Node Creation**: All nodes get embeddings automatically
- **Similarity Check**: Create operations can check for duplicates
- **Logging**: Use `tracing` crate with structured logging
