import type { RootState } from '../index';

export const selectToasts = (state: RootState) => state.toasts.toasts;
