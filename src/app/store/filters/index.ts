// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { coreReducers } from './reducers';
import { FilterMode, Filters } from './types';

const initialState: Filters = {
  filterMode: FilterMode.SHOW_ALL,
  filterTags: [],
  filterSizes: [],
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
    selectHasActiveFilters: (state) =>
      state.filterTags.length > 0 || state.filterSizes.length > 0,
    selectFilterCount: (state) => ({
      tags: state.filterTags.length,
      sizes: state.filterSizes.length,
      total: state.filterTags.length + state.filterSizes.length,
    }),
  },
});

// Main exports from slice
export const { reducer: filtersReducer } = filtersSlice;
export const {
  toggleTagFilterMode,
  addTagFilter,
  toggleTagFilter,
  toggleSizeFilter,
  clearTagFilters,
  clearSizeFilters,
  clearFilters,
} = filtersSlice.actions;

// Main exports for filters module
export * from './selectors';
export * from './types';
export * from './utils';
