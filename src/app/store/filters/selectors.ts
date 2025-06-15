// Selectors for filters slice
import { FilterCount, Filters } from './types';

export const selectFilterMode = (state: { filters: Filters }) =>
  state.filters.filterMode;

export const selectFilterTags = (state: { filters: Filters }) =>
  state.filters.filterTags;

export const selectFilterSizes = (state: { filters: Filters }) =>
  state.filters.filterSizes;

export const selectHasActiveFilters = (state: { filters: Filters }) =>
  state.filters.filterTags.length > 0 || state.filters.filterSizes.length > 0;

export const selectFilterCount = (state: {
  filters: Filters;
}): FilterCount => ({
  tags: state.filters.filterTags.length,
  sizes: state.filters.filterSizes.length,
  total: state.filters.filterTags.length + state.filters.filterSizes.length,
});
