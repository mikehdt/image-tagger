/**
 * Auto-tagger Model Manager
 *
 * Thin wrapper around the unified model-manager download engine.
 * Computes auto-tagger-specific storage paths and delegates.
 */

import path from 'path';

import { downloadModelFiles } from '../model-manager/download-engine';
import { checkModelFiles } from '../model-manager/status-checker';
import type { DownloadProgress, ModelStatus } from '../model-manager/types';
import type { TaggerModel } from './types';

// Models are stored in a .auto-tagger directory in the project root
const MODELS_DIR = path.join(process.cwd(), '.auto-tagger', 'models');

/**
 * Get the local directory path for a model
 */
function getModelDir(model: TaggerModel): string {
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
  return checkModelFiles(getModelDir(model), model.files);
}

/**
 * Download a model from HuggingFace.
 * Returns an async generator that yields progress updates.
 */
export async function* downloadModel(
  model: TaggerModel,
  opts?: { hfToken?: string | null; signal?: AbortSignal },
): AsyncGenerator<DownloadProgress> {
  yield* downloadModelFiles(
    {
      modelId: model.id,
      downloadId: model.id, // auto-tagger uses modelId as downloadId
      repoId: model.repoId,
      files: model.files,
      targetDir: getModelDir(model),
      hfToken: opts?.hfToken,
    },
    opts?.signal,
  );
}
