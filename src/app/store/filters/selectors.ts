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
const selectShowModified = (state: RootState) => state.filters.showModified;

export const selectHasActiveFilters = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterBuckets,
  selectFilterExtensions,
  selectShowModified,
  (filterTags, filterSizes, filterBuckets, filterExtensions, showModified) =>
    filterTags.length > 0 ||
    filterSizes.length > 0 ||
    filterBuckets.length > 0 ||
    filterExtensions.length > 0 ||
    showModified,
);

export const selectFilterCount = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterBuckets,
  selectFilterExtensions,
  (filterTags, filterSizes, filterBuckets, filterExtensions): FilterCount => ({
    tags: filterTags.length,
    sizes: filterSizes.length,
    buckets: filterBuckets.length,
    extensions: filterExtensions.length,
    total:
      filterTags.length +
      filterSizes.length +
      filterBuckets.length +
      filterExtensions.length,
  }),
);

// Memoized selector for filter tags as a Set
// Uses custom equality check to avoid recreating Set when contents haven't changed
export const selectFilterTagsSet = createSelector(
  [selectFilterTags],
  (filterTags) => new Set(filterTags),
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        // Compare Set sizes first (fast check)
        if (a.size !== b.size) return false;
        // Then compare contents
        for (const item of a) {
          if (!b.has(item)) return false;
        }
        return true;
      },
    },
  },
);
