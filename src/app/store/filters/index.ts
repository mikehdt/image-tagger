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
  showModified: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: coreReducers,
  // Simple property accessors defined inline, complex selectors still in selectors.ts
  selectors: {
    selectFilterMode: (state) => state.filterMode,
    selectFilterTags: (state) => state.filterTags,
    selectFilterSizes: (state) => state.filterSizes,
    selectFilterExtensions: (state) => state.filterExtensions,
    selectPaginationSize: (state) => state.paginationSize,
    selectShowModified: (state) => state.showModified,
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
  toggleModifiedFilter,
  clearTagFilters,
  clearSizeFilters,
  clearExtensionFilters,
  clearFilters,
} = filtersSlice.actions;

// Export the selectors from the slice
export const {
  selectFilterMode,
  selectFilterTags,
  selectFilterSizes,
  selectFilterExtensions,
  selectPaginationSize,
  selectShowModified,
} = filtersSlice.selectors;

// Main exports for filters module
export * from './selectors';
export * from './types';
export * from './utils';
