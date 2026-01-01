import gc
import io
import logging
import math
from typing import Optional

import torch
from diffusers import (
    DiffusionPipeline,
    FlowMatchEulerDiscreteScheduler,
    QwenImageEditPipeline,
)
from PIL import Image

from app.config import config

logger = logging.getLogger(__name__)

# Global pipeline instances (lazy loaded, only one active at a time due to GPU memory)
_generation_pipe: Optional[DiffusionPipeline] = None
_edit_pipe: Optional[QwenImageEditPipeline] = None


def _unload_generation_pipeline():
    """Unload generation pipeline to free GPU memory."""
    global _generation_pipe
    if _generation_pipe is not None:
        logger.info("Unloading generation pipeline to free GPU memory...")
        del _generation_pipe
        _generation_pipe = None
        gc.collect()
        torch.cuda.empty_cache()


def _unload_edit_pipeline():
    """Unload edit pipeline to free GPU memory."""
    global _edit_pipe
    if _edit_pipe is not None:
        logger.info("Unloading edit pipeline to free GPU memory...")
        del _edit_pipe
        _edit_pipe = None
        gc.collect()
        torch.cuda.empty_cache()


def get_torch_dtype():
    dtype_map = {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }
    return dtype_map.get(config.torch_dtype, torch.bfloat16)


def get_generation_pipeline() -> DiffusionPipeline:
    global _generation_pipe

    if _generation_pipe is None:
        # Unload edit pipeline first to free GPU memory
        _unload_edit_pipeline()
        # Custom scheduler config for Lightning LoRA
        scheduler_config = {
            "base_image_seq_len": 256,
            "base_shift": math.log(3),
            "max_image_seq_len": 8192,
            "max_shift": math.log(3),
            "num_train_timesteps": 1000,
            "shift": 1.0,
            "shift_terminal": None,
            "time_shift_type": "exponential",
            "use_dynamic_shifting": True,
        }
        scheduler = FlowMatchEulerDiscreteScheduler.from_config(scheduler_config)

        _generation_pipe = DiffusionPipeline.from_pretrained(
            config.generation_model,
            scheduler=scheduler,
            torch_dtype=get_torch_dtype(),
            cache_dir=config.model_cache_dir,
            device_map="balanced",
            low_cpu_mem_usage=True,
        )

        # Load Lightning LoRA for fast inference
        _generation_pipe.load_lora_weights(
            config.generation_lora,
            weight_name="Qwen-Image-Lightning-8steps-V1.0.safetensors",
            cache_dir=config.model_cache_dir,
        )

        # Memory optimizations
        _generation_pipe.enable_vae_slicing()
        _generation_pipe.enable_vae_tiling()

    return _generation_pipe


def get_edit_pipeline() -> QwenImageEditPipeline:
    global _edit_pipe

    if _edit_pipe is None:
        # Unload generation pipeline first to free GPU memory
        _unload_generation_pipeline()

        _edit_pipe = QwenImageEditPipeline.from_pretrained(
            config.edit_model,
            torch_dtype=get_torch_dtype(),
            cache_dir=config.model_cache_dir,
            device_map="balanced",
            low_cpu_mem_usage=True,
        )

        # Memory optimizations
        _edit_pipe.enable_vae_slicing()
        _edit_pipe.enable_vae_tiling()

    return _edit_pipe


def generate_image(
    prompt: str,
    negative_prompt: str = " ",
    width: int = 1024,
    height: int = 1024,
    num_inference_steps: int = 8,
    true_cfg_scale: float = 1.0,
    seed: Optional[int] = None,
) -> bytes:
    pipe = get_generation_pipeline()

    generator = None
    if seed is not None:
        generator = torch.Generator(device=config.device).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
        true_cfg_scale=true_cfg_scale,
        generator=generator,
    )

    image = result.images[0]
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


def edit_image(
    image: Image.Image,
    prompt: str,
    num_inference_steps: int = 50,
    seed: Optional[int] = None,
) -> bytes:
    pipe = get_edit_pipeline()

    generator = None
    if seed is not None:
        generator = torch.Generator(device=config.device).manual_seed(seed)

    # Ensure image is RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    result = pipe(
        image=image,
        prompt=prompt,
        num_inference_steps=num_inference_steps,
        generator=generator,
    )

    output_image = result.images[0]
    buffer = io.BytesIO()
    output_image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


def is_generation_model_loaded() -> bool:
    return _generation_pipe is not None


def is_edit_model_loaded() -> bool:
    return _edit_pipe is not None


def preload_models():
    """Preload generation model on startup. Edit model stays lazy-loaded due to GPU memory constraints."""
    logger.info("Preloading generation model...")
    get_generation_pipeline()
    logger.info("Generation model loaded successfully")
    logger.info("Edit model will be lazy-loaded on first use (GPU memory constraint)")
