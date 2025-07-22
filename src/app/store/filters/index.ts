// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { coreReducers } from './reducers';
import {
  FilterMode,
  Filters,
  PaginationSize,
  SortDirection,
  SortType,
} from './types';

const initialState: Filters = {
  filterMode: FilterMode.SHOW_ALL,
  filterTags: [],
  filterSizes: [],
  filterBuckets: [],
  filterExtensions: [],
  paginationSize: PaginationSize.ONE_HUNDRED,
  showModified: false,
  searchQuery: '',
  sortType: SortType.NAME,
  sortDirection: SortDirection.ASC,
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
    selectFilterBuckets: (state) => state.filterBuckets,
    selectFilterExtensions: (state) => state.filterExtensions,
    selectPaginationSize: (state) => state.paginationSize,
    selectShowModified: (state) => state.showModified,
    selectSearchQuery: (state) => state.searchQuery,
    selectSortType: (state) => state.sortType,
    selectSortDirection: (state) => state.sortDirection,
  },
});

// Main exports from slice
export const { reducer: filtersReducer } = filtersSlice;
export const {
  setTagFilterMode,
  setPaginationSize,
  toggleTagFilter,
  toggleSizeFilter,
  toggleBucketFilter,
  toggleExtensionFilter,
  toggleModifiedFilter,
  clearTagFilters,
  updateTagFilters,
  clearSizeFilters,
  clearBucketFilters,
  clearExtensionFilters,
  clearFilters,
  setSearchQuery,
  clearModifiedFilter,
  resetFilterModeIfNeeded,
  setSortType,
  setSortDirection,
  toggleSortDirection,
} = filtersSlice.actions;

// Export the selectors from the slice
export const {
  selectFilterMode,
  selectFilterTags,
  selectFilterSizes,
  selectFilterBuckets,
  selectFilterExtensions,
  selectPaginationSize,
  selectShowModified,
  selectSearchQuery,
  selectSortType,
  selectSortDirection,
} = filtersSlice.selectors;

// Main exports for filters module
export * from './selectors';
export * from './types';
export * from './utils';
