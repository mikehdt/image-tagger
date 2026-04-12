/**
 * Check whether a model's files are fully downloaded and ready.
 *
 * Server-only — do not import from client components.
 */

import fs from 'fs';
import path from 'path';

import type { ModelFile, ModelStatus } from './types';

type Manifest = {
  files: { name: string; size: number }[];
};

const MANIFEST_FILE = 'manifest.json';
// Tolerance for size estimate mismatch when no manifest exists (5%).
// GGUF downloads from HF can differ meaningfully from hand-declared sizes.
const SIZE_TOLERANCE = 0.05;

/** Load the manifest.json written by the download engine, if present. */
function loadManifest(modelDir: string): Manifest | null {
  const manifestPath = path.join(modelDir, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as Manifest;
    if (!parsed.files || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Write a manifest from actual on-disk sizes. Self-heals for pre-manifest downloads. */
function writeManifest(modelDir: string, files: ModelFile[]): void {
  try {
    const manifest: Manifest = { files: [] };
    for (const file of files) {
      const filePath = path.join(modelDir, file.name);
      if (fs.existsSync(filePath)) {
        manifest.files.push({
          name: file.name,
          size: fs.statSync(filePath).size,
        });
      }
    }
    fs.writeFileSync(
      path.join(modelDir, MANIFEST_FILE),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
  } catch {
    // best-effort
  }
}

/**
 * Check if all required files exist in `modelDir` with correct sizes.
 *
 * Priority order for size comparison:
 * 1. manifest.json (actual sizes recorded at download completion)
 * 2. ModelFile.size from the registry (hand-declared, may be an estimate)
 * 3. If neither tells us an exact size, existence is enough.
 *
 * Returns:
 * - 'ready' if every file is present and matches its expected size
 * - 'partial' if some files exist but at least one has the wrong size
 * - 'not_installed' if no files are present
 */
export function checkModelFiles(
  modelDir: string,
  files: ModelFile[],
): ModelStatus {
  if (!fs.existsSync(modelDir)) {
    return 'not_installed';
  }

  const manifest = loadManifest(modelDir);

  let anyExists = false;
  let allComplete = true;
  // Track whether we inferred "complete" from the tolerance path so we can
  // self-heal old downloads by writing a manifest retroactively.
  let inferredComplete = false;

  for (const file of files) {
    const filePath = path.join(modelDir, file.name);

    if (!fs.existsSync(filePath)) {
      allComplete = false;
      continue;
    }

    anyExists = true;

    // If we have a manifest, trust it absolutely (exact byte match).
    const manifestEntry = manifest?.files.find((f) => f.name === file.name);
    if (manifestEntry) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size !== manifestEntry.size) allComplete = false;
      } catch {
        allComplete = false;
      }
      continue;
    }

    // No manifest — fall back to the registry-declared size with tolerance.
    // Declared sizes for GGUF/HF downloads are often estimates, so we allow
    // a small delta rather than hard-failing.
    if (file.size > 0) {
      try {
        const stats = fs.statSync(filePath);
        const delta = Math.abs(stats.size - file.size);
        const within = delta / file.size <= SIZE_TOLERANCE;
        if (!within) {
          allComplete = false;
        } else {
          inferredComplete = true;
        }
      } catch {
        allComplete = false;
      }
    }
  }

  if (allComplete && anyExists) {
    // Self-heal: if we passed the check via tolerance, persist a manifest
    // so future checks are exact and don't depend on the estimate.
    if (inferredComplete && !manifest) {
      writeManifest(modelDir, files);
    }
    return 'ready';
  }
  if (anyExists) return 'partial';
  return 'not_installed';
}
