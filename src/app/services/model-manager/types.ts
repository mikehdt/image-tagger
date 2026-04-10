/**
 * Unified types for the model manager service.
 * Supports downloading and tracking models across features
 * (auto-tagger, training, future generation).
 */

import type { ModelArchitecture, ModelComponentType } from '../training/models';

/** Which feature a downloadable model belongs to */
export type ModelFeature = 'auto-tagger' | 'training';

/** A file within a downloadable model */
export type ModelFile = {
  name: string;
  /** Expected file size in bytes (0 = unknown/skip size check) */
  size: number;
};

/**
 * A model (or model component) that can be downloaded from HuggingFace.
 *
 * This generalises the auto-tagger's `TaggerModel` to support training
 * base models, shared components (T5-XXL, CLIP-L, etc.), and future
 * generation models.
 */
export type DownloadableModel = {
  id: string;
  name: string;
  /** HuggingFace repository ID (e.g. "black-forest-labs/FLUX.1-dev") */
  repoId: string;
  /** Files to download from the repo */
  files: ModelFile[];
  description?: string;

  /** Which feature area this model serves */
  feature: ModelFeature;
  /** Model architecture (for training/generation models) */
  architecture?: ModelArchitecture;
  /** What role this download plays in a training setup */
  componentType?: ModelComponentType;

  /**
   * Identifier for shared components (e.g. "t5-xxl", "clip-l", "flux-ae").
   * When set, this model is deduplicated: downloading it once makes it
   * available for all models that list it in `dependencies`.
   */
  sharedId?: string;

  /**
   * Shared component IDs this model depends on.
   * e.g. a Flux checkpoint depends on ["t5-xxl", "clip-l", "flux-ae"].
   */
  dependencies?: string[];

  /** VRAM estimate in GB (for display purposes) */
  vramEstimate?: number;
  /** Whether this is the recommended/default model in its group */
  isDefault?: boolean;

  /**
   * Alternative quantisation/precision variants.
   * The main `files` array is the default (usually fp16/bf16).
   * Each variant overrides `files` and optionally `repoId`.
   */
  variants?: ModelVariant[];
};

export type ModelVariant = {
  id: string;
  label: string;
  description?: string;
  files: ModelFile[];
  /** Override the repo if the variant lives in a different repo */
  repoId?: string;
};

export type ModelStatus =
  | 'not_installed'
  | 'downloading'
  | 'ready'
  | 'partial'
  | 'error'
  | 'checking';

export type DownloadProgress = {
  downloadId: string;
  modelId: string;
  status: ModelStatus;
  currentFile?: string;
  bytesDownloaded: number;
  totalBytes: number;
  error?: string;
};

/**
 * Sidecar JSON file written next to downloaded models.
 * Enables architecture-aware scanning without constraining folder structure.
 */
export type ModelSidecar = {
  name: string;
  architecture: ModelArchitecture;
  componentType?: ModelComponentType;
  source: string;
  downloadedAt: string;
};
