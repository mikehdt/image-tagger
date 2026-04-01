import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type {
  SidecarStatus,
  TrainingJobConfig,
  TrainingJobStatus,
  TrainingProgress,
} from '@/app/services/training/types';

import type { RootState } from '../index';
import type { TrainingState } from './types';

const initialState: TrainingState = {
  sidecarStatus: 'stopped',
  sidecarError: null,
  activeJobId: null,
  activeJobStatus: null,
  activeJobConfig: null,
  activeJobProgress: null,
  wsConnected: false,
  panelOpen: false,
};

const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {
    setSidecarStatus: (
      state,
      action: PayloadAction<{
        status: SidecarStatus;
        error?: string | null;
      }>,
    ) => {
      state.sidecarStatus = action.payload.status;
      state.sidecarError = action.payload.error ?? null;
    },

    setActiveJob: (
      state,
      action: PayloadAction<{
        jobId: string;
        status: TrainingJobStatus;
        config: TrainingJobConfig;
      }>,
    ) => {
      state.activeJobId = action.payload.jobId;
      state.activeJobStatus = action.payload.status;
      state.activeJobConfig = action.payload.config;
      state.activeJobProgress = null;
    },

    updateProgress: (state, action: PayloadAction<TrainingProgress>) => {
      state.activeJobProgress = action.payload;
      state.activeJobStatus = action.payload.status;
    },

    clearJob: (state) => {
      state.activeJobId = null;
      state.activeJobStatus = null;
      state.activeJobConfig = null;
      state.activeJobProgress = null;
    },

    setWsConnected: (state, action: PayloadAction<boolean>) => {
      state.wsConnected = action.payload;
    },

    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },

    openPanel: (state) => {
      state.panelOpen = true;
    },

    closePanel: (state) => {
      state.panelOpen = false;
    },

    // Restore state from sidecar on reconnection (e.g., after tab reopen)
    restoreJobState: (
      state,
      action: PayloadAction<{
        jobId: string;
        status: TrainingJobStatus;
        config: TrainingJobConfig;
        progress: TrainingProgress | null;
      }>,
    ) => {
      state.activeJobId = action.payload.jobId;
      state.activeJobStatus = action.payload.status;
      state.activeJobConfig = action.payload.config;
      state.activeJobProgress = action.payload.progress;
    },
  },
});

export const {
  setSidecarStatus,
  setActiveJob,
  updateProgress,
  clearJob,
  setWsConnected,
  restoreJobState,
  togglePanel,
  openPanel,
  closePanel,
} = trainingSlice.actions;

export const trainingReducer = trainingSlice.reducer;

// --- Selectors ---

const selectTraining = (state: RootState) => state.training;

export const selectSidecarStatus = createSelector(
  selectTraining,
  (t) => t.sidecarStatus,
);

export const selectActiveJobId = createSelector(
  selectTraining,
  (t) => t.activeJobId,
);

export const selectActiveJobStatus = createSelector(
  selectTraining,
  (t) => t.activeJobStatus,
);

export const selectActiveJobConfig = createSelector(
  selectTraining,
  (t) => t.activeJobConfig,
);

export const selectActiveJobProgress = createSelector(
  selectTraining,
  (t) => t.activeJobProgress,
);

export const selectIsTraining = createSelector(
  selectTraining,
  (t) => t.activeJobStatus === 'training' || t.activeJobStatus === 'preparing',
);

export const selectWsConnected = createSelector(
  selectTraining,
  (t) => t.wsConnected,
);

export const selectPanelOpen = createSelector(
  selectTraining,
  (t) => t.panelOpen,
);
