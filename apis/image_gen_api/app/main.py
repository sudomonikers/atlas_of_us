import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image

from app.config import config
from app.models import EditRequest, GenerateRequest, HealthResponse
from app.services import (
    edit_image,
    generate_image,
    is_edit_model_loaded,
    is_generation_model_loaded,
    preload_models,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting image generation API on {config.host}:{config.port}")
    logger.info(f"Device: {config.device}, dtype: {config.torch_dtype}")
    logger.info(f"Model cache directory: {config.model_cache_dir}")
    logger.info("Preloading models on startup...")
    preload_models()
    logger.info("All models loaded and ready")
    yield
    logger.info("Shutting down image generation API")


app = FastAPI(
    title="Image Generation API",
    description="Image generation and editing API using Qwen models",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthcheck", response_model=HealthResponse)
async def healthcheck():
    return HealthResponse(
        status="healthy",
        generation_model_loaded=is_generation_model_loaded(),
        edit_model_loaded=is_edit_model_loaded(),
    )


@app.post("/generate")
async def generate(request: GenerateRequest):
    try:
        logger.info(f"Generating image for prompt: {request.prompt[:50]}...")
        image_bytes = generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            num_inference_steps=request.num_inference_steps,
            true_cfg_scale=request.true_cfg_scale,
            seed=request.seed,
        )
        logger.info("Image generation complete")
        return Response(content=image_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/edit")
async def edit(
    image: UploadFile = File(..., description="Input image to edit"),
    prompt: str = Form(..., description="Edit instruction prompt"),
    num_inference_steps: int = Form(default=50, ge=1, le=100),
    seed: int | None = Form(default=None),
):
    try:
        # Validate file type
        if image.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid image type. Supported: PNG, JPEG",
            )

        logger.info(f"Editing image with prompt: {prompt[:50]}...")

        # Read and parse image
        image_data = await image.read()
        pil_image = Image.open(image_data if hasattr(image_data, "read") else __import__("io").BytesIO(image_data))

        image_bytes = edit_image(
            image=pil_image,
            prompt=prompt,
            num_inference_steps=num_inference_steps,
            seed=seed,
        )
        logger.info("Image editing complete")
        return Response(content=image_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Edit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=config.host, port=config.port)
