import type {
  SidecarStatus,
  TrainingJobConfig,
  TrainingJobStatus,
  TrainingProgress,
} from '@/app/services/training/types';

export type TrainingState = {
  // Sidecar process status
  sidecarStatus: SidecarStatus;
  sidecarError: string | null;

  // Current/most recent job
  activeJobId: string | null;
  activeJobStatus: TrainingJobStatus | null;
  activeJobConfig: TrainingJobConfig | null;
  activeJobProgress: TrainingProgress | null;

  // WebSocket connection state
  wsConnected: boolean;
};
