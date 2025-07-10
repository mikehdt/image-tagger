import { useCallback } from 'react';

import {
  clearExtensionFilters,
  clearSizeFilters,
  clearTagFilters,
  selectFilterCount,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { useFilterContext } from '../filter-context';
import { SortDirection } from '../types';

export const FilterControls = () => {
  const {
    activeView,
    sortDirection,
    setSortType,
    setSortDirection,
    setSearchTerm,
    setSelectedIndex,
    getSortOptions,
  } = useFilterContext();
  const dispatch = useAppDispatch();
  const filterCount = useAppSelector(selectFilterCount);

  const handleClearFilters = useCallback(() => {
    // Dispatch clear filters action based on active view
    if (activeView === 'tag') {
      dispatch(clearTagFilters());
    } else if (activeView === 'size') {
      dispatch(clearSizeFilters());
    } else {
      dispatch(clearExtensionFilters());
    }
    // Clear search term and reset selected index
    setSearchTerm('');
    setSelectedIndex(-1);
  }, [activeView, dispatch, setSearchTerm, setSelectedIndex]);

  const handleSortType = useCallback(
    () => setSortType(getSortOptions().nextType),
    [getSortOptions, setSortType],
  );

  const handleSortDirection = useCallback(() => {
    const newDirection: SortDirection =
      sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
  }, [setSortDirection, sortDirection]);

  const isButtonDisabled =
    (activeView === 'tag' && filterCount.tags === 0) ||
    (activeView === 'size' && filterCount.sizes === 0) ||
    (activeView === 'filetype' && filterCount.extensions === 0);

  return (
    <>
      <button
        onClick={handleSortType}
        className="cursor-pointer rounded rounded-tr-none rounded-br-none border border-r-0 border-slate-200 bg-white px-2 py-1 text-xs inset-shadow-xs inset-shadow-white transition-colors hover:bg-slate-100"
        title="Toggle sort type"
      >
        By {getSortOptions().typeLabel}
      </button>

      <button
        onClick={handleSortDirection}
        className="cursor-pointer rounded rounded-tl-none rounded-bl-none border border-slate-200 bg-white px-2 py-1 text-xs inset-shadow-xs inset-shadow-white transition-colors hover:bg-slate-100"
        title="Toggle sort direction"
      >
        Sort {getSortOptions().directionLabel}
      </button>

      <button
        onClick={handleClearFilters}
        className={`ml-auto rounded border border-slate-200 px-2 py-1 text-xs inset-shadow-xs inset-shadow-white transition-colors ${
          !isButtonDisabled
            ? 'cursor-pointer bg-white hover:bg-slate-100'
            : 'cursor-not-allowed bg-slate-50 text-slate-400'
        }`}
        disabled={isButtonDisabled}
        title={`Clear ${activeView} filters`}
      >
        Clear
      </button>
    </>
  );
};
