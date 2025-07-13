// Extra reducers for handling async thunk actions
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import {
  clearLoadErrors,
  clearSaveErrors,
  completeAfterDelay,
  loadAllAssets,
  resetAllTags,
  saveAllAssets,
  saveAsset,
  updateLoadProgress,
  updateSaveProgress,
} from './actions';
import { ImageAssets, IoState } from './types';

export const setupExtraReducers = (
  builder: ActionReducerMapBuilder<ImageAssets>,
) => {
  // Loading
  builder.addCase(loadAllAssets.pending, (state, action) => {
    const maintainIoState = action.meta.arg?.maintainIoState ?? false;

    // Only change the IoState if not maintaining the current state
    if (!maintainIoState) {
      state.ioState = IoState.LOADING;
      state.ioMessage = 'Loading assets...';
    }

    // Initialize the load progress
    // (actual progress will be updated by the client-side code)
    state.loadProgress = {
      total: 0, // Start with 0 until we get the real count from the client
      completed: 0,
      failed: 0,
    };
  });

  builder.addCase(loadAllAssets.fulfilled, (state, action) => {
    // If we have progress data and it shows completion, transition to COMPLETING state first
    if (
      state.loadProgress &&
      state.loadProgress.total > 0 &&
      state.loadProgress.completed >= state.loadProgress.total
    ) {
      state.ioState = IoState.COMPLETING;
      state.ioMessage = undefined;
      state.images = action.payload;
      // Keep progress data briefly to show 100% completion
    } else {
      // If no progress tracking (e.g., small datasets), go directly to complete
      state.ioState = IoState.COMPLETE;
      state.ioMessage = undefined;
      state.images = action.payload;
      state.loadProgress = undefined;
    }
  });

  builder.addCase(loadAllAssets.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = action.error.message || 'Error loading assets';
    state.images = [];
    // Keep the progress information for error reporting
    // so users can see how far it got before failing
  });

  // Saving
  builder.addCase(saveAsset.pending, (state, action) => {
    const { arg } = action.meta;
    const fileId = typeof arg === 'string' ? arg : arg.fileId;

    const imageIndex = state.images.findIndex((item) => item.fileId === fileId);

    state.images[imageIndex].ioState = IoState.SAVING;
    state.ioState = IoState.SAVING;
    state.ioMessage = undefined;
  });

  builder.addCase(saveAsset.fulfilled, (state, action) => {
    state.ioState = IoState.COMPLETE;
    state.ioMessage = undefined;

    // Use the index from the payload directly
    const { assetIndex, tagList, tagStatus, savedTagList } = action.payload;

    state.images[assetIndex].ioState = IoState.COMPLETE;
    state.images[assetIndex].tagList = tagList;
    state.images[assetIndex].tagStatus = tagStatus;
    state.images[assetIndex].savedTagList = savedTagList;
  });

  builder.addCase(saveAsset.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = action.error.message;
  });

  // Save All Assets
  builder.addCase(saveAllAssets.pending, (state) => {
    state.ioState = IoState.SAVING;
    state.ioMessage = 'Saving all modified assets...';
    // Initialize the save progress
    state.saveProgress = {
      total: 0, // Will be set in the first updateProgress action
      completed: 0,
      failed: 0,
    };
  });

  builder.addCase(saveAllAssets.fulfilled, (state, action) => {
    // If we have progress data and it shows completion, transition to COMPLETING state first
    if (
      state.saveProgress &&
      state.saveProgress.total > 0 &&
      state.saveProgress.completed >= state.saveProgress.total
    ) {
      state.ioState = IoState.COMPLETING;
    } else {
      // If no progress tracking (e.g., small datasets), go directly to complete
      state.ioState = IoState.COMPLETE;
    }

    // Apply batch updates to assets if results are provided
    if (action.payload.results && action.payload.results.length > 0) {
      action.payload.results.forEach((result) => {
        const { assetIndex, tagList, tagStatus, savedTagList } = result;
        if (state.images[assetIndex]) {
          state.images[assetIndex].ioState = IoState.COMPLETE;
          state.images[assetIndex].tagList = tagList;
          state.images[assetIndex].tagStatus = tagStatus;
          state.images[assetIndex].savedTagList = savedTagList;
        }
      });
    }

    if (action.payload.savedCount > 0) {
      state.ioMessage = `Successfully saved ${action.payload.savedCount} assets`;
    } else {
      state.ioMessage = 'No assets needed saving';
    }

    if (action.payload.errorCount) {
      state.ioMessage += `, ${action.payload.errorCount} errors`;
    }

    // Don't clear progress yet if we're in COMPLETING state - let the completion action handle it
    if (state.ioState === IoState.COMPLETE) {
      state.saveProgress = undefined;
    }
  });

  builder.addCase(saveAllAssets.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = `Failed to save all assets: ${action.error.message}`;
    state.saveProgress = undefined;
  });

  // Reset All Tags
  builder.addCase(resetAllTags.pending, (state) => {
    state.ioState = IoState.LOADING;
    state.ioMessage = 'Canceling all tag changes...';
  });

  builder.addCase(resetAllTags.fulfilled, (state, action) => {
    state.ioState = IoState.COMPLETE;
    // Individual resetTags actions have already updated the state
    if (action.payload.resetCount > 0) {
      state.ioMessage = `Changes canceled for ${action.payload.resetCount} assets`;
    } else {
      state.ioMessage = 'No changes to cancel';
    }
  });

  builder.addCase(resetAllTags.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = `Failed to cancel all changes: ${action.error.message}`;
  });

  // Add the updateSaveProgress handler
  builder.addCase(updateSaveProgress, (state, action) => {
    state.saveProgress = action.payload;
  });

  // Add the updateLoadProgress handler
  builder.addCase(updateLoadProgress, (state, action) => {
    state.loadProgress = action.payload;
  });

  // Add handlers for clearing errors
  builder.addCase(clearLoadErrors, (state) => {
    if (state.loadProgress) {
      state.loadProgress.failed = 0;
      state.loadProgress.errors = undefined;
    }
  });

  builder.addCase(clearSaveErrors, (state) => {
    if (state.saveProgress) {
      state.saveProgress.failed = 0;
      state.saveProgress.errors = undefined;
    }
  });

  // Add completion delay handlers
  builder.addCase(completeAfterDelay.pending, () => {
    // State remains COMPLETING during the delay
  });

  builder.addCase(completeAfterDelay.fulfilled, (state) => {
    // Transition to final complete state and clear progress data
    state.ioState = IoState.COMPLETE;
    state.loadProgress = undefined;
    state.saveProgress = undefined;
  });

  builder.addCase(completeAfterDelay.rejected, (state) => {
    // Fallback to complete state if delay fails for any reason
    state.ioState = IoState.COMPLETE;
    state.loadProgress = undefined;
    state.saveProgress = undefined;
  });
};
