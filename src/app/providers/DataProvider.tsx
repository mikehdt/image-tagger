'use client';

import { useCallback, useEffect, useRef } from 'react';

import { IoState, loadAssets, selectIoState } from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Error } from '../views/error';
import { InitialLoad } from '../views/initial-load';

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const initialLoad = useRef<boolean>(true);
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);

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

  if (ioState === IoState.LOADING) {
    return <InitialLoad />;
  }

  if (ioState === IoState.ERROR) {
    return <Error />;
  }

  return children;
};
