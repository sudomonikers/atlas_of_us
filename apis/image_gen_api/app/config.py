import os
from dataclasses import dataclass


@dataclass
class Config:
    model_cache_dir: str
    device: str
    torch_dtype: str
    host: str
    port: int
    generation_model: str
    generation_lora: str
    edit_model: str


def load_config() -> Config:
    return Config(
        model_cache_dir=os.getenv("MODEL_CACHE_DIR", "/app/models"),
        device=os.getenv("DEVICE", "cuda"),
        torch_dtype=os.getenv("TORCH_DTYPE", "bfloat16"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8082")),
        generation_model=os.getenv("GENERATION_MODEL", "Qwen/Qwen-Image"),
        generation_lora=os.getenv(
            "GENERATION_LORA", "lightx2v/Qwen-Image-Lightning"
        ),
        edit_model=os.getenv("EDIT_MODEL", "Qwen/Qwen-Image-Edit"),
    )


config = load_config()
