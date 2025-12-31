/**
 * Model Manager
 * Handles model downloading, caching, and status checking
 */

import fs from 'fs';
import path from 'path';

import type { DownloadProgress, ModelStatus, TaggerModel } from './types';

// Models are stored in a .auto-tagger directory in the project root
const MODELS_DIR = path.join(process.cwd(), '.auto-tagger', 'models');

/**
 * Get the local directory path for a model
 */
export function getModelDir(model: TaggerModel): string {
  return path.join(MODELS_DIR, model.provider, model.id);
}

/**
 * Get the path to a specific model file
 */
export function getModelFilePath(model: TaggerModel, fileName: string): string {
  return path.join(getModelDir(model), fileName);
}

/**
 * Check if a model is fully downloaded and ready
 */
export function checkModelStatus(model: TaggerModel): ModelStatus {
  const modelDir = getModelDir(model);

  if (!fs.existsSync(modelDir)) {
    return 'not_installed';
  }

  // Check all required files exist
  for (const file of model.files) {
    const filePath = path.join(modelDir, file.name);
    if (!fs.existsSync(filePath)) {
      return 'not_installed';
    }
  }

  return 'ready';
}

/**
 * Get status of all files for a model
 */
export function getModelFileStatus(
  model: TaggerModel,
): { name: string; exists: boolean; size: number }[] {
  const modelDir = getModelDir(model);

  return model.files.map((file) => {
    const filePath = path.join(modelDir, file.name);
    const exists = fs.existsSync(filePath);
    let size = 0;

    if (exists) {
      try {
        const stats = fs.statSync(filePath);
        size = stats.size;
      } catch {
        // Ignore stat errors
      }
    }

    return { name: file.name, exists, size };
  });
}

/**
 * Ensure the model directory exists
 */
export function ensureModelDir(model: TaggerModel): void {
  const modelDir = getModelDir(model);
  fs.mkdirSync(modelDir, { recursive: true });
}

/**
 * Download a model from HuggingFace
 * Returns an async generator that yields progress updates
 */
export async function* downloadModel(
  model: TaggerModel,
  signal?: AbortSignal,
): AsyncGenerator<DownloadProgress> {
  ensureModelDir(model);
  const modelDir = getModelDir(model);

  const totalBytes = model.files.reduce((sum, f) => sum + f.size, 0);
  let bytesDownloaded = 0;

  for (const file of model.files) {
    const filePath = path.join(modelDir, file.name);

    // Skip if file already exists with correct size
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size === file.size || file.size === 0) {
          bytesDownloaded += stats.size;
          yield {
            modelId: model.id,
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
    const url = `https://huggingface.co/${model.repoId}/resolve/main/${file.name}`;

    yield {
      modelId: model.id,
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

        // Yield progress every ~1MB or so
        if (fileBytes % (1024 * 1024) < value.length) {
          yield {
            modelId: model.id,
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
        modelId: model.id,
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
    modelId: model.id,
    status: 'ready',
    bytesDownloaded: totalBytes,
    totalBytes,
  };
}

/**
 * Delete a downloaded model
 */
export function deleteModel(model: TaggerModel): void {
  const modelDir = getModelDir(model);

  if (fs.existsSync(modelDir)) {
    fs.rmSync(modelDir, { recursive: true, force: true });
  }
}

/**
 * Get list of all installed models
 */
export function getInstalledModels(
  allModels: TaggerModel[],
): { model: TaggerModel; status: ModelStatus }[] {
  return allModels.map((model) => ({
    model,
    status: checkModelStatus(model),
  }));
}
