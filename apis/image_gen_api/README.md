# Image Generation API

A FastAPI microservice for image generation and editing using Hugging Face Diffusers with Qwen models.

## Models

- **Generation**: [Qwen/Qwen-Image](https://huggingface.co/Qwen/Qwen-Image) with [Lightning LoRA](https://huggingface.co/lightx2v/Qwen-Image-Lightning) for 8-step fast inference
- **Editing**: [Qwen/Qwen-Image-Edit](https://huggingface.co/Qwen/Qwen-Image-Edit) for text-guided image editing

## Requirements

- NVIDIA GPU with CUDA support (tested on g5.xlarge with A10G 24GB)
- Docker with NVIDIA Container Toolkit
- ~20GB disk space for model weights

## Deployment

### EC2 (Recommended)

```bash
EC2_HOST=your-ec2-ip ./deploy-ec2.sh
```

Optional environment variables:
- `EC2_USER` - SSH user (default: `ec2-user`)
- `SSH_KEY` - Path to SSH key (default: `~/.ssh/id_rsa`)

### Local (requires NVIDIA GPU)

```bash
docker compose up --build
```

## API Endpoints

### Health Check

```
GET /healthcheck
```

Returns service status and model loading state.

### Generate Image

```
POST /generate
Content-Type: application/json
```

**Request Body:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| prompt | string | required | Text description of the image |
| negative_prompt | string | " " | What to avoid in the image |
| width | int | 1024 | Image width (256-2048, multiple of 64) |
| height | int | 1024 | Image height (256-2048, multiple of 64) |
| num_inference_steps | int | 8 | Denoising steps (1-100) |
| true_cfg_scale | float | 1.0 | Classifier-free guidance (1.0-20.0) |
| seed | int | null | Random seed for reproducibility |

**Response:** PNG image bytes

**Example:**
```bash
curl -X POST http://localhost:8082/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat astronaut floating in space"}' \
  --output image.png
```

### Edit Image

```
POST /edit
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| image | file | required | Input image (PNG or JPEG) |
| prompt | string | required | Edit instruction |
| num_inference_steps | int | 50 | Denoising steps (1-100) |
| seed | int | null | Random seed for reproducibility |

**Response:** PNG image bytes

**Example:**
```bash
curl -X POST http://localhost:8082/edit \
  -F "image=@input.png" \
  -F "prompt=Make it look like a watercolor painting" \
  --output edited.png
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| MODEL_CACHE_DIR | /app/models | HuggingFace model cache directory |
| DEVICE | cuda | Compute device (cuda/cpu) |
| TORCH_DTYPE | bfloat16 | Tensor dtype (bfloat16/float16/float32) |
| HOST | 0.0.0.0 | Server bind address |
| PORT | 8082 | Server port |
| GENERATION_MODEL | Qwen/Qwen-Image | Base generation model |
| GENERATION_LORA | lightx2v/Qwen-Image-Lightning | LoRA weights for fast inference |
| EDIT_MODEL | Qwen/Qwen-Image-Edit | Image editing model |

## Performance Notes

- First request to each endpoint downloads and loads the model (~5-10 minutes)
- Subsequent generation requests: ~2-5 seconds (8 steps with Lightning LoRA)
- Subsequent edit requests: ~10-20 seconds (50 steps)
- Models are cached in the `./models` volume for persistence across restarts

## Logs

View container logs:
```bash
docker compose logs -f
```
