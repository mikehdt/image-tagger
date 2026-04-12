/**
 * Node-side client for the Python sidecar's captioning endpoints.
 *
 * Spins up the sidecar if needed, calls /caption or /caption/batch,
 * and streams batch progress via the /ws/caption WebSocket.
 */

import { ensureSidecar } from '@/app/services/training/sidecar-manager';

import { getModelFilePath } from '../../model-manager';
import type { TaggerModel, VlmOptions } from '../../types';

type CaptionResult = {
  imagePath: string;
  caption: string;
};

type BatchProgressEvent = {
  batchId: string;
  current: number;
  total: number;
  imagePath?: string;
  caption?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
};

/**
 * Get the absolute path to the GGUF/ONNX model file on disk.
 * VLM models have a single primary file — return the first one.
 */
export function getVlmModelPath(model: TaggerModel): string {
  if (model.files.length === 0) {
    throw new Error(`VLM model ${model.id} has no files defined`);
  }
  return getModelFilePath(model, model.files[0].name);
}

/**
 * Caption a single image via the sidecar.
 * Synchronous-ish: waits for the result and returns it.
 */
export async function captionImageViaSidecar(
  model: TaggerModel,
  imagePath: string,
  options: VlmOptions,
): Promise<string> {
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') {
    throw new Error(`Sidecar not ready: ${sidecar.error ?? 'unknown error'}`);
  }

  const modelPath = getVlmModelPath(model);

  const res = await fetch(`http://127.0.0.1:${sidecar.port}/caption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_path: imagePath,
      model_path: modelPath,
      prompt: options.prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errBody.error || `Sidecar caption failed: ${res.status}`);
  }

  const body = (await res.json()) as { image_path: string; caption: string };
  return body.caption;
}

/**
 * Start a batch caption run on the sidecar and stream progress back.
 * Returns an async generator yielding per-image results.
 *
 * The sidecar streams progress via WebSocket, which we consume and
 * yield as structured events to the caller. The caller (API route)
 * translates them into SSE events for the browser.
 */
export async function* captionBatchViaSidecar(
  model: TaggerModel,
  imagePaths: string[],
  options: VlmOptions,
  batchId: string,
): AsyncGenerator<CaptionResult | { error: string; imagePath?: string }> {
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') {
    throw new Error(`Sidecar not ready: ${sidecar.error ?? 'unknown error'}`);
  }

  const modelPath = getVlmModelPath(model);

  // Open the WebSocket first so we don't miss early progress events
  const ws = new WebSocket(`ws://127.0.0.1:${sidecar.port}/ws/caption`);

  const progressQueue: BatchProgressEvent[] = [];
  let resolveNext: ((value: BatchProgressEvent | null) => void) | null = null;
  let wsOpen = false;
  let wsError: Error | null = null;

  ws.addEventListener('open', () => {
    wsOpen = true;
  });

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string) as BatchProgressEvent & {
        channel?: string;
      };
      if (data.channel !== 'caption') return;
      if (resolveNext) {
        resolveNext(data);
        resolveNext = null;
      } else {
        progressQueue.push(data);
      }
    } catch {
      // Ignore malformed messages
    }
  });

  ws.addEventListener('error', () => {
    wsError = new Error('WebSocket error');
    if (resolveNext) {
      resolveNext(null);
      resolveNext = null;
    }
  });

  ws.addEventListener('close', () => {
    if (resolveNext) {
      resolveNext(null);
      resolveNext = null;
    }
  });

  // Wait for the WebSocket to open (or error out quickly)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!wsOpen) reject(new Error('WebSocket connection timed out'));
    }, 5000);
    const onOpen = () => {
      clearTimeout(timeout);
      resolve();
    };
    if (wsOpen) {
      clearTimeout(timeout);
      resolve();
    } else {
      ws.addEventListener('open', onOpen, { once: true });
      ws.addEventListener(
        'error',
        () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        },
        { once: true },
      );
    }
  });

  // Kick off the batch on the sidecar
  const startRes = await fetch(
    `http://127.0.0.1:${sidecar.port}/caption/batch`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_id: batchId,
        image_paths: imagePaths,
        model_path: modelPath,
        prompt: options.prompt,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
    },
  );

  if (!startRes.ok) {
    ws.close();
    const errBody = await startRes
      .json()
      .catch(() => ({ error: startRes.statusText }));
    throw new Error(
      errBody.error || `Sidecar batch start failed: ${startRes.status}`,
    );
  }

  // Consume progress events from the queue/WebSocket
  try {
    while (true) {
      const event: BatchProgressEvent | null =
        progressQueue.shift() ??
        (await new Promise<BatchProgressEvent | null>((resolve) => {
          resolveNext = resolve;
        }));

      if (event === null) {
        if (wsError) throw wsError;
        break;
      }

      // Per-image errors
      if (event.error && event.status === 'running') {
        yield { error: event.error, imagePath: event.imagePath };
        continue;
      }

      // Per-image success
      if (event.imagePath && event.caption && event.status === 'running') {
        yield { imagePath: event.imagePath, caption: event.caption };
      }

      // Terminal states
      if (
        event.status === 'completed' ||
        event.status === 'failed' ||
        event.status === 'cancelled'
      ) {
        if (event.status === 'failed' && event.error) {
          throw new Error(event.error);
        }
        break;
      }
    }
  } finally {
    ws.close();
  }
}

/**
 * Cancel an in-progress caption batch on the sidecar.
 */
export async function cancelCaptionBatch(batchId: string): Promise<void> {
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') return;

  await fetch(
    `http://127.0.0.1:${sidecar.port}/caption/batch/${encodeURIComponent(batchId)}/cancel`,
    { method: 'POST' },
  ).catch(() => {
    // best-effort
  });
}
