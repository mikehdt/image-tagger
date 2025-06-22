// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { setupExtraReducers } from './extraReducers';
import { coreReducers } from './reducers';
import { ImageAssets, IoState } from './types';

const initialState: ImageAssets = {
  ioState: IoState.UNINITIALIZED,
  ioMessage: undefined,
  images: [],
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: coreReducers,
  extraReducers: setupExtraReducers,
  // We're using the selectors from selectors.ts file instead of defining them here
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

// Main exports for assets module
export * from './actions';
export * from './selectors';
export * from './types';
export * from './utils';
