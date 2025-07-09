'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import {
  completeAfterDelay,
  IoState,
  loadAllAssets,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';
import { NoContent } from '../views/no-content';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const initialLoad = useRef<boolean>(true);
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageCount = useAppSelector(selectImageCount);

  // Load assets only once on initial mount
  const loadImageAssets = useCallback(
    async (_args?: { maintainIoState: boolean }) => {
      dispatch(loadAllAssets(_args));
    },
    [dispatch],
  );

  useEffect(() => {
    if (initialLoad.current) {
      loadImageAssets();
      initialLoad.current = false;
    }
  }, [loadImageAssets]);

  // Redirect to root on I/O error
  useEffect(() => {
    if (ioState === IoState.ERROR) {
      router.push('/');
    }
  }, [ioState, router]);

  // Auto-trigger completion delay when state becomes COMPLETING
  useEffect(() => {
    if (ioState === IoState.COMPLETING) {
      dispatch(completeAfterDelay());
    }
  }, [ioState, dispatch]);

  // Only show the loading screen if we're loading AND we don't have any assets yet
  // This differentiates between initial load and refresh operations
  // Also show during COMPLETING state to allow progress bar to reach 100%
  if (
    ioState === IoState.INITIAL ||
    (ioState === IoState.LOADING && imageCount === 0) ||
    ioState === IoState.COMPLETING
  ) {
    return <InitialLoad />;
  }

  if (ioState === IoState.ERROR) {
    return <Error onReload={loadImageAssets} />;
  }

  // Handle empty state at the provider level instead of in page components
  if (ioState !== IoState.LOADING && imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return children;
};
