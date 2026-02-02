import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Toast, ToastState } from './types';

const initialState: ToastState = {
  toasts: [],
};

const toastsSlice = createSlice({
  name: 'toasts',
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<Omit<Toast, 'id' | 'timestamp' | 'variant'> & { variant?: Toast['variant'] }>,
    ) => {
      const toast: Toast = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        variant: 'default',
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },
  },
});

export const { addToast, removeToast } = toastsSlice.actions;
export const toastsReducer = toastsSlice.reducer;
