/**
 * Types for the model manager Redux slice.
 *
 * Tracks model inventory and installation status.
 * Active download operations are tracked in the jobs slice.
 */

import type { ModelStatus } from '@/app/services/model-manager/types';

export type ModelEntry = {
  modelId: string;
  status: ModelStatus;
  /** Resolved local path (null if not downloaded/located) */
  localPath: string | null;
  /** Total file size in bytes */
  sizeBytes: number;
};

export type ModelManagerState = {
  /** Known models and their on-disk status, keyed by model ID */
  models: Record<string, ModelEntry>;

  /** Resolved models folder path (from config.json or default) */
  modelsFolder: string | null;

  /** Whether the model manager modal is open */
  isModalOpen: boolean;

  /** Which tab to show when the modal opens */
  modalInitialTab?: 'auto-tagger' | 'training' | 'settings';
};
