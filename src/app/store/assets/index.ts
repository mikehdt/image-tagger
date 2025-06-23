// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { setupExtraReducers } from './extraReducers';
import { coreReducers } from './reducers';
import { ImageAssets, IoState } from './types';

const initialState: ImageAssets = {
  ioState: IoState.INITIAL,
  ioMessage: undefined,
  images: [],
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: coreReducers,
  extraReducers: setupExtraReducers,
  // Simple property accessors defined inline, complex selectors still in selectors.ts
  selectors: {
    selectIoState: (state) => state.ioState,
    selectIoMessage: (state) => state.ioMessage,
    selectAllImages: (state) => state.images,
    selectImageCount: (state) => state.images.length,
    selectSaveProgress: (state) => state.saveProgress,
    selectLoadProgress: (state) => state.loadProgress,
  },
});

// Main exports for slice
export const { reducer: assetsReducer } = assetsSlice;
export const {
  addTag,
  editTag,
  deleteTag,
  reorderTags,
  resetTags,
  markFilterTagsToDelete,
} = assetsSlice.actions;

// Export the selectors from the slice
export const {
  selectIoState,
  selectIoMessage,
  selectAllImages,
  selectImageCount,
  selectSaveProgress,
  selectLoadProgress,
} = assetsSlice.selectors;

// Main exports for assets module
export * from './actions';
export * from './selectors';
export * from './types';
export * from './utils';
