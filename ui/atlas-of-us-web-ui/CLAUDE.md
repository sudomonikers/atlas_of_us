# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the application (TypeScript compilation + Vite build)
- `npm run preview` - Preview the built application locally
- `npm run lint` - Run ESLint to check code quality
- `npm run deploy` - Build and deploy to AWS S3 (atlas-of-us-site bucket)

### Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL (configured in vite.config.ts as `__API_BASE_URL__`)

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **3D Graphics**: Three.js with React Three Fiber and Drei
- **Routing**: React Router v7
- **State Management**: React Context (GlobalProvider)
- **Authentication**: JWT tokens stored in localStorage
- **Styling**: CSS modules with component-specific stylesheets

### Project Structure
```
src/
├── main.tsx                    # Application entry point with routing
├── GlobalProvider.tsx          # Global state management and JWT auth
├── services/
│   └── http-service.ts         # HTTP client for API calls
├── pages/                      # Page components with routing
│   ├── Graph/                  # 3D graph visualization with Neo4j data
│   ├── Profile/                # User profile (protected route)
│   └── [other pages]/
├── common-components/          # Reusable components
│   └── navbar/                 # Navigation component
└── common/                     # Shared utilities
    ├── enums/                  # TypeScript enums
    ├── interfaces/             # TypeScript interfaces
    └── maps/                   # Data mapping utilities
```

### Key Components

#### Authentication System
- JWT-based authentication with automatic token validation
- `GlobalProvider.tsx` handles login state and token expiration
- `PrivateRoute` component protects authenticated routes
- Tokens stored in localStorage and included in API requests

#### Graph Visualization
- 3D graph using Three.js/React Three Fiber in `pages/Graph/`
- Neo4j data visualization with nodes, relationships, and affiliates
- Constellation component for node positioning and rendering
- Particle system for visual effects

#### HTTP Service
- Centralized API client in `services/http-service.ts`
- Handles Neo4j API responses and S3 object fetching
- Automatic JWT token injection for authenticated requests

### Data Flow
1. Authentication tokens managed through GlobalProvider context
2. API calls made through HttpService with automatic auth headers
3. Neo4j graph data transformed and rendered in 3D space
4. Page routing handled by React Router with protected routes

### Development Notes
- Uses React 19 with new features and patterns
- TypeScript configured with strict mode
- ESLint configured for React hooks and refresh
- Vite handles environment variables and build optimization
- All pages follow consistent component + CSS file pattern

## Project Purpose
The Atlas Of Us is an application for users to grow into better people. 

### In it they get follow a three step guided process:
    1. Find a clear, honest depiction of who they are. This ranges from a variety of topics but aims to encompass all the things that a human can be:
        - knowledge
        - personality
        - jobs
        - hobbies
        - vices
        - health related things (diseases, disabilities, specific things about them they are proud of)
        - different physical traits
        - skills/abilities
        - relationships with other people
        - oraganizations they are apart of
        - special experiences they have had
        - ownership of different things
        - habits
        - goals/aspirations
        - likes/dislikes
        - beliefs
        - ideas
    2. Figure out who they want to be.
        - They will do this by exploring the Knowledge Graph of the Atlas Of Us, which encompasses all the different things a human can be
    3. Figure out the steps to take in order to get from who they are, to who they want to be.
        The Atlas Of Us will suggest steps to take to get from point A to B based on the steps in the graph of how to get there.

### Other than the guided process, users may simply enjoy exploring the graph, or engage in a variety of other services the AOU offers.