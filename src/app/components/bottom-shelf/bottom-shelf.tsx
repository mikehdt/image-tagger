import { useMemo } from 'react';

import { selectAllImages } from '../../store/assets';
import {
  PaginationSize,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
} from '../../store/filters';
import { useAppSelector } from '../../store/hooks';
import { applyFilters } from '../../utils/filter-actions';
import { PaginationControls } from '../pagination/controls';
import { Pagination } from '../pagination/pagination';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({ currentPage = 1 }: BottomShelfProps) => {
  const allAssets = useAppSelector(selectAllImages);
  const paginationSize = useAppSelector(selectPaginationSize);

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

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full bg-white/80 inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4">
        <div className="flex w-1/4 items-center text-xs whitespace-nowrap text-slate-500">
          <span className="mr-4">
            {isFiltered && (
              <>
                {filteredCount} filtered items
                <br />
              </>
            )}
            {allAssets.length} items total
          </span>

          <PaginationControls
            currentPage={currentPage}
            totalPages={
              paginationSize === PaginationSize.ALL
                ? 1
                : Math.ceil(filteredCount / paginationSize)
            }
            totalItems={filteredCount}
          />
        </div>

        <div className="flex w-2/4 items-center justify-center">
          <Pagination currentPage={currentPage} totalItems={filteredCount} />
        </div>

        <div className="flex w-1/4 items-center justify-end">
          [move save/cancel all controls to here]
        </div>
      </div>
    </div>
  );
};
