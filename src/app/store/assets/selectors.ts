// Complex selectors for assets slice
import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';

// Custom selector to check if any assets have scaled dimensions (different from bucket)
export const selectHasScaledAssets = createSelector(
  [selectAllImages],
  (images) => {
    // Check if any asset has dimensions different from bucket dimensions
    return images.some((asset: ImageAsset) => {
      return (
        asset.dimensions.width !== asset.bucket.width ||
        asset.dimensions.height !== asset.bucket.height
      );
    });
  },
);

import { composeDimensions } from '../../utils/helpers';
import type { RootState } from '../';
import { selectAllImages } from '.';
import { ImageAsset, KeyedCountList, TagState } from './types';
import { hasState } from './utils';

// Derived selectors
export const selectOrderedTagsWithStatus = createSelector(
  // Input selectors
  [selectAllImages, (_, fileId: string) => fileId],
  // Result function
  (images, fileId) => {
    const selectedImage = images.find(
      (item: { fileId: string }) => item.fileId === fileId,
    );

    if (!selectedImage) return [];

    // Create an array of objects with tag name and status
    // This preserves the order from tagList
    return selectedImage.tagList.map((tagName: string) => ({
      name: tagName,
      status: selectedImage.tagStatus[tagName] || TagState.SAVED,
    }));
  },
);

export const selectImageSizes = createSelector([selectAllImages], (images) => {
  if (!images.length) return {};

  // Group by dimension
  const dimensionGroups: Record<string, ImageAsset[]> = {};
  for (const item of images) {
    const dimension = composeDimensions(item.dimensions);
    dimensionGroups[dimension] = dimensionGroups[dimension] || [];
    dimensionGroups[dimension].push(item);
  }

  // Create count map
  return Object.fromEntries(
    Object.entries(dimensionGroups).map(([dim, assets]) => [
      dim,
      assets.length,
    ]),
  );
});

export const selectAllTags = createSelector(
  [selectAllImages],
  (imageAssets) => {
    if (!imageAssets?.length) return {};

    const tagCounts: KeyedCountList = {};

    // Process all images and count tags
    for (const asset of imageAssets) {
      for (const tag of asset.tagList) {
        // Only count tags that aren't marked for deletion
        if (!hasState(asset.tagStatus[tag], TagState.TO_DELETE)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    return tagCounts;
  },
);

// Custom selector to check if any assets have modified tags
export const selectHasModifiedAssets = createSelector(
  [selectAllImages],
  (images) => {
    // Check if any asset has tags that aren't in the SAVED state
    return images.some((asset: ImageAsset) =>
      asset.tagList.some(
        (tag: string) => !hasState(asset.tagStatus[tag], TagState.SAVED),
      ),
    );
  },
);

// Custom selector to check if any assets have no persisted tags
export const selectHasTaglessAssets = createSelector(
  [selectAllImages],
  (images) => {
    // Check if any asset has no persisted tags (only TO_ADD or TO_DELETE tags are allowed)
    const taglessAssets = images.filter((asset: ImageAsset) => {
      const persistedTags = asset.tagList.filter(
        (tag: string) =>
          !hasState(asset.tagStatus[tag], TagState.TO_DELETE) &&
          !hasState(asset.tagStatus[tag], TagState.TO_ADD),
      );
      return persistedTags.length === 0;
    });

    return taglessAssets.length > 0;
  },
);

// Using selectSaveProgress and selectLoadProgress from the slice

export const selectAllExtensions = createSelector(
  [selectAllImages],
  (images) => {
    if (!images.length) return {};

    // Group by file extension
    const extensionCounts: KeyedCountList = {};
    for (const item of images) {
      const extension = item.fileExtension.toLowerCase();
      extensionCounts[extension] = (extensionCounts[extension] || 0) + 1;
    }

    return extensionCounts;
  },
);

// Combined selector to get filtered assets based on current filter state
export const selectFilteredAssets = createSelector(
  [
    selectAllImages,
    (state: RootState) => state.filters.filterTags,
    (state: RootState) => state.filters.filterSizes,
    (state: RootState) => state.filters.filterBuckets,
    (state: RootState) => state.filters.filterExtensions,
    (state: RootState) => state.filters.filterMode,
    (state: RootState) => state.filters.showModified,
    (state: RootState) => state.filters.searchQuery,
    (state: RootState) => state.selection.selectedAssets,
    (state: RootState) => state.assets.sortType,
    (state: RootState) => state.assets.sortDirection,
  ],
  (
    assets,
    filterTags,
    filterSizes,
    filterBuckets,
    filterExtensions,
    filterMode,
    showModified,
    searchQuery,
    selectedAssets,
    sortType,
    sortDirection,
  ) => {
    return applyFilters({
      assets,
      filterTags,
      filterSizes,
      filterBuckets,
      filterExtensions,
      filterMode,
      showModified,
      searchQuery,
      selectedAssets,
      sortType,
      sortDirection,
    });
  },
);
