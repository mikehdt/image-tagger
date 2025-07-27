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
      action: PayloadAction<Omit<Toast, 'id' | 'timestamp'>>,
    ) => {
      const toast: Toast = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },
    // clearAllToasts: (state) => {
    //   state.toasts = [];
    // },
  },
});

export const { addToast, removeToast } = toastsSlice.actions;
export const toastsReducer = toastsSlice.reducer;
