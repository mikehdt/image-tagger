import {
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import { FilterMode } from '../../../store/filters';

interface FilterModeControlsProps {
  filterTagsMode: FilterMode;
  filterModifiedActive: boolean;
  hasModifiedAssets: boolean;
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  setTagFilterMode: (mode: FilterMode) => void;
  toggleModifiedFilter: () => void;
}

export const FilterModeControls = ({
  filterTagsMode,
  filterModifiedActive,
  hasModifiedAssets,
  filterTags,
  filterSizes,
  filterExtensions,
  setTagFilterMode,
  toggleModifiedFilter,
}: FilterModeControlsProps) => {
  // Derive filterSelectionActive within the component
  const filterSelectionActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length
  );
  return (
    <div className="mr-4 inline-flex items-center rounded-md bg-slate-100 p-1">
      <span className="mr-1 py-1">
        {filterTagsMode === FilterMode.SHOW_ALL ? (
          <DocumentCheckIcon className="w-4" />
        ) : (
          <DocumentMagnifyingGlassIcon className="w-4" />
        )}
      </span>

      <div
        className={`mr-2 flex items-center rounded-sm ${filterSelectionActive ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
      >
        <button
          type="button"
          onClick={() => setTagFilterMode(FilterMode.SHOW_ALL)}
          className={`flex cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
            filterTagsMode === FilterMode.SHOW_ALL
              ? 'bg-white shadow-sm'
              : 'hover:bg-slate-300'
          }`}
        >
          Show All
        </button>
        <button
          type="button"
          onClick={() => setTagFilterMode(FilterMode.MATCH_ANY)}
          className={`flex items-center rounded-sm px-2 py-1 transition-colors ${
            filterTagsMode === FilterMode.MATCH_ANY ? 'bg-white shadow-sm' : ''
          } ${filterSelectionActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
          disabled={!filterSelectionActive}
        >
          Match Any
        </button>
        <button
          type="button"
          onClick={() => setTagFilterMode(FilterMode.MATCH_ALL)}
          className={`flex items-center rounded-sm px-2 py-1 transition-colors ${
            filterTagsMode === FilterMode.MATCH_ALL ? 'bg-white shadow-sm' : ''
          } ${filterSelectionActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
          disabled={!filterSelectionActive}
        >
          Match All
        </button>
      </div>

      <div
        className={`rounded-sm ${!filterModifiedActive && hasModifiedAssets ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
      >
        <button
          type="button"
          onClick={toggleModifiedFilter}
          className={`rounded-sm p-1 px-2 transition-colors ${
            filterModifiedActive ? 'bg-white shadow-sm' : ''
          } ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'text-slate-300'} ${!filterModifiedActive && hasModifiedAssets ? 'hover:bg-slate-300' : ''}`}
          disabled={!hasModifiedAssets}
        >
          Modified
        </button>
      </div>
    </div>
  );
};
