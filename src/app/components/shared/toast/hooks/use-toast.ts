'use client';

import { useCallback } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addToast } from '@/app/store/toasts';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const showToast = useCallback(
    (children: React.ReactNode) => {
      dispatch(addToast({ children }));
    },
    [dispatch],
  );

  return { showToast };
};
