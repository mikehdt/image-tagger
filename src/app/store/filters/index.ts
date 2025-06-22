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
  // We're using the selectors from selectors.ts file instead of defining them here
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

// Main exports for filters module
export * from './selectors';
export * from './types';
export * from './utils';
