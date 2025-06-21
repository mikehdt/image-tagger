'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  IoState,
  loadAssets,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';
import { NoContent } from '../views/no-content';

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const initialLoad = useRef<boolean>(true);
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageCount = useAppSelector(selectImageCount);

  // Load assets only once on initial mount
  const loadImageAssets = useCallback(async () => {
    dispatch(loadAssets());
  }, [dispatch]);

  useEffect(() => {
    if (initialLoad.current) {
      loadImageAssets();
      initialLoad.current = false;
    }
  }, [loadImageAssets]);

  // Only show the loading screen if we're loading AND we don't have any assets yet
  // This differentiates between initial load and refresh operations
  if (ioState === IoState.LOADING && imageCount === 0) {
    return <InitialLoad />;
  }

  if (ioState === IoState.ERROR) {
    return <Error />;
  }

  // Handle empty state at the provider level instead of in page components
  if (ioState !== IoState.LOADING && imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return children;
};
