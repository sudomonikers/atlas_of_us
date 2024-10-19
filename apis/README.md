## Getting Started

### Prerequisites

- Go 1.21+
- Docker
- Docker Compose

### Installation

1. Clone the repository

```bash
git clone https://github.com/sudomonikers/atlas_of_us
```

2. Navigate to the directory

```bash
cd restapi
```

3. Build and run the Docker containers

```bash
make setup && make build && make up
```

### Environment Variables

You can set the environment variables in the `.env` file. Here are some important variables:

- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `GIN_MODE`

### API Documentation

The API is documented using Swagger and can be accessed at:

```
http://localhost:8001/swagger/index.html
```

## Usage

### Authentication

To use authenticated routes, you must include the `Authorization` header with the JWT token.

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" http://localhost:8001/api/v1/books
```
