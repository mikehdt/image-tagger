'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import {
  IoState,
  loadAssets,
  selectImageCount,
  selectIoState,
} from './store/assets';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { AssetList } from './views/asset-list';
import { BottomShelf } from './views/bottom-shelf';
import { NoContent } from './views/no-content';
import { TopShelf } from './views/top-shelf';

const AppContent = () => {
  const router = useRouter();
  const imageCount = useAppSelector(selectImageCount);
  const ioState = useAppSelector(selectIoState);

  // For NoContent reload action
  const dispatch = useAppDispatch();
  const loadImageAssets = useCallback(async () => {
    dispatch(loadAssets());
  }, [dispatch]);

  useEffect(() => {
    // Redirect to page 1 when assets are loaded
    if (ioState === IoState.COMPLETE && imageCount > 0) {
      router.push('/1');
    }
  }, [ioState, imageCount, router]);

  // Handle the NoContent view case with the required onReload prop
  if (imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <TopShelf />
      <AssetList />
      <BottomShelf />
    </main>
  );
};

export default function Page() {
  return <AppContent />;
}
