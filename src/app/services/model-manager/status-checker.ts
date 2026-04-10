/**
 * Check whether a model's files are fully downloaded and ready.
 *
 * Server-only — do not import from client components.
 */

import fs from 'fs';
import path from 'path';

import type { ModelFile, ModelStatus } from './types';

/**
 * Check if all required files exist in `modelDir` with correct sizes.
 *
 * Returns:
 * - 'ready' if every file is present and matches its expected size
 * - 'partial' if some files exist but at least one has the wrong size
 *   (indicates an interrupted download)
 * - 'not_installed' if no files are present
 */
export function checkModelFiles(
  modelDir: string,
  files: ModelFile[],
): ModelStatus {
  if (!fs.existsSync(modelDir)) {
    return 'not_installed';
  }

  let anyExists = false;
  let allComplete = true;

  for (const file of files) {
    const filePath = path.join(modelDir, file.name);

    if (!fs.existsSync(filePath)) {
      allComplete = false;
      continue;
    }

    anyExists = true;

    // Validate file size (skip check if expected size is 0/unknown)
    if (file.size > 0) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size !== file.size) {
          allComplete = false;
        }
      } catch {
        allComplete = false;
      }
    }
  }

  if (allComplete && anyExists) return 'ready';
  if (anyExists) return 'partial';
  return 'not_installed';
}
