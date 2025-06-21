'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import {
  IoState,
  loadAssets,
  selectAllImages,
  selectImageCount,
  selectIoState,
} from '../store/assets';
import {
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
} from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { applyFilters } from '../utils/filter-actions';
import { AssetList } from '../views/asset-list';
import { BottomShelf } from '../views/bottom-shelf';
import { Error } from '../views/error';
import { NoContent } from '../views/no-content';
import { TopShelf } from '../views/top-shelf';

const PaginatedPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const currentPage = parseInt(params.page as string, 10) || 1;

  const dispatch = useAppDispatch();
  const assets = useAppSelector(selectAllImages);
  const imageCount = useAppSelector(selectImageCount);
  const ioState = useAppSelector(selectIoState);
  const paginationSize = useAppSelector(selectPaginationSize);

  // Get filters
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);

  // Calculate filtered assets
  const filteredAssets = useMemo(
    () =>
      applyFilters({
        assets,
        filterTags,
        filterSizes,
        filterExtensions,
        filterMode,
      }),
    [assets, filterTags, filterSizes, filterExtensions, filterMode],
  );

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    try {
      if (paginationSize === -1) {
        // -1 is PaginationSize.ALL
        return 1; // When showing all, there's only one page
      }
      return Math.max(1, Math.ceil(filteredAssets.length / paginationSize));
    } catch (error) {
      console.error('Error calculating total pages:', error);
      return 1; // Default to 1 page on error
    }
  }, [filteredAssets, paginationSize]);

  // Effect to redirect if current page is out of bounds after filter change
  useEffect(() => {
    if (currentPage > totalPages) {
      router.push('/1');
    }
  }, [currentPage, totalPages, router]);

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
      <BottomShelf currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
};

export default function Page() {
  return <PaginatedPageContent />;
}
