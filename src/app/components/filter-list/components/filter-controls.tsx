import {
  clearExtensionFilters,
  clearSizeFilters,
  clearTagFilters,
  selectFilterCount,
} from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useFilterList } from '../filter-list-context';
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
  } = useFilterList();
  const dispatch = useAppDispatch();
  const filterCount = useAppSelector(selectFilterCount);

  const handleClearFilters = () => {
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
  };

  const isButtonDisabled =
    (activeView === 'tag' && filterCount.tags === 0) ||
    (activeView === 'size' && filterCount.sizes === 0) ||
    (activeView === 'filetype' && filterCount.extensions === 0);

  return (
    <>
      <button
        onClick={() => setSortType(getSortOptions().nextType)}
        className="cursor-pointer rounded rounded-tr-none rounded-br-none border border-r-0 border-slate-200 bg-white px-2 py-1 text-xs transition-colors hover:bg-slate-100"
        title="Toggle sort type"
      >
        By {getSortOptions().typeLabel}
      </button>

      <button
        onClick={() => {
          const newDirection: SortDirection =
            sortDirection === 'asc' ? 'desc' : 'asc';
          setSortDirection(newDirection);
        }}
        className="cursor-pointer rounded rounded-tl-none rounded-bl-none border border-slate-200 bg-white px-2 py-1 text-xs transition-colors hover:bg-slate-100"
        title="Toggle sort direction"
      >
        Sort {getSortOptions().directionLabel}
      </button>

      <button
        onClick={handleClearFilters}
        className={`ml-auto rounded border border-slate-200 px-2 py-1 text-xs transition-colors ${
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
