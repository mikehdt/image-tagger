import { createSelector } from '@reduxjs/toolkit';

import { applyFilters } from '../../utils/filter-actions';
import { selectAllImages } from '../assets';
import {
  FilterMode,
  selectFilterTags,
  selectHasActiveFilters,
} from '../filters';
import { selectSelectedAssets } from '../selection';

// Cache for memoized selectors - prevents creating new selector instances
const duplicateTagInfoCache = new Map<
  string,
  ReturnType<typeof createDuplicateTagInfoSelector>
>();
const tagCoExistenceCache = new Map<
  string,
  ReturnType<typeof createTagCoExistenceSelector>
>();

// Helper to create a cache key for tag co-existence (two tags)
const makeCoExistenceKey = (originalTag: string, newTagValue: string) =>
  `${originalTag}::${newTagValue}`;

/**
 * Creates the actual selector for duplicate tag info
 */
const createDuplicateTagInfoSelector = (tagName: string) =>
  createSelector(
    [selectSelectedAssets, selectAllImages],
    (selectedAssets, allImages) => {
      if (!tagName || selectedAssets.length === 0) {
        return {
          isDuplicate: false,
          duplicateCount: 0,
          totalSelected: selectedAssets.length,
          isAllDuplicates: false,
        };
      }

      // Find all selected assets in the assets slice
      const selectedImagesData = allImages.filter((img) =>
        selectedAssets.includes(img.fileId),
      );

      // Count how many assets already have this tag
      const duplicateCount = selectedImagesData.filter((img) =>
        img.tagList.includes(tagName),
      ).length;

      return {
        isDuplicate: duplicateCount > 0,
        duplicateCount,
        totalSelected: selectedImagesData.length,
        isAllDuplicates:
          duplicateCount === selectedImagesData.length && duplicateCount > 0,
      };
    },
  );

/**
 * Creates the actual selector for tag co-existence
 */
const createTagCoExistenceSelector = (
  originalTag: string,
  newTagValue: string,
) =>
  createSelector([selectAllImages], (allImages) => {
    if (!originalTag || !newTagValue || originalTag === newTagValue) {
      return {
        wouldCreateDuplicates: false,
        assetsWithOriginalTag: 0,
        assetsWithBothTags: 0,
      };
    }

    // Find all assets that have the original tag
    const assetsWithOriginalTag = allImages.filter((img) =>
      img.tagList.includes(originalTag),
    );

    // Count how many of those assets also have the new tag
    const assetsWithBothTags = assetsWithOriginalTag.filter((img) =>
      img.tagList.includes(newTagValue),
    );

    return {
      wouldCreateDuplicates: assetsWithBothTags.length > 0,
      assetsWithOriginalTag: assetsWithOriginalTag.length,
      assetsWithBothTags: assetsWithBothTags.length,
    };
  });

/**
 * Returns a cached selector for duplicate tag info.
 * The same selector instance is returned for the same tagName,
 * enabling proper memoization.
 */
export const selectDuplicateTagInfo = (tagName: string) => {
  if (!duplicateTagInfoCache.has(tagName)) {
    duplicateTagInfoCache.set(tagName, createDuplicateTagInfoSelector(tagName));
  }
  return duplicateTagInfoCache.get(tagName)!;
};

/**
 * Returns a cached selector for tag co-existence.
 * The same selector instance is returned for the same tag pair,
 * enabling proper memoization.
 */
export const selectTagCoExistence = (
  originalTag: string,
  newTagValue: string,
) => {
  const key = makeCoExistenceKey(originalTag, newTagValue);
  if (!tagCoExistenceCache.has(key)) {
    tagCoExistenceCache.set(
      key,
      createTagCoExistenceSelector(originalTag, newTagValue),
    );
  }
  return tagCoExistenceCache.get(key)!;
};

/**
 * Clears the selector caches. Call this if you need to free memory
 * or reset memoization (e.g., when switching projects).
 */
export const clearSelectorCaches = () => {
  duplicateTagInfoCache.clear();
  tagCoExistenceCache.clear();
};

/**
 * Selector to get assets that have at least one of the selected tags
 * @returns Array of assets that contain at least one selected tag
 */
export const selectAssetsWithSelectedTags = createSelector(
  [selectAllImages, selectFilterTags],
  (allImages, filterTags) => {
    if (filterTags.length === 0) {
      return [];
    }

    return allImages.filter((asset) =>
      asset.tagList.some((tag) => filterTags.includes(tag)),
    );
  },
);

/**
 * Enhanced selector to get assets that match any active filters (unified filtering approach)
 * This considers tags, sizes, buckets, extensions, and modified state
 * Uses the existing applyFilters logic but in MATCH_ANY mode for union behavior
 * @returns Array of assets that match at least one active filter criterion
 */
export const selectAssetsWithActiveFilters = createSelector(
  [(state) => state, selectAllImages, (state) => state.filters],
  (state, allImages, filters) => {
    // If no filters are active, return empty array
    const hasActiveFilters = selectHasActiveFilters(state);

    if (!hasActiveFilters) {
      return [];
    }

    // Use the existing applyFilters function with MATCH_ANY mode
    // This ensures consistency with the main filtering logic
    return applyFilters({
      assets: allImages,
      filterTags: filters.filterTags,
      filterSizes: filters.filterSizes,
      filterBuckets: filters.filterBuckets,
      filterExtensions: filters.filterExtensions,
      filenamePatterns: filters.filenamePatterns,
      filterMode: FilterMode.MATCH_ANY, // Use MATCH_ANY for union behavior
      showModified: filters.showModified,
      selectedAssets: [], // No asset selection constraint
    });
  },
);

/**
 * Selector to get the count of assets with active filters
 * @returns Number of assets that match at least one active filter criterion
 */
export const selectAssetsWithActiveFiltersCount = createSelector(
  [selectAssetsWithActiveFilters],
  (assetsWithActiveFilters) => assetsWithActiveFilters.length,
);
