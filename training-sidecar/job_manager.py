"""Training job lifecycle management."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from models import (
    JobProgress,
    JobState,
    JobStatus,
    StartJobRequest,
    StartJobResponse,
)
from ws_manager import WebSocketManager


class JobManager:
    """Manages training job lifecycle, state persistence, and progress broadcasting."""

    def __init__(self, jobs_dir: Path, ws_manager: WebSocketManager):
        self._jobs_dir = jobs_dir
        self._ws = ws_manager
        self._active_job: Optional[JobState] = None

        # Try to recover state from a previous run
        self._recover_state()

    @property
    def active_job_id(self) -> Optional[str]:
        return self._active_job.job_id if self._active_job else None

    @property
    def active_job(self) -> Optional[JobState]:
        return self._active_job

    def get_status(self) -> Optional[dict]:
        """Get current job state as a dict, or None if no active job."""
        if self._active_job is None:
            return None
        return self._active_job.model_dump()

    def create_job(self, request: StartJobRequest) -> StartJobResponse:
        """Create a new training job. Fails if a job is already active."""
        if self._active_job and self._active_job.status in (
            JobStatus.PENDING,
            JobStatus.PREPARING,
            JobStatus.TRAINING,
        ):
            raise RuntimeError(
                f"Job {self._active_job.job_id} is already active "
                f"(status: {self._active_job.status})"
            )

        job_id = uuid.uuid4().hex[:12]
        now = datetime.now(timezone.utc).isoformat()

        progress = JobProgress(job_id=job_id, status=JobStatus.PENDING)

        self._active_job = JobState(
            job_id=job_id,
            status=JobStatus.PENDING,
            provider=request.provider,
            project_path=request.project_path,
            config=request.model_dump(),
            started_at=now,
            progress=progress,
        )

        self._persist_state()
        return StartJobResponse(job_id=job_id, status=JobStatus.PENDING)

    async def update_progress(self, progress: JobProgress):
        """Update job progress and broadcast to WebSocket clients."""
        if self._active_job is None:
            return

        self._active_job.progress = progress
        self._active_job.status = progress.status

        if progress.status in (
            JobStatus.COMPLETED,
            JobStatus.FAILED,
            JobStatus.CANCELLED,
        ):
            self._active_job.completed_at = datetime.now(timezone.utc).isoformat()

        self._persist_state()
        await self._ws.broadcast(progress.model_dump())

    def mark_failed(self, error: str):
        """Mark the active job as failed with an error message."""
        if self._active_job is None:
            return

        self._active_job.status = JobStatus.FAILED
        self._active_job.progress.status = JobStatus.FAILED
        self._active_job.progress.error = error
        self._active_job.completed_at = datetime.now(timezone.utc).isoformat()
        self._persist_state()

    def clear_completed(self):
        """Clear a completed/failed/cancelled job from active state."""
        if self._active_job and self._active_job.status in (
            JobStatus.COMPLETED,
            JobStatus.FAILED,
            JobStatus.CANCELLED,
        ):
            self._active_job = None

    def _persist_state(self):
        """Write current job state to disk for crash recovery."""
        if self._active_job is None:
            return

        path = self._jobs_dir / f"{self._active_job.job_id}.json"
        try:
            path.write_text(
                json.dumps(self._active_job.model_dump(), indent=2),
                encoding="utf-8",
            )
        except OSError as e:
            print(f"Warning: Failed to persist job state: {e}")

    def _recover_state(self):
        """Attempt to recover the most recent active job from disk."""
        if not self._jobs_dir.exists():
            return

        latest: Optional[tuple[float, Path]] = None
        for path in self._jobs_dir.glob("*.json"):
            mtime = path.stat().st_mtime
            if latest is None or mtime > latest[0]:
                latest = (mtime, path)

        if latest is None:
            return

        try:
            data = json.loads(latest[1].read_text(encoding="utf-8"))
            job = JobState(**data)

            # Only recover jobs that were in-progress (not completed/failed)
            if job.status in (JobStatus.PENDING, JobStatus.PREPARING, JobStatus.TRAINING):
                # Mark as failed since the sidecar restarted while it was running
                job.status = JobStatus.FAILED
                job.progress.status = JobStatus.FAILED
                job.progress.error = "Training interrupted — sidecar restarted"
                job.completed_at = datetime.now(timezone.utc).isoformat()

            self._active_job = job
        except (json.JSONDecodeError, OSError, ValueError) as e:
            print(f"Warning: Failed to recover job state: {e}")
