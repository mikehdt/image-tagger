'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { InitialLoad } from './components/loader';
import { type AppStore, makeStore } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  loadImages,
  selectImages,
  selectLoadState,
} from './store/slice-assets';
import { AssetList } from './views/asset-list';
import { NoContent } from './views/no-content';

const App = () => {
  const initialLoad = useRef<boolean>(true);

  const dispatch = useAppDispatch();
  const loadState = useAppSelector(selectLoadState);
  const imageAssets = useAppSelector(selectImages);

  // Could accept 'optimistic' assets and set them, then load?
  const loadImageAssets = useCallback(async () => {
    dispatch(loadImages());
  }, [dispatch]);

  useEffect(() => {
    // There's some weirdness here if this is done entirely in Redux as Next's
    // router gets very upset at something triggering a re-render
    if (initialLoad.current) loadImageAssets();
    initialLoad.current = false;
  }, [initialLoad, loadImageAssets]);

  // Non-valid states
  if (
    loadState === 'Uninitialized' ||
    (loadState === 'Loading' && imageAssets.length === 0)
  ) {
    return <InitialLoad />;
  } else if (loadState === 'LoadError') {
    return <div>An error occurred</div>;
  } else if (loadState === 'Loaded' && imageAssets.length === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  // Success
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
