import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { selectAllImages } from '../store/assets';
import {
  PaginationSize,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
  setPaginationSize,
} from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { applyFilters } from '../utils/filter-actions';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({
  currentPage = 1,
  totalPages,
}: BottomShelfProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const paginationSize = useAppSelector(selectPaginationSize);
  const allAssets = useAppSelector(selectAllImages);

  // Get filters
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);

  // Calculate filtered assets count
  const filteredAssets = useMemo(
    () =>
      applyFilters({
        assets: allAssets,
        filterTags,
        filterSizes,
        filterExtensions,
        filterMode,
      }),
    [allAssets, filterTags, filterSizes, filterExtensions, filterMode],
  );

  const filteredCount = filteredAssets.length;
  const isFiltered = filteredCount !== allAssets.length;

  // Use provided totalPages or calculate based on filtered count
  const calculatedTotalPages =
    totalPages ||
    (paginationSize === PaginationSize.ALL
      ? 1
      : Math.ceil(filteredCount / paginationSize));

  // When pagination size changes, we need to redirect to page 1 if the current page
  // would be outside the new range
  const handlePaginationSizeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newSize = parseInt(e.target.value, 10) as PaginationSize;

    // Store the new size in Redux
    dispatch(setPaginationSize(newSize));

    // Don't navigate away immediately, let the Redux store update first
    setTimeout(() => {
      // If we're switching to "All", always go to page 1
      if (newSize === PaginationSize.ALL) {
        router.push('/1');
        return;
      }

      // Calculate new total pages
      const newTotalPages = Math.ceil(filteredCount / newSize);

      // If current page is beyond the new range, redirect to page 1
      if (currentPage > newTotalPages) {
        router.push('/1');
      }
    }, 0);
  };

  const renderPaginationButtons = () => {
    const pages = [];

    // Previous page button
    const prevPage = Math.max(1, currentPage - 1);
    pages.push(
      <Link
        key="prev"
        href={`/${prevPage}`}
        prefetch={true}
        scroll={true}
        className={`mr-1 flex items-center rounded px-2 py-1 ${
          currentPage <= 1
            ? 'pointer-events-none cursor-not-allowed text-gray-400'
            : 'hover:bg-gray-200'
        }`}
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </Link>,
    );

    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(calculatedTotalPages, startPage + 4);

    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <Link
          key="1"
          href="/1"
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-3 py-1 ${
            currentPage === 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
        >
          1
        </Link>,
      );

      // Ellipsis if needed
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-1">
            ...
          </span>,
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Link
          key={i}
          href={`/${i}`}
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-3 py-1 ${
            currentPage === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
          }`}
        >
          {i}
        </Link>,
      );
    }

    // Last page if needed
    if (endPage < calculatedTotalPages) {
      // Ellipsis if needed
      if (endPage < calculatedTotalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-3 py-1">
            ...
          </span>,
        );
      }

      pages.push(
        <Link
          key={calculatedTotalPages}
          href={`/${calculatedTotalPages}`}
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-3 py-1 ${
            currentPage === calculatedTotalPages
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          {calculatedTotalPages}
        </Link>,
      );
    }

    // Next page button
    const nextPage = Math.min(calculatedTotalPages, currentPage + 1);
    pages.push(
      <Link
        key="next"
        href={`/${nextPage}`}
        prefetch={true}
        scroll={true}
        className={`ml-1 flex items-center rounded px-2 py-1 ${
          currentPage >= calculatedTotalPages
            ? 'pointer-events-none cursor-not-allowed text-gray-400'
            : 'hover:bg-gray-200'
        }`}
        aria-disabled={currentPage >= calculatedTotalPages}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </Link>,
    );

    return pages;
  };

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full bg-white/80 inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-3">
        <div className="w-1/4 text-xs whitespace-nowrap text-slate-500">
          {isFiltered ? (
            <>
              Showing {filteredCount} out of {allAssets.length} items
            </>
          ) : (
            <>&nbsp;</>
          )}
        </div>

        <div className="flex-inline flex w-1/2 items-center justify-center px-4 py-2">
          {renderPaginationButtons()}
        </div>

        <div className="flex w-1/4 items-center justify-end">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {calculatedTotalPages}
          </span>
          <span className="ml-4 flex items-center">
            <label
              htmlFor="pagination-size"
              className="mr-2 text-xs text-slate-500"
            >
              Items per page:
            </label>
            <select
              id="pagination-size"
              value={paginationSize}
              onChange={handlePaginationSizeChange}
              className="rounded border px-3 py-1 text-sm"
            >
              <option value={PaginationSize.FIFTY}>50</option>
              <option value={PaginationSize.HUNDRED}>100</option>
              <option value={PaginationSize.TWO_FIFTY}>250</option>
              <option value={PaginationSize.ALL}>All</option>
            </select>
          </span>
        </div>
      </div>
    </div>
  );
};
