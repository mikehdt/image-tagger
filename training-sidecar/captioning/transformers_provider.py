"""
HuggingFace transformers captioning provider.

Loads a vision-language model via `transformers` + PyTorch on CUDA and runs
inference in streaming mode so cancellation can interrupt within a token or two.

Model lifecycle mirrors the llama-cpp provider:
- Lazily loaded on first caption request
- Cached between requests for the same model directory
- Released on unload() (frees GPU memory)

Loading strategy: fp16, device_map="cuda", no quantization. We explicitly
avoid bitsandbytes here — if a low-VRAM variant is needed it gets its own
model entry in the registry rather than a runtime toggle.

Loading progress surfacing: transformers emits a `Loading checkpoint shards`
tqdm bar while reading safetensors. We monkey-patch the tqdm used by
`transformers.utils.logging` during the load so each step invokes our
on_load_progress callback — giving the UI real per-shard updates instead of
a silent 15-30s spinner.

Known behaviour:
- First call blocks ~10-30s for model load. Subsequent calls reuse the cached
  instance as long as the same model_path keeps coming in.
- `cancel_check` is polled per streamed token. Windows Python can't reliably
  interrupt a single forward pass, so cancel takes effect on the next token
  after the flag flips — usually <100ms on GPU.
"""

from __future__ import annotations

import asyncio
import contextlib
import threading
from pathlib import Path
from typing import Any, Iterator, Optional

from captioning.provider import (
    CancelCheck,
    CaptionCancelled,
    CaptioningProvider,
    LoadProgressCallback,
)


@contextlib.contextmanager
def _broadcast_tqdm(
    on_load_progress: Optional[LoadProgressCallback],
) -> Iterator[None]:
    """
    Replace the tqdm class that transformers uses during model loading so
    each progress step fires our callback. The underlying tqdm is only
    ever called from a handful of places inside `from_pretrained`; the
    one we care about is the `Loading checkpoint shards` bar in
    `modeling_utils._load_state_dict_into_meta_model`.

    We patch two modules:
    - `transformers.utils.logging`: re-exports tqdm as `tqdm_lib.tqdm`
    - `huggingface_hub.utils.tqdm`: where transformers imports its tqdm from

    If transformers changes where it sources tqdm in a future release, the
    bar silently stops updating but loading still works — acceptable
    degradation.
    """
    if on_load_progress is None:
        yield
        return

    # Import lazily so the patching logic only touches transformers at
    # load time — avoids importing half the library when captioning is mocked.
    try:
        import huggingface_hub.utils.tqdm as hf_tqdm_mod
        import transformers.utils.logging as tlog
    except ImportError:
        yield
        return

    original_tqdm = hf_tqdm_mod.tqdm

    class BroadcastTqdm(original_tqdm):  # type: ignore[misc,valid-type]
        """Subclass that forwards each update() tick to our callback."""

        def update(self, n: int = 1) -> bool | None:  # type: ignore[override]
            result = super().update(n)
            try:
                desc = str(self.desc) if self.desc else "Loading model"
                current = int(self.n or 0)
                total = int(self.total or 0)
                on_load_progress(desc, current, total)
            except Exception:
                # Never let a broken callback blow up the model load.
                pass
            return result

        def close(self) -> None:  # type: ignore[override]
            # Flush a final 100% tick so the UI doesn't stick at the
            # last intermediate value when total is known.
            try:
                if self.total:
                    desc = str(self.desc) if self.desc else "Loading model"
                    on_load_progress(desc, int(self.total), int(self.total))
            except Exception:
                pass
            super().close()

    hf_tqdm_mod.tqdm = BroadcastTqdm  # type: ignore[assignment]
    # transformers.utils.logging re-exports the hub tqdm as `tqdm_lib.tqdm`
    # at import time — we also need to swap it there.
    original_tlog_tqdm = getattr(tlog, "tqdm_lib", None)
    if original_tlog_tqdm is not None:
        original_inner = getattr(original_tlog_tqdm, "tqdm", None)
        if original_inner is not None:
            original_tlog_tqdm.tqdm = BroadcastTqdm  # type: ignore[attr-defined]

    try:
        yield
    finally:
        hf_tqdm_mod.tqdm = original_tqdm  # type: ignore[assignment]
        if original_tlog_tqdm is not None and original_inner is not None:
            original_tlog_tqdm.tqdm = original_inner  # type: ignore[attr-defined]


class TransformersCaptioningProvider(CaptioningProvider):
    """Real VLM captioning via HuggingFace transformers + PyTorch CUDA."""

    def __init__(self) -> None:
        self._model: Optional[Any] = None
        self._processor: Optional[Any] = None
        self._loaded_model_path: Optional[str] = None
        # Serialise all torch operations behind an async lock — the model is
        # not safe for concurrent forward passes, and cheaply queueing requests
        # is fine given batches are sequential anyway.
        self._lock = asyncio.Lock()

    def _load_model(
        self,
        model_path: str,
        on_load_progress: Optional[LoadProgressCallback] = None,
    ) -> None:
        """Load the model and processor. Blocking; runs in an executor."""
        # Imports inside the function so the sidecar boots cleanly even when
        # the gpu extra isn't installed.
        import torch
        from transformers import AutoModelForImageTextToText, AutoProcessor

        if self._model is not None and self._loaded_model_path == model_path:
            return

        # Release any previous instance before loading the next.
        if self._model is not None:
            try:
                del self._model
            except Exception:
                pass
            self._model = None
            self._processor = None
            try:
                torch.cuda.empty_cache()
            except Exception:
                pass

        if not torch.cuda.is_available():
            raise RuntimeError(
                "transformers VLM provider requires CUDA. "
                "Install the 'gpu' extra and ensure an NVIDIA GPU is present, "
                "or pick a GGUF (llama-cpp) model instead."
            )

        model_dir = Path(model_path)
        if not model_dir.exists():
            raise FileNotFoundError(
                f"Model directory not found: {model_path}. "
                "Download the model via the Model Manager first."
            )

        if on_load_progress is not None:
            on_load_progress("Reading tokenizer and processor", 0, 0)

        # Qwen2.5/3-VL ship with AutoProcessor + AutoModelForImageTextToText.
        # trust_remote_code=False is intentional — the HF canonical Qwen VL
        # classes have been upstreamed into transformers.
        processor = AutoProcessor.from_pretrained(
            str(model_dir),
            trust_remote_code=False,
        )

        if on_load_progress is not None:
            on_load_progress("Loading checkpoint shards", 0, 0)

        # Patch transformers' tqdm so shard loading pings our callback.
        with _broadcast_tqdm(on_load_progress):
            model = AutoModelForImageTextToText.from_pretrained(
                str(model_dir),
                torch_dtype=torch.float16,
                device_map="cuda",
                trust_remote_code=False,
            )
        model.eval()

        if on_load_progress is not None:
            on_load_progress("Model ready", 1, 1)

        self._model = model
        self._processor = processor
        self._loaded_model_path = model_path

    def _generate_caption_blocking(
        self,
        image_path: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
        cancel_check: Optional[CancelCheck],
    ) -> str:
        """Run streamed inference synchronously inside the lock."""
        import torch
        from PIL import Image
        from transformers import TextIteratorStreamer

        assert self._model is not None and self._processor is not None

        image = Image.open(image_path).convert("RGB")

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt},
                ],
            }
        ]

        # Qwen VL processors accept the messages structure directly and
        # handle the chat template + image tokenisation in one call.
        inputs = self._processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(self._model.device)

        streamer = TextIteratorStreamer(
            self._processor.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
        )

        generation_kwargs: dict[str, Any] = {
            **inputs,
            "streamer": streamer,
            "max_new_tokens": max_tokens,
            "do_sample": temperature > 0,
            "temperature": max(temperature, 1e-5),
            "pad_token_id": self._processor.tokenizer.eos_token_id,
        }

        # Kick off generation in a background thread so we can iterate the
        # streamer and poll for cancellation in the calling thread.
        gen_thread = threading.Thread(
            target=self._model.generate,
            kwargs=generation_kwargs,
            daemon=True,
        )
        gen_thread.start()

        pieces: list[str] = []
        cancelled = False
        try:
            for chunk in streamer:
                if cancel_check is not None and cancel_check():
                    cancelled = True
                    break
                if chunk:
                    pieces.append(chunk)
        finally:
            # If we bailed early, drain the streamer so the generation thread
            # doesn't block forever pushing into a full queue. Transformers'
            # streamer doesn't expose a cancel hook, so the generate() call
            # itself runs to completion — but on GPU that's usually fast, and
            # the consumer thread returns control to the caller immediately.
            if cancelled:
                for _ in streamer:
                    pass
            gen_thread.join(timeout=60)
            try:
                torch.cuda.empty_cache()
            except Exception:
                pass

        if cancelled:
            raise CaptionCancelled("cancelled mid-inference")

        return "".join(pieces).strip()

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
        async with self._lock:
            # Load on first call or when model changes
            if self._model is None or self._loaded_model_path != model_path:
                await asyncio.get_event_loop().run_in_executor(
                    None, self._load_model, model_path, on_load_progress
                )

            # Run inference in a thread so the event loop stays free to push
            # WebSocket progress updates to connected clients.
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self._generate_caption_blocking,
                image_path,
                prompt,
                max_tokens,
                temperature,
                cancel_check,
            )

    async def unload(self) -> None:
        async with self._lock:
            if self._model is not None:
                try:
                    del self._model
                    del self._processor
                except Exception:
                    pass
                self._model = None
                self._processor = None
                self._loaded_model_path = None
                try:
                    import torch

                    torch.cuda.empty_cache()
                except Exception:
                    pass
