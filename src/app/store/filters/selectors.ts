// Complex selectors for filters slice
import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../';
import { FilterCount } from './types';

// Base selectors that extract filter state from RootState
// Note: These are local versions to avoid circular dependency with index.ts
// External consumers should use the slice selectors from the main exports
const selectFilterTags = (state: RootState) => state.filters.filterTags;
const selectFilterSizes = (state: RootState) => state.filters.filterSizes;
const selectFilterBuckets = (state: RootState) => state.filters.filterBuckets;
const selectFilterExtensions = (state: RootState) =>
  state.filters.filterExtensions;
const selectFilterSubfolders = (state: RootState) =>
  state.filters.filterSubfolders;
const selectFilenamePatterns = (state: RootState) =>
  state.filters.filenamePatterns;
const selectShowModified = (state: RootState) => state.filters.showModified;

export const selectHasActiveFilters = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSubfolders,
  selectFilenamePatterns,
  selectShowModified,
  (
    filterTags,
    filterSizes,
    filterBuckets,
    filterExtensions,
    filterSubfolders,
    filenamePatterns,
    showModified,
  ) =>
    filterTags.length > 0 ||
    filterSizes.length > 0 ||
    filterBuckets.length > 0 ||
    filterExtensions.length > 0 ||
    filterSubfolders.length > 0 ||
    filenamePatterns.length > 0 ||
    showModified,
);

export const selectFilterCount = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSubfolders,
  (
    filterTags,
    filterSizes,
    filterBuckets,
    filterExtensions,
    filterSubfolders,
  ): FilterCount => ({
    tags: filterTags.length,
    sizes: filterSizes.length,
    buckets: filterBuckets.length,
    extensions: filterExtensions.length,
    subfolders: filterSubfolders.length,
    total:
      filterTags.length +
      filterSizes.length +
      filterBuckets.length +
      filterExtensions.length +
      filterSubfolders.length,
  }),
);
