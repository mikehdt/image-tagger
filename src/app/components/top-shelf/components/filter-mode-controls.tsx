import {
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import { Dropdown, DropdownItem } from '../../../components/shared/dropdown';
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

  // Create filter mode dropdown items
  const filterModeItems: DropdownItem<FilterMode>[] = [
    {
      value: FilterMode.SHOW_ALL,
      label: 'Show All',
    },
    {
      value: FilterMode.MATCH_ANY,
      label: 'Match Any',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.MATCH_ALL,
      label: 'Match All',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.MATCH_NONE,
      label: 'Match None',
      disabled: !filterSelectionActive,
    },
  ];

  return (
    <div className="mr-4 inline-flex items-center rounded-md bg-slate-100 p-1">
      <span className="mr-1">
        {filterTagsMode === FilterMode.SHOW_ALL ? (
          <DocumentCheckIcon className="w-4" />
        ) : (
          <DocumentMagnifyingGlassIcon className="w-4" />
        )}
      </span>

      <Dropdown
        items={filterModeItems}
        selectedValue={filterTagsMode}
        onChange={setTagFilterMode}
        minMenuWidth="110px"
        buttonClassName={`mr-2 ${
          filterTagsMode !== FilterMode.SHOW_ALL && !filterSelectionActive
            ? 'text-slate-300'
            : ''
        }`}
      />

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
