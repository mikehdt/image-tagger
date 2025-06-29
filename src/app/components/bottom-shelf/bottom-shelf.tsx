import {
  BookmarkSlashIcon,
  BookmarkSquareIcon,
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';

import {
  resetAllTags,
  saveAllAssets,
  selectAllImages,
  selectHasModifiedAssets,
} from '../../store/assets';
import {
  PaginationSize,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectPaginationSize,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyFilters } from '../../utils/filter-actions';
import { PaginationControls } from '../pagination/controls';
import { Pagination } from '../pagination/pagination';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({ currentPage = 1 }: BottomShelfProps) => {
  const dispatch = useAppDispatch();
  const allAssets = useAppSelector(selectAllImages);
  const paginationSize = useAppSelector(selectPaginationSize);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);

  // Get filters
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterMode = useAppSelector(selectFilterMode);

  // Action handlers
  const saveAllChanges = () => dispatch(saveAllAssets());
  const cancelAllChanges = () => dispatch(resetAllTags());

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

        <div className="flex w-1/4 items-center justify-end text-sm">
          <button
            type="button"
            onClick={cancelAllChanges}
            className={`mr-4 inline-flex items-center py-2 transition-colors ${hasModifiedAssets ? 'cursor-pointer text-slate-700 hover:text-slate-500' : 'cursor-not-allowed text-slate-300'}`}
            title={
              hasModifiedAssets
                ? 'Cancel all tag changes'
                : 'No changes to cancel'
            }
            disabled={!hasModifiedAssets}
          >
            <BookmarkSlashIcon className="w-4" />
            <span className="ml-1 max-lg:hidden">Cancel All</span>
          </button>

          <button
            type="button"
            onClick={saveAllChanges}
            className={`mr-4 inline-flex items-center py-2 transition-colors ${hasModifiedAssets ? 'cursor-pointer text-emerald-700 hover:text-emerald-500' : 'cursor-not-allowed text-slate-300'}`}
            title={
              hasModifiedAssets ? 'Save all tag changes' : 'No changes to save'
            }
            disabled={!hasModifiedAssets}
          >
            <BookmarkSquareIcon className="w-4" />
            <span className="ml-1 max-lg:hidden">Save All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
