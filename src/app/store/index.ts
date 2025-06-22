import {
  type Action,
  configureStore,
  type ThunkAction,
} from '@reduxjs/toolkit';

import { assetsReducer } from './assets';
import { filtersReducer } from './filters';
import { filterManagerMiddleware } from './middleware/filter-manager';

export const makeStore = () => {
  return configureStore({
    devTools: true,
    reducer: {
      assets: assetsReducer,
      filters: filtersReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(filterManagerMiddleware.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
// export type AppThunk = ThunkAction<void, RootState, unknown, Action>;
