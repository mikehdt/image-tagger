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
  const hasCompletedInitialLoad = useRef<boolean>(false); // Track if we've ever completed initial load
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

  // Track initial load completion and reset flag if imageCount becomes 0 (crash recovery)
  useEffect(() => {
    if (imageCount === 0) {
      hasCompletedInitialLoad.current = false; // Reset if we somehow lose all images
    } else if (
      ioState === IoState.COMPLETE &&
      !hasCompletedInitialLoad.current
    ) {
      hasCompletedInitialLoad.current = true; // Mark initial load as completed
    }
  }, [imageCount, ioState]);

  // Only show the loading screen if we're loading AND we don't have any assets yet
  // This differentiates between initial load and refresh operations
  // For COMPLETING state: only show InitialLoad if we haven't completed initial load yet
  if (
    ioState === IoState.INITIAL ||
    (ioState === IoState.LOADING && imageCount === 0) ||
    (ioState === IoState.COMPLETING && !hasCompletedInitialLoad.current)
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
