import type { SidecarStatus } from '@/app/services/training/types';

/**
 * Training infrastructure state.
 * Job tracking has moved to the unified jobs slice (store/jobs).
 * This slice retains only sidecar process and WebSocket state.
 */
export type TrainingState = {
  /** Sidecar process status */
  sidecarStatus: SidecarStatus;
  sidecarError: string | null;

  /** WebSocket connection state */
  wsConnected: boolean;
};
