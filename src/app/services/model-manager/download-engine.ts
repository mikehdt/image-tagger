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
 * - Cleans up partial files on error.
 * - Yields progress approximately every 1 MB.
 */
export async function* downloadModelFiles(
  opts: {
    modelId: string;
    downloadId: string;
    repoId: string;
    files: ModelFile[];
    targetDir: string;
  },
  signal?: AbortSignal,
): AsyncGenerator<DownloadProgress> {
  const { modelId, downloadId, repoId, files, targetDir } = opts;

  fs.mkdirSync(targetDir, { recursive: true });

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let bytesDownloaded = 0;

  for (const file of files) {
    const filePath = path.join(targetDir, file.name);

    // Skip if file already exists with correct size
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size === file.size || file.size === 0) {
          bytesDownloaded += stats.size;
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
      } catch {
        // Continue with download if stat fails
      }
    }

    // Construct HuggingFace download URL
    const url = `https://huggingface.co/${repoId}/resolve/main/${file.name}`;

    yield {
      downloadId,
      modelId,
      status: 'downloading',
      currentFile: file.name,
      bytesDownloaded,
      totalBytes,
    };

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Stream to file with progress tracking
      const fileStream = fs.createWriteStream(filePath);
      const reader = response.body.getReader();

      let fileBytes = 0;
      const startBytes = bytesDownloaded;

      while (true) {
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
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    } catch (error) {
      // Clean up partial file
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // Ignore cleanup errors
        }
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
