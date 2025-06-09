import {
  type Action,
  configureStore,
  type ThunkAction,
} from '@reduxjs/toolkit';

import { assetsReducer } from './assets';
import { filtersReducer } from './slice-filters';

export const makeStore = () => {
  return configureStore({
    devTools: true,
    reducer: {
      assets: assetsReducer,
      filters: filtersReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk = ThunkAction<void, RootState, unknown, Action>;
