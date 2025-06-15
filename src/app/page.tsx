'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  IoState,
  loadAssets,
  selectImageCount,
  selectIoState,
} from './store/assets';
import { useAppDispatch, useAppSelector } from './store/hooks';
import StoreProvider from './utils/store-provider';
import { AssetList } from './views/asset-list';
import { Error } from './views/error';
import { InitialLoad } from './views/initial-load';
import { NoContent } from './views/no-content';
import { TopShelf } from './views/top-shelf';

const App = () => {
  const initialLoad = useRef<boolean>(true);

  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageCount = useAppSelector(selectImageCount);

  // Could accept 'optimistic' assets and set them, then load?
  const loadImageAssets = useCallback(async () => {
    dispatch(loadAssets());
  }, [dispatch]);

  useEffect(() => {
    // There's some weirdness here if this is done entirely in Redux as Next's
    // router gets very upset at something triggering a re-render
    if (initialLoad.current) loadImageAssets();
    initialLoad.current = false;
  }, [initialLoad, loadImageAssets]);

  // Non-valid states
  if (
    ioState === IoState.UNINITIALIZED ||
    (ioState === IoState.LOADING && imageCount === 0)
  ) {
    return <InitialLoad />;
  } else if (ioState === IoState.ERROR) {
    return <Error />;
  } else if (ioState === IoState.COMPLETE && imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return (
    <>
      <TopShelf />
      <AssetList />
    </>
  );
};

// This is to avoid separating layouts into two files for such a small
// difference, because of ReduxProvider not being allowed in layout.tsx due to
// its use of meta setting requiring server components
export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
