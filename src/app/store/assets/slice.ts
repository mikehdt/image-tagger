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
  selectors: {
    // Selectors are now imported from selectors.ts
    // This is just to comply with the createSlice API
    selectIoState: (state) => state.ioState,
    selectAllImages: (state) => state.images,
    selectImageCount: (state) => state.images.length,
  },
});

export const { reducer: assetsReducer } = assetsSlice;
export const { addTag, editTag, deleteTag, reorderTags, resetTags } =
  assetsSlice.actions;
