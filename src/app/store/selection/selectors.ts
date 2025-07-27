import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../';

// Basic selectors
export const selectSelectedAssets = (state: RootState) =>
  state.selection.selectedAssets;

// Optimized selector for checking if a specific asset is selected
// This avoids creating new selector instances per asset
export const selectAssetIsSelected = createSelector(
  [selectSelectedAssets, (_, assetId: string) => assetId],
  (selectedAssets, assetId) => selectedAssets.includes(assetId),
);

export const selectSelectedAssetsCount = createSelector(
  [selectSelectedAssets],
  (selectedAssets) => selectedAssets.length,
);
