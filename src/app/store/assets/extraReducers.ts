// Extra reducers for handling async thunk actions
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import { loadAssets, resetAllTags, saveAllAssets, saveAssets } from './actions';
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
  });

  builder.addCase(saveAllAssets.fulfilled, (state, action) => {
    state.ioState = IoState.COMPLETE;
    // We don't need to update the state here as each individual saveAsset action
    // has already updated each image's state
    if (action.payload.savedCount > 0) {
      state.ioMessage = `Successfully saved ${action.payload.savedCount} assets`;
    } else {
      state.ioMessage = 'No assets needed saving';
    }

    if (action.payload.errorCount) {
      state.ioMessage += `, ${action.payload.errorCount} errors`;
    }
  });

  builder.addCase(saveAllAssets.rejected, (state, action) => {
    state.ioState = IoState.ERROR;
    state.ioMessage = `Failed to save all assets: ${action.error.message}`;
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
};
