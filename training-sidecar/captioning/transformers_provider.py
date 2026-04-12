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

Known behaviour:
- First call blocks ~10-30s for model load. Subsequent calls reuse the cached
  instance as long as the same model_path keeps coming in.
- `cancel_check` is polled per streamed token. Windows Python can't reliably
  interrupt a single forward pass, so cancel takes effect on the next token
  after the flag flips — usually <100ms on GPU.
"""

from __future__ import annotations

import asyncio
import threading
from pathlib import Path
from typing import Any, Optional

from captioning.provider import CancelCheck, CaptionCancelled, CaptioningProvider


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

    def _load_model(self, model_path: str) -> None:
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

        # Qwen2.5/3-VL ship with AutoProcessor + AutoModelForImageTextToText.
        # trust_remote_code=False is intentional — the HF canonical Qwen VL
        # classes have been upstreamed into transformers.
        processor = AutoProcessor.from_pretrained(
            str(model_dir),
            trust_remote_code=False,
        )
        model = AutoModelForImageTextToText.from_pretrained(
            str(model_dir),
            torch_dtype=torch.float16,
            device_map="cuda",
            trust_remote_code=False,
        )
        model.eval()

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
    ) -> str:
        async with self._lock:
            # Load on first call or when model changes
            if self._model is None or self._loaded_model_path != model_path:
                await asyncio.get_event_loop().run_in_executor(
                    None, self._load_model, model_path
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
