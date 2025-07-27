// Complex selectors for filters slice
import { createSelector } from '@reduxjs/toolkit';

import {
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
} from '.';
import { FilterCount } from './types';

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

// Memoized selector for filter tags as a Set to avoid array recreation
export const selectFilterTagsSet = createSelector(
  [selectFilterTags],
  (filterTags) => new Set(filterTags),
);
