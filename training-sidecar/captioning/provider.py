"""
Captioning provider — runs VLM inference on images.

Backends:
- LlamaCppCaptioningProvider: GGUF inference via llama-cpp-python (CPU, Linux CUDA)
- TransformersCaptioningProvider: safetensors fp16 via PyTorch CUDA (Windows GPU path)

The active provider is chosen by get_provider(runtime). Each runtime has its
own lazy-loaded singleton, so loading one doesn't touch the other. This lets
a user keep a GGUF model loaded for CPU captioning while also having the GPU
transformers model swappable in without fighting over the cache.

If the requested runtime's dependency isn't installed, get_provider raises
with a clear install hint — no silent fallback. Better to tell the user
exactly what's missing than to pretend and surface garbage.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable, Literal, Optional

VlmRuntime = Literal["llama-cpp", "transformers"]

# Type alias for the cooperative cancellation callback. The batch manager
# passes a closure that reads its own `cancel_requested` flag; the provider
# polls it during inference and raises CaptionCancelled when it flips true.
CancelCheck = Callable[[], bool]

# Type alias for the model-loading progress callback. The batch manager passes
# a closure that broadcasts over its WebSocket. Providers invoke it while the
# model is loading to surface long blocking operations (e.g. reading safetensors
# shards). Arguments: (message, current, total). `total` may be 0 when only a
# status message is known without a step count.
LoadProgressCallback = Callable[[str, int, int], None]


class CaptionCancelled(Exception):
    """Raised by a provider when inference is aborted via cancel_check."""


class CaptioningProvider(ABC):
    """Abstract base for captioning backends."""

    @abstractmethod
    async def caption_image(
        self,
        image_path: str,
        model_path: str,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        cancel_check: Optional[CancelCheck] = None,
        on_load_progress: Optional[LoadProgressCallback] = None,
    ) -> str:
        """Return a natural-language caption for the image."""

    @abstractmethod
    async def unload(self) -> None:
        """Release any cached model resources (GPU memory, etc.)."""


# One lazily-instantiated singleton per runtime. Loading the transformers
# provider does not touch the llama-cpp one, and vice versa.
_providers: dict[str, CaptioningProvider] = {}


def _instantiate(runtime: VlmRuntime) -> CaptioningProvider:
    """Build a provider for the requested runtime."""
    if runtime == "transformers":
        try:
            from captioning.transformers_provider import (
                TransformersCaptioningProvider,
            )
        except ImportError as err:
            raise RuntimeError(
                "The 'gpu' extra is not installed. "
                "Install it with: uv sync --extra gpu "
                f"(original error: {err})"
            ) from err
        print("[sidecar] Captioning: using TransformersCaptioningProvider")
        return TransformersCaptioningProvider()

    if runtime == "llama-cpp":
        try:
            from captioning.llama_cpp_provider import LlamaCppCaptioningProvider
        except ImportError as err:
            raise RuntimeError(
                "The 'vlm' extra is not installed. "
                "Install it with: uv sync --extra vlm "
                f"(original error: {err})"
            ) from err
        print("[sidecar] Captioning: using LlamaCppCaptioningProvider")
        return LlamaCppCaptioningProvider()

    raise ValueError(f"Unknown VLM runtime: {runtime}")


def get_provider(runtime: VlmRuntime = "llama-cpp") -> CaptioningProvider:
    """
    Get the captioning provider for the requested runtime.

    Providers are cached per-runtime so repeat calls don't reload the model.
    Raises RuntimeError if the required extra isn't installed — the caller
    should surface the error to the user so they know which extra to sync.
    """
    existing = _providers.get(runtime)
    if existing is not None:
        return existing
    provider = _instantiate(runtime)
    _providers[runtime] = provider
    return provider


async def unload_provider(runtime: Optional[VlmRuntime] = None) -> None:
    """
    Release model resources. If `runtime` is given, unload that runtime only.
    Otherwise unload all cached providers.
    """
    targets = [runtime] if runtime is not None else list(_providers.keys())
    for key in targets:
        provider = _providers.get(key)
        if provider is not None:
            await provider.unload()
