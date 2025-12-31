/**
 * Auto-tagger Redux slice
 * Manages model availability, download state, and tagging configuration
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type {
  AutoTaggerState,
  DownloadProgress,
  ModelInfo,
  ProviderInfo,
} from './types';

const initialState: AutoTaggerState = {
  isInitialised: false,
  isLoading: false,
  providers: [],
  models: [],
  selectedModelId: null,
  downloadProgress: null,
  isSetupModalOpen: false,
  error: null,
};

const autoTaggerSlice = createSlice({
  name: 'autoTagger',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set models and providers from API response
    setModelsAndProviders: (
      state,
      action: PayloadAction<{
        providers: ProviderInfo[];
        models: ModelInfo[];
      }>,
    ) => {
      state.providers = action.payload.providers;
      state.models = action.payload.models;
      state.isInitialised = true;
      state.isLoading = false;
      state.error = null;

      // Auto-select a ready model if none selected
      if (!state.selectedModelId) {
        const readyModel = action.payload.models.find(
          (m) => m.status === 'ready',
        );
        if (readyModel) {
          state.selectedModelId = readyModel.id;
        }
      }
    },

    // Update a single model's status
    updateModelStatus: (
      state,
      action: PayloadAction<{
        modelId: string;
        status: ModelInfo['status'];
      }>,
    ) => {
      const model = state.models.find((m) => m.id === action.payload.modelId);
      if (model) {
        model.status = action.payload.status;
      }
    },

    // Set selected model for tagging
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModelId = action.payload;
    },

    // Start download
    startDownload: (state, action: PayloadAction<string>) => {
      state.downloadProgress = {
        modelId: action.payload,
        bytesDownloaded: 0,
        totalBytes: 0,
      };
      const model = state.models.find((m) => m.id === action.payload);
      if (model) {
        model.status = 'downloading';
      }
    },

    // Update download progress
    updateDownloadProgress: (
      state,
      action: PayloadAction<DownloadProgress>,
    ) => {
      state.downloadProgress = action.payload;
    },

    // Download completed successfully
    downloadComplete: (state, action: PayloadAction<string>) => {
      state.downloadProgress = null;
      const model = state.models.find((m) => m.id === action.payload);
      if (model) {
        model.status = 'ready';
      }
      // Auto-select the newly downloaded model
      state.selectedModelId = action.payload;
    },

    // Download failed
    downloadFailed: (
      state,
      action: PayloadAction<{ modelId: string; error: string }>,
    ) => {
      state.downloadProgress = null;
      const model = state.models.find((m) => m.id === action.payload.modelId);
      if (model) {
        model.status = 'error';
      }
      state.error = action.payload.error;
    },

    // Clear download state (e.g., after cancel)
    clearDownload: (state) => {
      if (state.downloadProgress) {
        const model = state.models.find(
          (m) => m.id === state.downloadProgress?.modelId,
        );
        if (model) {
          model.status = 'not_installed';
        }
      }
      state.downloadProgress = null;
    },

    // Open/close setup modal
    openSetupModal: (state) => {
      state.isSetupModalOpen = true;
    },
    closeSetupModal: (state) => {
      state.isSetupModalOpen = false;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  selectors: {
    selectIsInitialised: (state) => state.isInitialised,
    selectIsLoading: (state) => state.isLoading,
    selectProviders: (state) => state.providers,
    selectModels: (state) => state.models,
    selectSelectedModelId: (state) => state.selectedModelId,
    selectDownloadProgress: (state) => state.downloadProgress,
    selectIsSetupModalOpen: (state) => state.isSetupModalOpen,
    selectError: (state) => state.error,

    // Derived selectors
    selectIsDownloading: (state) => state.downloadProgress !== null,
    selectHasReadyModel: (state) =>
      state.models.some((m) => m.status === 'ready'),
    selectReadyModels: (state) =>
      state.models.filter((m) => m.status === 'ready'),
    selectSelectedModel: (state) =>
      state.models.find((m) => m.id === state.selectedModelId) || null,
  },
});

// Export reducer
export const { reducer: autoTaggerReducer } = autoTaggerSlice;

// Export actions
export const {
  setLoading,
  setModelsAndProviders,
  updateModelStatus,
  setSelectedModel,
  startDownload,
  updateDownloadProgress,
  downloadComplete,
  downloadFailed,
  clearDownload,
  openSetupModal,
  closeSetupModal,
  setError,
  clearError,
} = autoTaggerSlice.actions;

// Export selectors
export const {
  selectIsInitialised,
  selectIsLoading,
  selectProviders,
  selectModels,
  selectSelectedModelId,
  selectDownloadProgress,
  selectIsSetupModalOpen,
  selectError,
  selectIsDownloading,
  selectHasReadyModel,
  selectReadyModels,
  selectSelectedModel,
} = autoTaggerSlice.selectors;

// Export types
export * from './types';
