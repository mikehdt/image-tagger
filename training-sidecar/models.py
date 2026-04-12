"""Pydantic models for the training sidecar API."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ProviderType(str, Enum):
    AI_TOOLKIT = "ai-toolkit"
    KOHYA = "kohya"


class JobStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    TRAINING = "training"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DatasetEntry(BaseModel):
    path: str
    num_repeats: int = 1


class StartJobRequest(BaseModel):
    project_path: str
    provider: ProviderType
    base_model: str
    output_path: str
    output_name: str
    datasets: list[DatasetEntry]
    hyperparameters: dict
    sample_prompts: list[str] = []


class JobProgress(BaseModel):
    job_id: str
    status: JobStatus
    current_step: int = 0
    total_steps: int = 0
    current_epoch: int = 0
    total_epochs: int = 0
    loss: Optional[float] = None
    learning_rate: Optional[float] = None
    eta_seconds: Optional[int] = None
    sample_image_paths: list[str] = []
    log_lines: list[str] = []
    error: Optional[str] = None


class JobState(BaseModel):
    job_id: str
    status: JobStatus
    provider: ProviderType
    project_path: str
    config: dict
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    progress: JobProgress


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    active_job: Optional[str] = None


class StartJobResponse(BaseModel):
    job_id: str
    status: JobStatus


class ErrorResponse(BaseModel):
    error: str


# ---------------------------------------------------------------------------
# Captioning (VLM) models
# ---------------------------------------------------------------------------


class CaptionRequest(BaseModel):
    """Single image caption request."""

    image_path: str
    model_path: str
    prompt: str = "Describe this image in detail for AI training purposes."
    max_tokens: int = 512
    temperature: float = 0.7


class CaptionResponse(BaseModel):
    """Single image caption response."""

    image_path: str
    caption: str


class CaptionBatchRequest(BaseModel):
    """Batch captioning request — streams progress via WebSocket."""

    batch_id: str
    image_paths: list[str]
    model_path: str
    prompt: str = "Describe this image in detail for AI training purposes."
    max_tokens: int = 512
    temperature: float = 0.7


class CaptionBatchProgress(BaseModel):
    """Progress update for a batch caption run. Broadcast via /ws/caption."""

    batch_id: str
    current: int
    total: int
    image_path: Optional[str] = None
    caption: Optional[str] = None
    status: str = "running"  # running, completed, failed, cancelled
    error: Optional[str] = None


class CaptionBatchResponse(BaseModel):
    """Response for starting a batch caption run."""

    batch_id: str
    status: str = "started"
    total: int
