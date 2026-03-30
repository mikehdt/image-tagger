"""Training sidecar — FastAPI server for managing LoRA training jobs."""

import argparse
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import SidecarConfig, load_config
from job_manager import JobManager
from models import ErrorResponse, HealthResponse, StartJobRequest
from ws_manager import WebSocketManager

# --- Globals initialised at startup ---
ws_manager = WebSocketManager()
job_manager: JobManager
sidecar_config: SidecarConfig


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle for the FastAPI app."""
    global job_manager, sidecar_config

    sidecar_config = load_config()
    job_manager = JobManager(
        jobs_dir=sidecar_config.training_dir / "jobs",
        ws_manager=ws_manager,
    )

    # Write PID file so Node.js can find us after a restart
    pid_path = sidecar_config.training_dir / "sidecar.pid"
    pid_path.write_text(str(__import__("os").getpid()), encoding="utf-8")

    # Signal to the Node.js process manager that we're ready
    print(f"SIDECAR_READY port={sidecar_config.port}", flush=True)

    yield

    # Cleanup on shutdown
    if pid_path.exists():
        pid_path.unlink()


app = FastAPI(title="Training Sidecar", version="0.1.0", lifespan=lifespan)

# Allow connections from the Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health ---


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(active_job=job_manager.active_job_id)


# --- Job management ---


@app.post("/jobs/start")
async def start_job(request: StartJobRequest):
    try:
        response = job_manager.create_job(request)
        # TODO: Phase 4 — actually spawn the training process via provider
        return response
    except RuntimeError as e:
        return ErrorResponse(error=str(e))


@app.post("/jobs/cancel")
async def cancel_job():
    if job_manager.active_job is None:
        return ErrorResponse(error="No active job to cancel")

    # TODO: Phase 4 — cancel via provider
    job_manager.mark_failed("Cancelled by user")
    return {"status": "cancelled"}


@app.get("/jobs/status")
async def job_status():
    state = job_manager.get_status()
    if state is None:
        return {"active": False}
    return {"active": True, **state}


# --- WebSocket for real-time progress ---


@app.websocket("/ws/progress")
async def ws_progress(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send current state immediately on connect
        state = job_manager.get_status()
        if state:
            await websocket.send_json(state.get("progress", {}))

        # Keep connection alive — the server pushes updates via broadcast
        while True:
            # Wait for client messages (ping/pong or close)
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket)


# --- Entry point ---


def main():
    parser = argparse.ArgumentParser(description="Training sidecar server")
    parser.add_argument(
        "--app-root",
        type=Path,
        default=None,
        help="Path to the img-tagger app root (parent of config.json)",
    )
    args = parser.parse_args()

    if args.app_root:
        global sidecar_config
        sidecar_config = load_config(args.app_root)

    config = load_config(args.app_root)

    import uvicorn

    uvicorn.run(
        app,
        host=config.host,
        port=config.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
