import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { selectImageCount } from '../store/assets';
import { useAppSelector } from '../store/hooks';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({
  currentPage = 1,
  totalPages,
}: BottomShelfProps) => {
  const imageCount = useAppSelector(selectImageCount);
  const calculatedTotalPages = totalPages || Math.ceil(imageCount / 100);

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
          className={`mx-1 rounded px-3 py-1 tabular-nums ${currentPage === 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        >
          1
        </Link>,
      );

      // Ellipsis if needed
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-1">
            &hellip;
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
          className={`mx-1 rounded px-3 py-1 tabular-nums ${
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
            &hellip;
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
      <div className="mx-auto flex h-12 max-w-400 items-center justify-center">
        <div className="flex-inline flex items-center px-4 py-2">
          {renderPaginationButtons()}
        </div>
      </div>
    </div>
  );
};
