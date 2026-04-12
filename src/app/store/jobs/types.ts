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

export type JobType = 'training' | 'download' | 'tagging';

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
    /** 1-based index of the file currently being processed. */
    fileIndex?: number;
    /** Total number of files in this download. */
    totalFiles?: number;
  } | null;
};

export type TaggingProgress = {
  current: number;
  total: number;
  currentFileId?: string;
};

export type TaggingSummary = {
  imagesProcessed: number;
  imagesWithNewTags: number;
  totalTagsFound: number;
};

export type TaggingJob = JobBase & {
  type: 'tagging';
  /** Project folder name (slug from URL) — used for navigation */
  projectFolderName: string;
  /** Project display name — may differ from folder name */
  projectName: string;
  modelName: string;
  progress: TaggingProgress | null;
  summary: TaggingSummary | null;
};

export type Job = TrainingJob | DownloadJob | TaggingJob;

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export type JobsState = {
  /** All jobs keyed by ID */
  jobs: Record<string, Job>;
  /** Activity panel visibility */
  panelOpen: boolean;
};
