// Complex selectors for assets slice
import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { composeDimensions } from '../../utils/helpers';
import type { RootState } from '../';
import { ImageAsset, KeyedCountList, TagState } from './types';
import { hasState } from './utils';

// Base selector that extracts all images from RootState
// Note: This is a local version to avoid circular dependency with index.ts
// External consumers should use the slice selector from the main exports
const selectAllImages = (state: RootState) => state.assets.images;

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

// Selector to analyze the TO_DELETE state of filter tags
export const selectFilterTagsDeleteState = createSelector(
  [selectAllImages, (state: RootState) => state.filters.filterTags],
  (images, filterTags) => {
    if (!filterTags.length || !images.length) {
      return {
        state: 'none',
        hasAllToDelete: false,
        hasSomeToDelete: false,
        hasMixed: false,
      };
    }

    let assetsWithAnyFilterTag = 0;
    let assetsWithAllFilterTagsToDelete = 0;
    let assetsWithSomeFilterTagsToDelete = 0;

    for (const asset of images) {
      // Check if this asset has any of the filter tags
      const assetFilterTags = filterTags.filter(
        (tag) => tag in asset.tagStatus,
      );

      if (assetFilterTags.length === 0) continue;

      assetsWithAnyFilterTag++;

      // Count how many of the filter tags are marked TO_DELETE
      const toDeleteCount = assetFilterTags.filter((tag) =>
        hasState(asset.tagStatus[tag], TagState.TO_DELETE),
      ).length;

      if (toDeleteCount === assetFilterTags.length) {
        assetsWithAllFilterTagsToDelete++;
      } else if (toDeleteCount > 0) {
        assetsWithSomeFilterTagsToDelete++;
      }
    }

    const hasAllToDelete =
      assetsWithAllFilterTagsToDelete === assetsWithAnyFilterTag &&
      assetsWithAnyFilterTag > 0;
    const hasSomeToDelete =
      assetsWithSomeFilterTagsToDelete > 0 ||
      (assetsWithAllFilterTagsToDelete > 0 &&
        assetsWithAllFilterTagsToDelete < assetsWithAnyFilterTag);
    const hasMixed = hasSomeToDelete && !hasAllToDelete;

    let state: 'none' | 'all' | 'mixed';
    if (hasAllToDelete) {
      state = 'all';
    } else if (hasSomeToDelete) {
      state = 'mixed';
    } else {
      state = 'none';
    }

    return {
      state,
      hasAllToDelete,
      hasSomeToDelete,
      hasMixed,
    };
  },
);

// Optimized selector for asset-specific tag counts
// Only recalculates counts for tags actually used by the specific asset
export const selectAssetTagCounts = createSelector(
  [selectAllImages, (_, assetId: string) => assetId],
  (imageAssets, assetId) => {
    const asset = imageAssets.find((img) => img.fileId === assetId);
    if (!asset || !imageAssets?.length) return {};

    const assetTagCounts: KeyedCountList = {};

    // Only calculate counts for tags that exist on this specific asset
    const assetTags = new Set(asset.tagList);

    // Process all images and count only the tags used by this asset
    for (const img of imageAssets) {
      for (const tag of img.tagList) {
        // Only count if this tag is used by the target asset and isn't marked for deletion
        if (
          assetTags.has(tag) &&
          !hasState(img.tagStatus[tag], TagState.TO_DELETE)
        ) {
          assetTagCounts[tag] = (assetTagCounts[tag] || 0) + 1;
        }
      }
    }

    return assetTagCounts;
  },
);
