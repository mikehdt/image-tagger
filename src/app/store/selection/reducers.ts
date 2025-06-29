import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { initialState } from './types';

export const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    toggleAssetSelection: (state, action: PayloadAction<string>) => {
      const assetId = action.payload;
      const index = state.selectedAssets.indexOf(assetId);

      if (index !== -1) {
        // Asset is already selected, so remove it
        state.selectedAssets.splice(index, 1);
      } else {
        // Asset is not selected, so add it
        state.selectedAssets.push(assetId);
      }
    },
    selectAsset: (state, action: PayloadAction<string>) => {
      const assetId = action.payload;
      if (!state.selectedAssets.includes(assetId)) {
        state.selectedAssets.push(assetId);
      }
    },
    deselectAsset: (state, action: PayloadAction<string>) => {
      const assetId = action.payload;
      const index = state.selectedAssets.indexOf(assetId);
      if (index !== -1) {
        state.selectedAssets.splice(index, 1);
      }
    },
    selectMultipleAssets: (state, action: PayloadAction<string[]>) => {
      const uniqueAssets = [
        ...new Set([...state.selectedAssets, ...action.payload]),
      ];
      state.selectedAssets = uniqueAssets;
    },
    clearSelection: (state) => {
      state.selectedAssets = [];
    },
  },
});

export const {
  toggleAssetSelection,
  selectAsset,
  deselectAsset,
  selectMultipleAssets,
  clearSelection,
} = selectionSlice.actions;

export default selectionSlice.reducer;
