import { createSlice } from '@reduxjs/toolkit';

export type TagState = 'Active' | 'ToDelete' | 'ToAdd';

export type ImageTag = {
  name: string;
  state: TagState;
};

const initialState = {
  tagsById: {},
  tagSummary: [],
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},

  selectors: {},
});

export const { reducer: tagsReducer } = tagsSlice;
