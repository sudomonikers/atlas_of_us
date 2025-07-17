# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atlas of Us is a personal growth application built around a comprehensive knowledge graph. The system helps users through a three-step process: understanding who they are, exploring who they want to become, and finding paths to get there. The application uses Neo4j as the core graph database to represent all aspects of human experience - from skills and knowledge to personality traits and life pursuits.

## Project Structure

This is a multi-component system with distinct layers:

### Core Components
- **APIs** (`apis/aou_api/`): Go-based REST API server with Neo4j integration
- **UI** (`ui/atlas-of-us-web-ui/`): React/TypeScript frontend with 3D graph visualization
- **Infrastructure** (`infrastructure/`): Terraform configuration for AWS deployment
- **Database** (`database/`): Neo4j graph database schema and migration files
- **Batch Jobs** (`batch_jobs/`): Data processing scripts for populating the knowledge graph

### Database Architecture

The knowledge graph uses a flexible three-layer architecture:
- **Layer 1**: Core domain structures (Health, Skills, Knowledge, Personality, Pursuits)
- **Layer 2**: User-specific data and relationships
- **Layer 3**: Individual user profiles and assessments

All nodes are unique on the 'name' property. When updating nodes, always use `MERGE` with name-based queries and `SET` for additional properties to avoid duplicates.

## Common Development Commands

### Frontend Development (UI)
```bash
cd ui/atlas-of-us-web-ui/
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run deploy       # Build and deploy to S3
```

### Backend Development (API)
```bash
cd apis/aou_api/
go build -o main ./src/               # Build the application
docker-compose up --build             # Run with embeddings service
go fmt ./...                          # Format code
go vet ./...                         # Vet code
./deploy-ec2.sh                      # Deploy to EC2
```

### Infrastructure Management
```bash
cd infrastructure/
terraform init       # Initialize Terraform
terraform plan       # Plan infrastructure changes
terraform apply      # Apply changes
terraform destroy    # Destroy infrastructure (use with caution)
```

### Database Operations
```bash
cd database/helper_scripts/
go run recreate_db.go    # Recreate database from schema files
```

## Architecture Details

### API Server (Go)
- **Framework**: Gin with middleware for JWT auth, CORS, and logging
- **Database**: Neo4j with connection pooling and retry logic
- **External Services**: llama-cpp embeddings service, S3 storage
- **Security**: JWT-based authentication for secure routes
- **Documentation**: Swagger docs at `/swagger/index.html`
- **Deployment**: Docker containers on EC2 (shuts down at 12 AM EST for cost savings)

### Frontend (React/TypeScript)
- **Framework**: React 19 with TypeScript and Vite
- **3D Graphics**: Three.js with React Three Fiber for graph visualization
- **State Management**: React Context with JWT authentication
- **Routing**: React Router v7 with protected routes
- **Styling**: Component-scoped CSS files with comprehensive design system
- **Design System**: Ethereal space theme with glass-morphism effects (`ui/atlas-of-us-web-ui/src/styles/STYLE_GUIDE.md`)

### Database Schema
- **Type**: Neo4j graph database with domain-specific node types
- **Pattern**: Nodes unique by 'name', domain-specific properties suffixed by domain
- **Relationships**: Flexible graph structure supporting multiple parent-child relationships
- **Updates**: Version-controlled through repository, deployed on merge

### Infrastructure (AWS)
- **Compute**: EC2 t3.micro (development size - upgrade for production)
- **Storage**: S3 for static hosting and general storage
- **CDN**: CloudFront for both frontend and API
- **DNS**: Route 53 with SSL certificates
- **Cost Optimization**: Lambda scheduler for nightly EC2 shutdown

## Key Development Patterns

### Database Updates
Always use MERGE with name-based queries to avoid duplicate nodes:
```cypher
MERGE (n:l1Domain { name: 'NodeName'})
SET n.description = 'example'
```

### API Authentication
Secure routes require JWT tokens. Use the `/api/secure/` prefix for protected endpoints.

### Frontend Component Structure
Follow the established pattern: component file + CSS file in same directory.

### Design System Usage
- **Style Guide**: Complete documentation at `ui/atlas-of-us-web-ui/src/styles/STYLE_GUIDE.md`
- **Design Tokens**: CSS variables defined in `ui/atlas-of-us-web-ui/src/styles/design-tokens.css`
- **Components**: Reusable UI components in `ui/atlas-of-us-web-ui/src/styles/components.css`
- **Theme**: Ethereal space aesthetic with glass-morphism, cosmic colors, and subtle animations
- **Typography**: Mochiy Pop One (headings) + Inter (body text)
- **Colors**: Descriptive cosmic names (violet-deep, nebula-blue, star-green, etc.)
- **Buttons**: Use `.btn-cosmic` (primary) and `.btn-glass` (secondary) classes
- **Cards**: Use `.card-cosmic` with optional `.interactive-particle` for hover effects

### 3D Graph Visualization
The Graph page renders Neo4j data in 3D space using Three.js. Node positioning and relationships are dynamically calculated.

## Important Notes

- **Security**: Never commit secrets. Database credentials are in infrastructure/locals.tf
- **Deployment**: API server has auto-shutdown at 12 AM EST for cost savings
- **Database**: Changes only applied to production on merge to main branch
- **Testing**: No formal test suite currently implemented
- **Monitoring**: CloudWatch logs with 14-day retention