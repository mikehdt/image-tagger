"""Configuration loading for the training sidecar."""

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class SidecarConfig:
    """Configuration for the training sidecar server."""

    port: int = 9733
    host: str = "127.0.0.1"
    app_root: Path = field(default_factory=lambda: Path.cwd())
    training_dir: Path = field(default_factory=lambda: Path.cwd() / ".training")
    backends: dict[str, str] = field(default_factory=dict)

    def __post_init__(self):
        # Ensure training directory exists
        self.training_dir.mkdir(parents=True, exist_ok=True)
        (self.training_dir / "jobs").mkdir(exist_ok=True)


def load_config(app_root: Optional[Path] = None) -> SidecarConfig:
    """Load configuration from the app's config.json."""
    if app_root is None:
        # Default: assume we're in training-sidecar/, app root is parent
        app_root = Path(__file__).parent.parent

    config_path = app_root / "config.json"
    port = 9733
    backends: dict[str, str] = {}

    if config_path.exists():
        try:
            with open(config_path, "r") as f:
                data = json.load(f)

            # Read training backend paths
            raw_backends = data.get("trainingBackends", {})
            for key, value in raw_backends.items():
                if isinstance(value, str) and Path(value).exists():
                    backends[key] = value

            port = data.get("sidecarPort", 9733)
        except (json.JSONDecodeError, OSError) as e:
            print(f"Warning: Failed to read config.json: {e}", file=sys.stderr)

    return SidecarConfig(
        port=port,
        app_root=app_root,
        training_dir=app_root / ".training",
        backends=backends,
    )
