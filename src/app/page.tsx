'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { type AppStore, makeStore } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { loadAssets, selectImages, selectIoState } from './store/slice-assets';
import { AssetList } from './views/asset-list';
import { Error } from './views/error';
import { InitialLoad } from './views/initial-load';
import { NoContent } from './views/no-content';

const App = () => {
  const initialLoad = useRef<boolean>(true);

  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const imageAssets = useAppSelector(selectImages);

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
    ioState === 'Uninitialized' ||
    (ioState === 'Loading' && imageAssets.length === 0)
  ) {
    return <InitialLoad />;
  } else if (ioState === 'IoError') {
    return <Error />;
  } else if (ioState === 'Complete' && imageAssets.length === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return <AssetList />;
};

// This is to avoid separating layouts into two files for such a small
// difference, because of ReduxProvider not being allowed in layout.tsx due to
// its use of meta setting requiring server components
export default function Page() {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return (
    <ReduxProvider store={storeRef.current}>
      <App />
    </ReduxProvider>
  );
}
