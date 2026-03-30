'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { selectFilteredAssetsCount } from '../store/assets';
import { selectPaginationSize } from '../store/filters';
import { useAppSelector } from '../store/hooks';
import { BottomShelf } from './bottom-shelf/bottom-shelf';
import { TopShelf } from './top-shelf/top-shelf';

export const StableLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Only show shelves on tagging pages
  const showShelves = pathname.startsWith('/tagging');

  const paginationSize = useAppSelector(selectPaginationSize);
  const filteredCount = useAppSelector(selectFilteredAssetsCount);

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    if (paginationSize === -1) return 1; // -1 is PaginationSize.ALL
    return Math.max(1, Math.ceil(filteredCount / paginationSize));
  }, [filteredCount, paginationSize]);

  // Effect to redirect if current page is out of bounds after filter change
  useEffect(() => {
    if (showShelves && currentPage > totalPages) {
      router.push('/tagging/1');
    }
  }, [showShelves, currentPage, totalPages, router]);

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
