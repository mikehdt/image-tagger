/**
 * Types for the unified jobs slice.
 *
 * Every long-running operation (training, download, future generation)
 * is a "job" with typed progress. The activity panel renders all jobs.
 */

import type {
  TrainingJobConfig,
  TrainingProgress,
} from '@/app/services/training/types';

// ---------------------------------------------------------------------------
// Job status (shared across all job types)
// ---------------------------------------------------------------------------

export type JobStatus =
  | 'pending'
  | 'preparing'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'interrupted';

// ---------------------------------------------------------------------------
// Job type discriminator
// ---------------------------------------------------------------------------

export type JobType = 'training' | 'download';

// ---------------------------------------------------------------------------
// Per-type job shapes
// ---------------------------------------------------------------------------

type JobBase = {
  id: string;
  type: JobType;
  status: JobStatus;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
};

export type TrainingJob = JobBase & {
  type: 'training';
  config: TrainingJobConfig;
  progress: TrainingProgress | null;
};

export type DownloadJob = JobBase & {
  type: 'download';
  modelId: string;
  modelName: string;
  targetDir: string;
  progress: {
    bytesDownloaded: number;
    totalBytes: number;
    currentFile?: string;
  } | null;
};

export type Job = TrainingJob | DownloadJob;

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export type JobsState = {
  /** All jobs keyed by ID */
  jobs: Record<string, Job>;
  /** Activity panel visibility */
  panelOpen: boolean;
};
