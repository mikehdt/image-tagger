import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export enum FilterMode {
  SHOW_ALL = 'ShowAll',
  MATCH_ANY = 'MatchAny',
  MATCH_ALL = 'MatchAll',
}

export type Filters = {
  filterMode: FilterMode;
  filterTags: string[];
  filterSizes: string[];
};

const initialState = {
  filterMode: FilterMode.SHOW_ALL,
  filterTags: [],
  filterSizes: [],
} as Filters;

const toggleFilter = (haystack: string[], needle: string) => {
  if (!needle || needle.trim() === '') return haystack;

  return haystack.includes(needle)
    ? haystack.filter((i) => i !== needle)
    : [...haystack, needle];
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleTagFilterMode: (state) => {
      const modes = [
        FilterMode.SHOW_ALL,
        FilterMode.MATCH_ANY,
        FilterMode.MATCH_ALL,
      ];

      const currentIndex = modes.indexOf(state.filterMode);
      const nextIndex = (currentIndex + 1) % modes.length;

      state.filterMode = modes[nextIndex];
    },

    addTagFilter: (state, { payload }: PayloadAction<string>) => {
      if (payload && !state.filterTags.includes(payload)) {
        state.filterTags.push(payload);
      }
    },

    toggleTagFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterTags = toggleFilter(state.filterTags, payload);
    },

    toggleSizeFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterSizes = toggleFilter(state.filterSizes, payload);
    },

    clearTagFilters: (state) => {
      state.filterTags = [];
    },

    clearSizeFilters: (state) => {
      state.filterSizes = [];
    },

    clearFilters: (state) => {
      state.filterTags = [];
      state.filterSizes = [];
    },
  },

  selectors: {
    selectFilterMode: (state) => state.filterMode,
    selectFilterTags: (state) => state.filterTags,
    selectFilterSizes: (state) => state.filterSizes,
    selectHasActiveFilters: (state) =>
      state.filterTags.length > 0 || state.filterSizes.length > 0,
    selectFilterCount: (state) => ({
      tags: state.filterTags.length,
      sizes: state.filterSizes.length,
      total: state.filterTags.length + state.filterSizes.length
    })
  },
});

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
export const {
  selectFilterTags,
  selectFilterMode,
  selectFilterSizes,
  selectHasActiveFilters,
  selectFilterCount
} = filtersSlice.selectors;
