# Embeddings API

A lightweight embeddings service using llama.cpp server with the all-MiniLM-L6-v2 model.

## Quick Start

```bash
docker compose up --build
```

The API will be available at `http://localhost:8080`.

## API Usage

### Generate Embeddings

```bash
curl http://localhost:8080/embedding \
  -H "Content-Type: application/json" \
  -d '{"content": "Your text here"}'
```

### Health Check

```bash
curl http://localhost:8080/health
```

## Deployment

### Prerequisites

- EC2 instance with Docker and Docker Compose installed
- SSH access to the instance

### Deploy to EC2

```bash
EC2_HOST=your-ec2-ip ./deploy-ec2.sh
```

Optional environment variables:
- `EC2_USER` - SSH user (default: `ec2-user`)
- `SSH_KEY` - Path to SSH key (default: `~/.ssh/id_rsa`)

## Model

Uses [sudomoniker/all-MiniLM-L6-v2-Q8_0-GGUF](https://huggingface.co/sudomoniker/all-MiniLM-L6-v2-Q8_0-GGUF) - a quantized version of the all-MiniLM-L6-v2 sentence transformer model.
