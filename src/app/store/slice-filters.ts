import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Filters = {
  filterMode: 'ShowAll' | 'FilterAny' | 'FilterAll';
  filterTags: string[];
  filterSizes: string[];
};

const initialState = {
  filterMode: 'ShowAll',
  filterTags: [],
  filterSizes: [],
} as Filters;

const toggleFilter = (haystack: string[], needle: string) =>
  haystack.includes(needle)
    ? haystack.filter((i) => i !== needle)
    : [...haystack, needle];

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleTagFilterMode: (state) => {
      const { filterMode } = state;

      if (filterMode === 'ShowAll') {
        state.filterMode = 'FilterAny';
      } else if (filterMode === 'FilterAny') {
        state.filterMode = 'FilterAll';
      } else if (filterMode === 'FilterAll') {
        state.filterMode = 'ShowAll';
      } else {
        console.error('Unknown filter tag mode');
      }
    },

    addTagFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterTags.push(payload);
    },

    toggleTagFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterTags = toggleFilter(state.filterTags, payload);
    },

    toggleSizeFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterSizes = toggleFilter(state.filterSizes, payload);
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
  },
});

export const { reducer: filtersReducer } = filtersSlice;
export const {
  toggleTagFilterMode,
  addTagFilter,
  toggleTagFilter,
  toggleSizeFilter,
  clearFilters,
} = filtersSlice.actions;
export const { selectFilterTags, selectFilterMode, selectFilterSizes } =
  filtersSlice.selectors;
