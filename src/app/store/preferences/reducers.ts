import { PayloadAction } from '@reduxjs/toolkit';

import { PreferencesState, TagEditMode, ThemeMode } from './types';

export const coreReducers = {
  setTheme: (
    state: PreferencesState,
    { payload }: PayloadAction<ThemeMode>,
  ) => {
    state.theme = payload;
  },

  setTagEditMode: (
    state: PreferencesState,
    { payload }: PayloadAction<TagEditMode>,
  ) => {
    state.tagEditMode = payload;
  },
};
