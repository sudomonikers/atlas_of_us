# LLM API

A lightweight completions service using llama.cpp server with the Qwen2.5-0.5B-Instruct model.

## Quick Start

```bash
docker compose up --build
```

The API will be available at `http://localhost:8081`.

## API Usage

### Chat Completions

```bash
curl http://localhost:8081/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### Text Completions

```bash
curl http://localhost:8081/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt": "The capital of France is"}'
```

### Health Check

```bash
curl http://localhost:8081/health
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

Uses [Qwen/Qwen2.5-0.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF) - a small (0.5B parameter) instruction-tuned model quantized to Q8_0 format.
