/**
 * Auto-tagger Redux slice
 *
 * Tracks model inventory and selection for the tagging UI. Download
 * state lives in the unified jobs slice — see `startModelDownload`
 * and `useDownloadActions` for the lifecycle.
 */

import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AutoTaggerState, ModelInfo, ProviderInfo } from './types';

const initialState: AutoTaggerState = {
  isInitialised: false,
  isLoading: false,
  providers: [],
  models: [],
  selectedModelId: null,
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

    // Update a single model's status (called by middleware when the
    // model-manager slice's setModelStatus fires).
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
    selectError: (state) => state.error,
  },
});

// Export reducer
export const { reducer: autoTaggerReducer } = autoTaggerSlice;

// Export actions
export const { setModelsAndProviders, setSelectedModel, updateModelStatus } =
  autoTaggerSlice.actions;

// Export basic selectors from slice
export const {
  selectIsInitialised,
  selectProviders,
  selectModels,
  selectSelectedModelId,
} = autoTaggerSlice.selectors;

// Memoized derived selectors (to avoid creating new arrays/objects on each call)
export const selectHasReadyModel = createSelector([selectModels], (models) =>
  models.some((m) => m.status === 'ready'),
);

export const selectReadyModels = createSelector([selectModels], (models) =>
  models.filter((m) => m.status === 'ready'),
);

// Export types
export * from './types';
