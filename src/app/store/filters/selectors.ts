// Selectors for filters slice
import { createSelector } from '@reduxjs/toolkit';

import { FilterCount, Filters } from './types';

export const selectFilterMode = (state: { filters: Filters }) =>
  state.filters.filterMode;

export const selectFilterTags = (state: { filters: Filters }) =>
  state.filters.filterTags;

export const selectFilterSizes = (state: { filters: Filters }) =>
  state.filters.filterSizes;

export const selectFilterExtensions = (state: { filters: Filters }) =>
  state.filters.filterExtensions;

export const selectPaginationSize = (state: { filters: Filters }) =>
  state.filters.paginationSize;

export const selectShowModified = (state: { filters: Filters }) =>
  state.filters.showModified;

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
