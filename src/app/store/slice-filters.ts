import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Filters = {
  filterMode: 'ShowAll' | 'FilterAny' | 'FilterAll';
  filterTags: string[];
  filterSizes: string[];
};

const initialState = {
  filterMode: 'ShowAll',
  filterTags: [],
  filterSizes: [],
} as Filters;

const applyFilter = (haystack: string[], needle: string) =>
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

    toggleTagFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterTags = applyFilter(state.filterTags, payload);
    },

    toggleSizeFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterSizes = applyFilter(state.filterSizes, payload);
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
  toggleTagFilter,
  toggleTagFilterMode,
  clearFilters,
  toggleSizeFilter,
} = filtersSlice.actions;
export const { selectFilterTags, selectFilterMode, selectFilterSizes } =
  filtersSlice.selectors;
