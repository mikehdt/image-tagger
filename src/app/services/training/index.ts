// Public API for the training service.
// Only client-safe exports here — no server-only code (sidecar-manager, config-manager).

export type {
  SidecarStatus,
  TrainingDataset,
  TrainingHyperparameters,
  TrainingJobConfig,
  TrainingJobStatus,
  TrainingProgress,
  TrainingProvider,
  TrainingSettings,
} from './types';
