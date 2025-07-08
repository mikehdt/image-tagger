'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { BottomShelf } from '../components/bottom-shelf/bottom-shelf';
import { TopShelf } from '../components/top-shelf/top-shelf';
import { selectAllImages } from '../store/assets';
import {
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
  selectSearchQuery,
  selectShowModified,
} from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { applyFilters } from '../utils/filter-actions';
import { AssetList } from '../views/asset-list';

const PaginatedPageContent = () => {
  const router = useRouter();
  const params = useParams();
  const currentPage = parseInt(params.page as string, 10) || 1;

  const assets = useAppSelector(selectAllImages);
  const paginationSize = useAppSelector(selectPaginationSize);

  // Get filters
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);
  const showModified = useAppSelector(selectShowModified);
  const searchQuery = useAppSelector(selectSearchQuery);

  // Calculate filtered assets
  const filteredAssets = useMemo(
    () =>
      applyFilters({
        assets,
        filterTags,
        filterSizes,
        filterExtensions,
        filterMode,
        showModified,
        searchQuery,
      }),
    [
      assets,
      filterTags,
      filterSizes,
      filterExtensions,
      filterMode,
      showModified,
      searchQuery,
    ],
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

  return (
    <main className="py-20">
      <TopShelf />
      <AssetList currentPage={currentPage} />
      <BottomShelf currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
};

export default function Page() {
  return <PaginatedPageContent />;
}
