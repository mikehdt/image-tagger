// Complex selectors for filters slice
import { createSelector } from '@reduxjs/toolkit';

import {
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
} from '.';
import { FilterCount } from './types';

export const selectHasActiveFilters = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterExtensions,
  selectShowModified,
  (filterTags, filterSizes, filterExtensions, showModified) =>
    filterTags.length > 0 ||
    filterSizes.length > 0 ||
    filterExtensions.length > 0 ||
    showModified,
);

export const selectFilterCount = createSelector(
  selectFilterTags,
  selectFilterSizes,
  selectFilterExtensions,
  (filterTags, filterSizes, filterExtensions): FilterCount => ({
    tags: filterTags.length,
    sizes: filterSizes.length,
    extensions: filterExtensions.length,
    total: filterTags.length + filterSizes.length + filterExtensions.length,
  }),
);
