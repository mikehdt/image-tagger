'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { selectFilteredAssets } from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { BottomShelf } from './bottom-shelf/bottom-shelf';
import { TopShelf } from './top-shelf/top-shelf';

export const StableLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Don't show shelves on the project selection page (root path)
  const showShelves = pathname !== '/';

  const paginationSize = useAppSelector(selectPaginationSize);
  const filteredAssets = useAppSelector(selectFilteredAssets);

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

  return (
    <main className="relative mx-auto min-h-screen max-w-400 px-4 pt-24 pb-16">
      {showShelves && <TopShelf currentPage={currentPage} />}
      {children}
      {showShelves && (
        <BottomShelf currentPage={currentPage} totalPages={totalPages} />
      )}
    </main>
  );
};
