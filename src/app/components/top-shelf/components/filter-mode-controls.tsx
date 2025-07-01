import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  clearFilters: () => void;
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
  clearFilters,
}: FilterModeControlsProps) => {
  // Derive filterActive within the component
  const filterActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length ||
    filterModifiedActive
  );

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
        <FunnelIcon className="w-4" />
      </span>

      <Dropdown
        items={filterModeItems}
        selectedValue={filterTagsMode}
        onChange={setTagFilterMode}
        buttonClassName={`mr-2 ${
          filterTagsMode !== FilterMode.SHOW_ALL && !filterSelectionActive
            ? 'text-slate-300'
            : ''
        }`}
      />

      <div className="border-r border-white pr-1">
        <button
          type="button"
          onClick={toggleModifiedFilter}
          className={`rounded-sm border p-1 px-2 transition-colors ${
            filterModifiedActive ? 'border-slate-300 bg-white shadow-sm' : ''
          } ${hasModifiedAssets ? 'cursor-pointer border-slate-100 text-slate-700' : 'text-slate-300'} ${!filterModifiedActive && hasModifiedAssets ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300 hover:bg-slate-300' : 'border-slate-100/0'}`}
          disabled={!hasModifiedAssets}
        >
          Modified
        </button>
      </div>

      <div className="border-l border-slate-300 pl-1">
        <button
          className={`flex items-center rounded-sm border border-slate-300/0 px-2 py-1 transition-colors ${
            filterActive
              ? 'cursor-pointer text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 hover:inset-shadow-xs hover:inset-shadow-white'
              : 'text-slate-300'
          }`}
          type="button"
          onClick={clearFilters}
          disabled={!filterActive}
        >
          <XMarkIcon className="mr-1 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
};
