import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../';

// Basic selectors
export const selectSelectedAssets = (state: RootState) =>
  state.selection.selectedAssets;

// Derived selectors
export const selectHasSelectedAssets = createSelector(
  [selectSelectedAssets],
  (selectedAssets) => selectedAssets.length > 1,
);

export const selectAssetIsSelected = (assetId: string) =>
  createSelector([selectSelectedAssets], (selectedAssets) =>
    selectedAssets.includes(assetId),
  );

export const selectSelectedAssetsCount = createSelector(
  [selectSelectedAssets],
  (selectedAssets) => selectedAssets.length,
);
