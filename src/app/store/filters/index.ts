// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { coreReducers } from './reducers';
import { FilterMode, Filters, PaginationSize } from './types';

const initialState: Filters = {
  filterMode: FilterMode.SHOW_ALL,
  filterTags: [],
  filterSizes: [],
  filterExtensions: [],
  paginationSize: PaginationSize.HUNDRED,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: coreReducers,
  // Selectors are defined in selectors.ts file but included here
  // to satisfy the createSlice API
  selectors: {
    selectFilterMode: (state) => state.filterMode,
    selectFilterTags: (state) => state.filterTags,
    selectFilterSizes: (state) => state.filterSizes,
    selectFilterExtensions: (state) => state.filterExtensions,
    selectPaginationSize: (state) => state.paginationSize,
    selectHasActiveFilters: (state) =>
      state.filterTags.length > 0 ||
      state.filterSizes.length > 0 ||
      state.filterExtensions.length > 0,
    selectFilterCount: (state) => ({
      tags: state.filterTags.length,
      sizes: state.filterSizes.length,
      extensions: state.filterExtensions.length,
      total:
        state.filterTags.length +
        state.filterSizes.length +
        state.filterExtensions.length,
    }),
  },
});

// Main exports from slice
export const { reducer: filtersReducer } = filtersSlice;
export const {
  setTagFilterMode,
  setPaginationSize,
  addTagFilter,
  toggleTagFilter,
  toggleSizeFilter,
  toggleExtensionFilter,
  clearTagFilters,
  clearSizeFilters,
  clearExtensionFilters,
  clearFilters,
} = filtersSlice.actions;

// Main exports for filters module
export * from './selectors';
export * from './types';
export * from './utils';
