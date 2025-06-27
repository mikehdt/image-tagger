import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import { PaginationSize, selectPaginationSize } from '../../store/filters';
import { useAppSelector } from '../../store/hooks';

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  basePath?: string;
};

export const Pagination = ({
  currentPage,
  totalItems,
  basePath = '',
}: PaginationProps) => {
  const paginationSize = useAppSelector(selectPaginationSize);

  // Calculate total pages
  const totalPages =
    paginationSize === PaginationSize.ALL
      ? 1
      : Math.ceil(totalItems / paginationSize);
  const renderPaginationButtons = () => {
    const pages: React.ReactNode[] = [];

    // If there's only one page, don't show pagination
    // if (totalPages <= 1) {
    //   return pages;
    // }

    // Previous page button
    const prevPage = Math.max(1, currentPage - 1);
    pages.push(
      <Link
        key="prev"
        href={`${basePath}/${prevPage}`}
        prefetch={true}
        scroll={true}
        className={`mr-1 flex items-center rounded p-1 ${
          currentPage <= 1
            ? 'pointer-events-none text-slate-300'
            : 'text-slate-500 hover:bg-sky-100'
        }`}
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </Link>,
    );

    // Calculate which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <Link
          key="1"
          href={`${basePath}/1`}
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-2 py-0.5 ${
            currentPage === 1
              ? 'bg-sky-500 text-white'
              : 'text-slate-500 hover:bg-sky-100'
          }`}
        >
          1
        </Link>,
      );

      // Ellipsis if needed
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="px-2 py-0.5 text-slate-300">
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
          href={`${basePath}/${i}`}
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-2 py-0.5 ${
            currentPage === i
              ? 'bg-sky-500 text-white'
              : 'text-slate-500 hover:bg-sky-100'
          }`}
        >
          {i}
        </Link>,
      );
    }

    // Last page if needed
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="px-2 py-0.5 text-slate-300">
            &hellip;
          </span>,
        );
      }

      pages.push(
        <Link
          key={totalPages}
          href={`${basePath}/${totalPages}`}
          prefetch={true}
          scroll={true}
          className={`mx-1 rounded px-2 py-0.5 ${
            currentPage === totalPages
              ? 'bg-sky-500 text-white'
              : 'text-slate-500 hover:bg-sky-100'
          }`}
        >
          {totalPages}
        </Link>,
      );
    }

    // Next page button
    const nextPage = Math.min(totalPages, currentPage + 1);
    pages.push(
      <Link
        key="next"
        href={`${basePath}/${nextPage}`}
        prefetch={true}
        scroll={true}
        className={`ml-1 flex items-center rounded p-1 ${
          currentPage >= totalPages
            ? 'pointer-events-none text-slate-300'
            : 'text-slate-500 hover:bg-sky-100'
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </Link>,
    );

    return pages;
  };

  return (
    <div className="flex-inline flex items-center justify-center tabular-nums">
      {renderPaginationButtons()}
    </div>
  );
};
