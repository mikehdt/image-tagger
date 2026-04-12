/**
 * Download engine for fetching model files from HuggingFace.
 *
 * This is the core download logic extracted from the auto-tagger service.
 * It accepts a target directory so callers control where files are stored.
 *
 * Server-only — do not import from client components.
 */

import fs from 'fs';
import path from 'path';

import type { DownloadProgress, ModelFile } from './types';

/**
 * Download model files from HuggingFace into `targetDir`.
 * Yields progress updates as an async generator.
 *
 * - Skips files that already exist with the correct size.
 * - Resumes partial files using HTTP Range requests when the server
 *   supports them; falls back to a fresh download otherwise.
 * - Leaves partial files in place on cancel/error so the next attempt
 *   can resume from where it left off. Use the modal's Delete action to
 *   wipe partials explicitly.
 * - Yields progress approximately every 1 MB.
 */
export async function* downloadModelFiles(
  opts: {
    modelId: string;
    downloadId: string;
    repoId: string;
    files: ModelFile[];
    targetDir: string;
    /** Optional HuggingFace API token for gated repos. */
    hfToken?: string | null;
  },
  signal?: AbortSignal,
): AsyncGenerator<DownloadProgress> {
  const { modelId, downloadId, repoId, files, targetDir, hfToken } = opts;
  const authHeaders: Record<string, string> = hfToken
    ? { Authorization: `Bearer ${hfToken}` }
    : {};

  fs.mkdirSync(targetDir, { recursive: true });

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let bytesDownloaded = 0;

  for (const file of files) {
    const filePath = path.join(targetDir, file.name);

    // Inspect any existing file on disk to decide whether to skip,
    // resume, or restart this file.
    let existingSize = 0;
    if (fs.existsSync(filePath)) {
      try {
        existingSize = fs.statSync(filePath).size;
      } catch {
        existingSize = 0;
      }
    }

    // Already complete — skip and credit toward overall progress.
    if (
      existingSize > 0 &&
      file.size > 0 &&
      existingSize === file.size
    ) {
      bytesDownloaded += existingSize;
      yield {
        downloadId,
        modelId,
        status: 'downloading',
        currentFile: file.name,
        bytesDownloaded,
        totalBytes,
      };
      continue;
    }

    // Larger than expected (corrupted / wrong file) — start fresh.
    if (file.size > 0 && existingSize > file.size) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Best-effort; createWriteStream below will overwrite anyway.
      }
      existingSize = 0;
    }

    // If file.size is 0 the manifest doesn't know the expected size,
    // so we can't safely resume — start fresh.
    const canResume = file.size > 0 && existingSize > 0;

    // Construct HuggingFace download URL
    const url = `https://huggingface.co/${repoId}/resolve/main/${file.name}`;

    // Account already-on-disk bytes toward progress before we start writing
    bytesDownloaded += existingSize;

    yield {
      downloadId,
      modelId,
      status: 'downloading',
      currentFile: file.name,
      bytesDownloaded,
      totalBytes,
    };

    let fileStream: fs.WriteStream | null = null;
    try {
      const response = await fetch(url, {
        signal,
        headers: {
          ...authHeaders,
          ...(canResume ? { Range: `bytes=${existingSize}-` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const hint = hfToken
            ? `Access denied (${response.status}). This repo is gated — accept the license at https://huggingface.co/${repoId}`
            : `Access denied (${response.status}). This repo may be gated. Set a HuggingFace token in Model Manager → Settings, and accept the license at https://huggingface.co/${repoId}`;
          throw new Error(hint);
        }
        // 416 = range not satisfiable; treat the partial as garbage and retry fresh next time.
        if (response.status === 416) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore
          }
          throw new Error('Existing partial file is unusable. Try again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // 206 Partial Content = server honoured the range; append to the file.
      // 200 OK with a range header = server ignored the range; rewrite from scratch.
      const isResuming = canResume && response.status === 206;
      if (canResume && !isResuming) {
        // Server returned the full file — undo our optimistic credit and overwrite.
        bytesDownloaded -= existingSize;
        existingSize = 0;
      }

      fileStream = fs.createWriteStream(filePath, {
        flags: isResuming ? 'a' : 'w',
      });
      const reader = response.body.getReader();

      // fileBytes tracks bytes written *this attempt*, not the total file size.
      let fileBytes = 0;
      const startBytes = bytesDownloaded;

      while (true) {
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const { done, value } = await reader.read();

        if (done) break;

        fileStream.write(Buffer.from(value));
        fileBytes += value.length;
        bytesDownloaded = startBytes + fileBytes;

        // Yield progress every ~1MB
        if (fileBytes % (1024 * 1024) < value.length) {
          yield {
            downloadId,
            modelId,
            status: 'downloading',
            currentFile: file.name,
            bytesDownloaded,
            totalBytes,
          };
        }
      }

      fileStream.end();

      // Wait for file to finish writing
      await new Promise<void>((resolve, reject) => {
        fileStream!.on('finish', resolve);
        fileStream!.on('error', reject);
      });
      fileStream = null;
    } catch (error) {
      // Always close any open write stream so flushed bytes hit disk
      // and the OS handle is released. Partials remain on disk for resume.
      if (fileStream) {
        try {
          fileStream.end();
        } catch {
          // ignore
        }
      }

      // Aborts (user clicked Cancel, or client disconnected) are intentional —
      // don't surface them as errors. Just stop iterating; the route's
      // outer SSE handler decides whether to enqueue a final event.
      const isAbort =
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError') ||
        signal?.aborted === true;
      if (isAbort) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      yield {
        downloadId,
        modelId,
        status: 'error',
        currentFile: file.name,
        bytesDownloaded,
        totalBytes,
        error: `Failed to download ${file.name}: ${message}`,
      };
      return;
    }
  }

  yield {
    downloadId,
    modelId,
    status: 'ready',
    bytesDownloaded: totalBytes,
    totalBytes,
  };
}
