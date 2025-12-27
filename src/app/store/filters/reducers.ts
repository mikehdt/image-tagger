// Core reducers for the filters slice
import { PayloadAction } from '@reduxjs/toolkit';

import { FilterMode, Filters, PaginationSize } from './types';
import { toggleFilter } from './utils';

export const coreReducers = {
  setTagFilterMode: (
    state: Filters,
    { payload }: PayloadAction<FilterMode>,
  ) => {
    state.filterMode = payload;
  },

  setPaginationSize: (
    state: Filters,
    { payload }: PayloadAction<PaginationSize>,
  ) => {
    state.paginationSize = payload;
  },

  toggleTagFilter: (state: Filters, { payload }: PayloadAction<string>) => {
    state.filterTags = toggleFilter(state.filterTags, payload);
  },

  toggleSizeFilter: (state: Filters, { payload }: PayloadAction<string>) => {
    state.filterSizes = toggleFilter(state.filterSizes, payload);
  },

  toggleBucketFilter: (state: Filters, { payload }: PayloadAction<string>) => {
    state.filterBuckets = toggleFilter(state.filterBuckets, payload);
  },

  toggleExtensionFilter: (
    state: Filters,
    { payload }: PayloadAction<string>,
  ) => {
    state.filterExtensions = toggleFilter(state.filterExtensions, payload);
  },

  toggleModifiedFilter: (state: Filters) => {
    state.showModified = !state.showModified;
  },

  clearTagFilters: (state: Filters) => {
    state.filterTags = [];
  },

  clearSizeFilters: (state: Filters) => {
    state.filterSizes = [];
  },

  clearBucketFilters: (state: Filters) => {
    state.filterBuckets = [];
  },

  clearExtensionFilters: (state: Filters) => {
    state.filterExtensions = [];
  },

  clearFilters: (state: Filters) => {
    state.filterTags = [];
    state.filterSizes = [];
    state.filterBuckets = [];
    state.filterExtensions = [];
    state.filenamePatterns = [];
    state.showModified = false;
    state.searchQuery = '';
  },

  setSearchQuery: (state: Filters, { payload }: PayloadAction<string>) => {
    state.searchQuery = payload;
  },

  addFilenamePattern: (state: Filters, { payload }: PayloadAction<string>) => {
    const pattern = payload.trim().toLowerCase();
    // Only add if not empty and not already present
    if (pattern && !state.filenamePatterns.includes(pattern)) {
      state.filenamePatterns.push(pattern);
    }
  },

  removeFilenamePattern: (
    state: Filters,
    { payload }: PayloadAction<string>,
  ) => {
    state.filenamePatterns = state.filenamePatterns.filter((p) => p !== payload);
  },

  clearFilenamePatterns: (state: Filters) => {
    state.filenamePatterns = [];
  },

  clearModifiedFilter: (state: Filters) => {
    state.showModified = false;
  },

  // Reset filter mode if it's SELECTED_ASSETS and there are no selected assets
  resetFilterModeIfNeeded: (
    state: Filters,
    { payload }: PayloadAction<{ hasSelectedAssets: boolean }>,
  ) => {
    if (
      state.filterMode === FilterMode.SELECTED_ASSETS &&
      !payload.hasSelectedAssets
    ) {
      state.filterMode = FilterMode.SHOW_ALL;
    }
  },

  // Update tag filter names when tags are edited
  updateTagFilters: (
    state: Filters,
    {
      payload,
    }: PayloadAction<
      Array<{
        oldTagName: string;
        newTagName: string;
        operation: 'RENAME' | 'DELETE';
      }>
    >,
  ) => {
    // Process each tag update
    payload.forEach(({ oldTagName, newTagName, operation }) => {
      const index = state.filterTags.indexOf(oldTagName);
      if (index !== -1) {
        if (operation === 'RENAME') {
          // Replace the old tag with the new one
          state.filterTags[index] = newTagName;
        } else if (operation === 'DELETE') {
          // Remove the tag from filters
          state.filterTags.splice(index, 1);
        }
      }
    });

    // Deduplicate the filter tags to remove any duplicates that might have been created
    state.filterTags = [...new Set(state.filterTags)];
  },
};
