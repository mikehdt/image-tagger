// Selectors for filters slice
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

export const selectHasActiveFilters = (state: { filters: Filters }) =>
  state.filters.filterTags.length > 0 ||
  state.filters.filterSizes.length > 0 ||
  state.filters.filterExtensions.length > 0 ||
  state.filters.showModified;

export const selectFilterCount = (state: {
  filters: Filters;
}): FilterCount => ({
  tags: state.filters.filterTags.length,
  sizes: state.filters.filterSizes.length,
  extensions: state.filters.filterExtensions.length,
  total:
    state.filters.filterTags.length +
    state.filters.filterSizes.length +
    state.filters.filterExtensions.length,
});
