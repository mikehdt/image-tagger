'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import {
  IoState,
  loadAssets,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { AssetList } from '../views/asset-list';
import { BottomShelf } from '../views/bottom-shelf';
import { Error } from '../views/error';
import { NoContent } from '../views/no-content';
import { TopShelf } from '../views/top-shelf';

const PaginatedPageContent = () => {
  const params = useParams();
  const currentPage = parseInt(params.page as string, 10) || 1;

  const dispatch = useAppDispatch();
  const imageCount = useAppSelector(selectImageCount);
  const ioState = useAppSelector(selectIoState);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // Only used for the NoContent reload action
  const loadImageAssets = useCallback(async () => {
    dispatch(loadAssets());
  }, [dispatch]);

  if (ioState === IoState.ERROR) {
    return <Error />;
  }

  if (imageCount === 0) {
    return <NoContent onReload={loadImageAssets} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      <TopShelf />
      <AssetList currentPage={currentPage} />
      <BottomShelf
        currentPage={currentPage}
        totalPages={Math.ceil(imageCount / 100)}
      />
    </main>
  );
};

export default function Page() {
  return <PaginatedPageContent />;
}
