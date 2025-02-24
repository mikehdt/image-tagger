import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Filters = {
  filterTags: string[];
  filterTagsMode: 'ShowAll' | 'FilterAny' | 'FilterAll';
  filterSizes: string[];
};

const initialState = {
  filterTags: [],
  filterTagsMode: 'ShowAll',
  filterSizes: [],
} as Filters;

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleTagFilter: (state, { payload }: PayloadAction<string>) => {
      state.filterTags = state.filterTags.includes(payload)
        ? state.filterTags.filter((i) => i !== payload)
        : [...state.filterTags, payload];
    },

    toggleTagFilterMode: (state) => {
      const currentFilterMode = state.filterTagsMode;
      if (currentFilterMode === 'ShowAll') {
        state.filterTagsMode = 'FilterAny';
      } else if (currentFilterMode === 'FilterAny') {
        state.filterTagsMode = 'FilterAll';
      } else if (currentFilterMode === 'FilterAll') {
        state.filterTagsMode = 'ShowAll';
      } else {
        console.error('Unknown filter tag mode');
      }
    },

    clearTagFilters: (state) => {
      state.filterTags = [];
    },
  },

  selectors: {
    selectFilterTags: (state) => state.filterTags,

    selectFilterTagsMode: (state) => state.filterTagsMode,

    selectFilterSizes: (state) => state.filterSizes,
  },
});

export const { reducer: filtersReducer } = filtersSlice;
export const { toggleTagFilter, toggleTagFilterMode, clearTagFilters } =
  filtersSlice.actions;
export const { selectFilterTags, selectFilterTagsMode, selectFilterSizes } =
  filtersSlice.selectors;
