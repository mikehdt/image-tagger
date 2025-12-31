import {
  type Action,
  configureStore,
  type ThunkAction,
} from '@reduxjs/toolkit';

import { assetsReducer } from './assets';
import { autoTaggerReducer } from './auto-tagger';
import { filtersReducer } from './filters';
import { filterManagerMiddleware } from './middleware/filter-manager';
import { projectReducer } from './project';
import { selectionReducer } from './selection';
import { toastsReducer } from './toasts';

export const makeStore = () => {
  return configureStore({
    devTools: true,
    reducer: {
      assets: assetsReducer,
      autoTagger: autoTaggerReducer,
      filters: filtersReducer,
      project: projectReducer,
      selection: selectionReducer,
      toasts: toastsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(filterManagerMiddleware.middleware),
  });
};

type AppStore = ReturnType<typeof makeStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

/**
 * @public For async operations
 */
export type AppThunk = ThunkAction<void, RootState, unknown, Action>;
