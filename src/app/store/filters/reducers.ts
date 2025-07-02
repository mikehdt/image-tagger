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

  // Not used for now; Keeping this logic in case we need it later
  // addTagFilter: (state: Filters, { payload }: PayloadAction<string>) => {
  //   if (payload && !state.filterTags.includes(payload)) {
  //     state.filterTags.push(payload);
  //   }
  // },

  toggleTagFilter: (state: Filters, { payload }: PayloadAction<string>) => {
    state.filterTags = toggleFilter(state.filterTags, payload);
  },

  toggleSizeFilter: (state: Filters, { payload }: PayloadAction<string>) => {
    state.filterSizes = toggleFilter(state.filterSizes, payload);
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

  clearExtensionFilters: (state: Filters) => {
    state.filterExtensions = [];
  },

  clearFilters: (state: Filters) => {
    state.filterTags = [];
    state.filterSizes = [];
    state.filterExtensions = [];
    state.showModified = false;
  },

  // Update tag filter names when tags are edited
  updateTagFilters: (
    state: Filters,
    {
      payload,
    }: PayloadAction<Array<{ oldTagName: string; newTagName: string }>>,
  ) => {
    // Replace old tag names with new ones in the filter list
    payload.forEach(({ oldTagName, newTagName }) => {
      const index = state.filterTags.indexOf(oldTagName);
      if (index !== -1) {
        // Replace the old tag with the new one
        state.filterTags[index] = newTagName;
      }
    });
  },
};
