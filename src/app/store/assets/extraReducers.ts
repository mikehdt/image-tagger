// Extra reducers for handling async thunk actions
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import {
  loadAssets,
  resetAllTags,
  saveAllAssets,
  saveAssets,
  updateSaveProgress,
} from './actions';
import { ImageAssets, IoState } from './types';

export const setupExtraReducers = (
  builder: ActionReducerMapBuilder<ImageAssets>,
) => {
  // Loading
  builder.addCase(loadAssets.pending, (state) => {
    state.ioState = IoState.LOADING;
    state.ioMessage = undefined;
  });

  builder.addCase(loadAssets.fulfilled, (state, action) => {
    state.ioState = IoState.COMPLETE;
    state.ioMessage = undefined;
    state.images = action.payload;
  });

  builder.addCase(loadAssets.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = action.error.message;
    state.images = [];
  });

  // Saving
  builder.addCase(saveAssets.pending, (state, action) => {
    const { arg } = action.meta;

    const imageIndex = state.images.findIndex((item) => item.fileId === arg);

    state.images[imageIndex].ioState = IoState.SAVING;
    state.ioState = IoState.SAVING;
    state.ioMessage = undefined;
  });

  builder.addCase(saveAssets.fulfilled, (state, action) => {
    state.ioState = IoState.COMPLETE;
    state.ioMessage = undefined;

    // Use the index from the payload directly
    const { assetIndex, tagList, tagStatus, savedTagList } = action.payload;

    state.images[assetIndex].ioState = IoState.COMPLETE;
    state.images[assetIndex].tagList = tagList;
    state.images[assetIndex].tagStatus = tagStatus;
    state.images[assetIndex].savedTagList = savedTagList;
  });

  builder.addCase(saveAssets.rejected, (state, action) => {
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
    state.ioState = IoState.COMPLETE;

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

    // Clear the progress tracking
    state.saveProgress = undefined;
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
};
