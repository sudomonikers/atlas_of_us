from typing import Optional

from pydantic import BaseModel, Field, field_validator


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Text prompt for image generation")
    negative_prompt: str = Field(default=" ", description="Negative prompt for guidance")
    width: int = Field(default=1024, ge=256, le=2048, description="Image width")
    height: int = Field(default=1024, ge=256, le=2048, description="Image height")
    num_inference_steps: int = Field(
        default=8, ge=1, le=100, description="Number of denoising steps"
    )
    true_cfg_scale: float = Field(
        default=1.0, ge=1.0, le=20.0, description="Classifier-free guidance scale"
    )
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")

    @field_validator("width", "height")
    @classmethod
    def must_be_multiple_of_64(cls, v: int) -> int:
        if v % 64 != 0:
            raise ValueError("Must be a multiple of 64")
        return v


class EditRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Edit instruction prompt")
    num_inference_steps: int = Field(
        default=50, ge=1, le=100, description="Number of denoising steps"
    )
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")


class HealthResponse(BaseModel):
    status: str
    generation_model_loaded: bool
    edit_model_loaded: bool
