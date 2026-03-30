"""Training sidecar — FastAPI server for managing LoRA training jobs."""

import argparse
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import SidecarConfig, load_config
from job_manager import JobManager
from models import HealthResponse, StartJobRequest
from providers.ai_toolkit import AiToolkitProvider
from ws_manager import WebSocketManager

# --- Globals initialised at startup ---
ws_manager = WebSocketManager()
job_manager: JobManager
sidecar_config: SidecarConfig


def _register_providers(jm: JobManager, config: SidecarConfig):
    """Register available training providers based on config."""
    backends = config.backends

    # ai-toolkit
    aitk_path = backends.get("ai-toolkit")
    if aitk_path:
        provider = AiToolkitProvider(aitk_path)
        jm.register_provider("ai-toolkit", provider)
        print(f"[sidecar] Registered ai-toolkit provider at {aitk_path}")

    # TODO Phase 6: Kohya provider
    # kohya_path = backends.get("kohya")
    # if kohya_path:
    #     provider = KohyaProvider(kohya_path)
    #     jm.register_provider("kohya", provider)

    if not jm.providers:
        print(
            "[sidecar] Warning: No training backends configured. "
            "Add paths to config.json under 'trainingBackends'.",
            file=sys.stderr,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle for the FastAPI app."""
    global job_manager, sidecar_config

    sidecar_config = load_config()
    job_manager = JobManager(
        jobs_dir=sidecar_config.training_dir / "jobs",
        ws_manager=ws_manager,
    )
    _register_providers(job_manager, sidecar_config)

    # Write PID file so Node.js can find us after a restart
    pid_path = sidecar_config.training_dir / "sidecar.pid"
    pid_path.write_text(str(os.getpid()), encoding="utf-8")

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


# --- Provider info ---


@app.get("/providers")
async def list_providers():
    """List registered providers and their supported models."""
    result = {}
    for name, provider in job_manager.providers.items():
        result[name] = {
            "models": provider.get_supported_models(),
        }
    return result


@app.get("/providers/{provider_name}/validate")
async def validate_provider(provider_name: str):
    """Validate that a provider's environment is correctly set up."""
    provider = job_manager.providers.get(provider_name)
    if provider is None:
        return JSONResponse(
            {"valid": False, "error": f"Unknown provider: {provider_name}"},
            status_code=404,
        )
    valid, error = await provider.validate_environment()
    return {"valid": valid, "error": error}


# --- Job management ---


@app.post("/jobs/start")
async def start_job(request: StartJobRequest):
    try:
        response = await job_manager.start_job(request)
        return response
    except RuntimeError as e:
        return JSONResponse({"error": str(e)}, status_code=409)


@app.post("/jobs/cancel")
async def cancel_job():
    success = await job_manager.cancel_job()
    if not success:
        return JSONResponse({"error": "No active job to cancel"}, status_code=404)
    return {"status": "cancelled"}


@app.get("/jobs/status")
async def job_status():
    state = job_manager.get_status()
    if state is None:
        return {"active": False}
    return {"active": True, **state}


@app.post("/jobs/clear")
async def clear_job():
    """Clear a completed/failed/cancelled job from active state."""
    job_manager.clear_completed()
    return {"status": "cleared"}


# --- WebSocket for real-time progress ---


@app.websocket("/ws/progress")
async def ws_progress(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send current state immediately on connect
        state = job_manager.get_status()
        if state and "progress" in state:
            await websocket.send_json(state["progress"])

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
