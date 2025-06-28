import { useRouter } from 'next/navigation';

import {
  PaginationSize,
  selectPaginationSize,
  setPaginationSize,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  basePath?: string;
};

export const PaginationControls = ({
  currentPage,
  totalItems,
  basePath = '',
}: PaginationControlsProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const paginationSize = useAppSelector(selectPaginationSize);

  // When pagination size changes, we need to redirect to page 1 if the current page
  // would be outside the new range
  const handlePaginationSizeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newSize = parseInt(e.target.value, 10) as PaginationSize;

    // Store the new size in Redux
    dispatch(setPaginationSize(newSize));

    // Don't navigate away immediately, let the Redux store update first
    requestAnimationFrame(() => {
      // If we're switching to "All", always go to page 1
      if (newSize === PaginationSize.ALL) {
        router.push(`${basePath}/1`);
        return;
      }

      // Calculate new total pages
      const newTotalPages = Math.ceil(totalItems / newSize);

      // If current page is beyond the new range, redirect to page 1
      if (currentPage > newTotalPages) {
        router.push(`${basePath}/1`);
      }
    });
  };

  return (
    <span className="mr-4 flex items-center">
      <label
        htmlFor="pagination-size"
        className="mr-2 text-xs text-slate-500 max-lg:hidden"
      >
        Per page:
      </label>
      <select
        id="pagination-size"
        value={paginationSize}
        onChange={handlePaginationSizeChange}
        className="rounded border border-slate-300 bg-white/50 px-3 py-1 text-sm"
      >
        <option value={PaginationSize.FIFTY}>{PaginationSize.FIFTY}</option>
        <option value={PaginationSize.HUNDRED}>{PaginationSize.HUNDRED}</option>
        <option value={PaginationSize.TWO_FIFTY}>
          {PaginationSize.TWO_FIFTY}
        </option>
        <option value={PaginationSize.ALL}>All</option>
      </select>
    </span>
  );
};
