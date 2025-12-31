// Complex selectors for assets slice
import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { composeDimensions } from '../../utils/helpers';
import { wrapSelector } from '../../utils/selector-perf';
import type { RootState } from '../';
import { TagSortDirection, TagSortType } from '../project';
import { ImageAsset, KeyedCountList, TagState } from './types';
import { buildTagCountsCache, hasState } from './utils';

// Base selector that extracts all images from RootState
// Note: This is a local version to avoid circular dependency with index.ts
// External consumers should use the slice selector from the main exports
const selectAllImages = (state: RootState) => state.assets.images;
const selectTagCountsCache = (state: RootState) => state.assets.tagCountsCache;

// Selector that returns cached tag counts, rebuilding if cache is null
// This is the core of the caching strategy - counts are computed once and shared
// Exported for direct use by components that need global tag counts
export const selectTagCounts = wrapSelector(
  'selectTagCounts',
  createSelector([selectAllImages, selectTagCountsCache], (images, cache) => {
    // If cache exists, use it; otherwise rebuild
    // Note: The rebuilt cache is returned but not stored in state here
    // The cache is populated on load and invalidated on mutations
    if (cache !== null) {
      return cache;
    }
    return buildTagCountsCache(images);
  }),
);

// Derived selectors

// Optimised selector to check if a specific asset has modified tags
// Returns boolean - only re-renders when modified state actually changes
export const selectAssetHasModifiedTags = createSelector(
  [selectAllImages, (_, assetId: string) => assetId],
  (images, assetId) => {
    const asset = images.find((img) => img.fileId === assetId);
    if (!asset || asset.tagList.length === 0) return false;

    // Check if any tag is not in SAVED state
    return asset.tagList.some(
      (tagName: string) => !hasState(asset.tagStatus[tagName], TagState.SAVED),
    );
  },
);

// Selectors for tag sorting from project store
const selectTagSortType = (state: RootState) =>
  state.project.config.tagSortType;
const selectTagSortDirection = (state: RootState) =>
  state.project.config.tagSortDirection;

export const selectOrderedTagsWithStatus = createSelector(
  // Input selectors
  [
    selectAllImages,
    selectTagCounts,
    selectTagSortType,
    selectTagSortDirection,
    (_, fileId: string) => fileId,
  ],
  // Result function
  (images, tagCounts, sortType, sortDirection, fileId) => {
    const selectedImage = images.find(
      (item: { fileId: string }) => item.fileId === fileId,
    );

    if (!selectedImage) return [];

    // Create an array of objects with tag name and status
    const tagsWithStatus = selectedImage.tagList.map((tagName: string) => ({
      name: tagName,
      status: selectedImage.tagStatus[tagName] || TagState.SAVED,
    }));

    // Apply sorting based on sort type
    if (sortType === TagSortType.SORTABLE) {
      // Saved/drag order - already in correct order from tagList
      return tagsWithStatus;
    }

    // Sort the tags
    const sorted = [...tagsWithStatus].sort((a, b) => {
      let comparison = 0;

      if (sortType === TagSortType.ALPHABETICAL) {
        comparison = a.name.localeCompare(b.name);
      } else if (sortType === TagSortType.FREQUENCY) {
        const countA = tagCounts[a.name] || 0;
        const countB = tagCounts[b.name] || 0;
        comparison = countA - countB;
      }

      // Apply direction
      return sortDirection === TagSortDirection.ASC ? comparison : -comparison;
    });

    return sorted;
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

export const selectAllTags = wrapSelector(
  'selectAllTags',
  createSelector([selectAllImages], (imageAssets) => {
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
  }),
);

// Custom selector to check if any assets have modified tags
export const selectHasModifiedAssets = wrapSelector(
  'selectHasModifiedAssets',
  createSelector([selectAllImages], (images) => {
    // Check if any asset has tags that aren't in the SAVED state
    return images.some((asset: ImageAsset) =>
      asset.tagList.some(
        (tag: string) => !hasState(asset.tagStatus[tag], TagState.SAVED),
      ),
    );
  }),
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
export const selectFilteredAssets = wrapSelector(
  'selectFilteredAssets',
  createSelector(
    [
      selectAllImages,
      (state: RootState) => state.filters.filterTags,
      (state: RootState) => state.filters.filterSizes,
      (state: RootState) => state.filters.filterBuckets,
      (state: RootState) => state.filters.filterExtensions,
      (state: RootState) => state.filters.filenamePatterns,
      (state: RootState) => state.filters.filterMode,
      (state: RootState) => state.filters.showModified,
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
      filenamePatterns,
      filterMode,
      showModified,
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
        filenamePatterns,
        filterMode,
        showModified,
        selectedAssets,
        sortType,
        sortDirection,
      });
    },
  ),
);

// Selector to analyze the TO_DELETE state of filter tags
// Optimized to avoid creating intermediate arrays per asset
export const selectFilterTagsDeleteState = createSelector(
  [selectAllImages, (state: RootState) => state.filters.filterTags],
  (images, filterTags) => {
    if (!filterTags.length || !images.length) {
      return {
        state: 'none' as const,
        hasAllToDelete: false,
        hasSomeToDelete: false,
        hasMixed: false,
      };
    }

    // Pre-convert filterTags to a Set for O(1) lookups
    const filterTagsSet = new Set(filterTags);

    let assetsWithAnyFilterTag = 0;
    let assetsWithAllFilterTagsToDelete = 0;
    let assetsWithSomeFilterTagsToDelete = 0;

    for (const asset of images) {
      // Count filter tags on this asset and how many are TO_DELETE
      // Avoids creating intermediate arrays
      let filterTagCount = 0;
      let toDeleteCount = 0;

      for (const tag of asset.tagList) {
        if (filterTagsSet.has(tag)) {
          filterTagCount++;
          if (hasState(asset.tagStatus[tag], TagState.TO_DELETE)) {
            toDeleteCount++;
          }
        }
      }

      if (filterTagCount === 0) continue;

      assetsWithAnyFilterTag++;

      if (toDeleteCount === filterTagCount) {
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

// Optimized selector for filtered asset count only
// Avoids returning full array when only count is needed
export const selectFilteredAssetsCount = createSelector(
  [selectFilteredAssets],
  (filteredAssets) => filteredAssets.length,
);

// Selector to count how many files match each filename pattern
// Returns a map of pattern -> count
export const selectFilenamePatternCounts = createSelector(
  [selectAllImages, (state: RootState) => state.filters.filenamePatterns],
  (images, patterns): Record<string, number> => {
    if (!patterns || patterns.length === 0) return {};

    const counts: Record<string, number> = {};

    for (const pattern of patterns) {
      counts[pattern] = 0;
    }

    for (const image of images) {
      const lowerFileId = image.fileId.toLowerCase();
      for (const pattern of patterns) {
        if (lowerFileId.includes(pattern)) {
          counts[pattern]++;
        }
      }
    }

    return counts;
  },
);

// Cached Set of filter tags - avoids recreating the Set on every per-asset call
const selectFilterTagsSet = createSelector(
  [(state: RootState) => state.filters.filterTags],
  (filterTags): Set<string> => new Set(filterTags),
);

// Optimized selector for asset-specific highlighted tags
// Returns a Set of tag names that are both on this asset AND in the filter
// Only triggers re-renders when the intersection changes, not when unrelated filters change
export const selectAssetHighlightedTags = wrapSelector(
  'selectAssetHighlightedTags',
  createSelector(
    [selectAllImages, selectFilterTagsSet, (_, assetId: string) => assetId],
    (imageAssets, filterTagsSet, assetId) => {
      const asset = imageAssets.find((img) => img.fileId === assetId);
      if (!asset || filterTagsSet.size === 0) return new Set<string>();

      // Only return tags that exist on this asset AND are in the filter
      const highlighted = new Set<string>();

      for (const tag of asset.tagList) {
        if (filterTagsSet.has(tag)) {
          highlighted.add(tag);
        }
      }

      return highlighted;
    },
    {
      memoizeOptions: {
        // Custom equality check for Set comparison
        resultEqualityCheck: (a: Set<string>, b: Set<string>) => {
          if (a.size !== b.size) return false;
          for (const item of a) {
            if (!b.has(item)) return false;
          }
          return true;
        },
      },
    },
  ),
);
