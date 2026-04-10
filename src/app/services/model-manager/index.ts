/**
 * Model Manager — unified download and model tracking service.
 *
 * Client-safe exports only (types).
 * Server-only modules (download-engine, status-checker) must be
 * imported directly from their files.
 */

export type {
  DownloadableModel,
  DownloadProgress,
  ModelFeature,
  ModelFile,
  ModelSidecar,
  ModelStatus,
} from './types';
