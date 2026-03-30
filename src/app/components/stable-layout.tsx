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

  const project = params.project as string | undefined;
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Show TopShelf on tagging and training pages, BottomShelf only on tagging
  const isTagging = pathname.startsWith('/tagging');
  const isTraining = pathname.startsWith('/training');
  const showTopShelf = isTagging || isTraining;
  const showBottomShelf = isTagging;
  const basePath = project ? `/tagging/${encodeURIComponent(project)}` : '/tagging';

  const paginationSize = useAppSelector(selectPaginationSize);
  const filteredCount = useAppSelector(selectFilteredAssetsCount);

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    if (paginationSize === -1) return 1; // -1 is PaginationSize.ALL
    return Math.max(1, Math.ceil(filteredCount / paginationSize));
  }, [filteredCount, paginationSize]);

  // Effect to redirect if current page is out of bounds after filter change
  useEffect(() => {
    if (isTagging && currentPage > totalPages) {
      router.push(`${basePath}/1`);
    }
  }, [isTagging, currentPage, totalPages, router, basePath]);

  return (
    <main className="relative mx-auto min-h-screen max-w-400 px-4 pt-24 pb-16">
      {showTopShelf && <TopShelf currentPage={currentPage} />}
      {children}
      {showBottomShelf && (
        <BottomShelf
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={basePath}
        />
      )}
    </main>
  );
};
