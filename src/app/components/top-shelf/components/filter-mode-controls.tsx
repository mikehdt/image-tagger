import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Button } from '../../../components/shared/button';
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
    <div className="inline-flex items-center rounded-md bg-slate-100 p-1">
      <span className="mr-1 border-r border-dotted border-r-slate-400 py-2 pr-1 text-slate-400">
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
        <Button
          type="button"
          onClick={toggleModifiedFilter}
          variant="deep-toggle"
          isPressed={filterModifiedActive}
          disabled={!hasModifiedAssets}
          ghostDisabled={!hasModifiedAssets}
          size="medium"
          className="px-2"
        >
          Modified
        </Button>
      </div>

      <div className="border-l border-slate-300 pl-1">
        <Button
          variant="ghost"
          type="button"
          onClick={clearFilters}
          disabled={!filterActive}
          ghostDisabled={!filterActive}
          size="medium"
          className="flex items-center"
        >
          <XMarkIcon className="w-4" />
          <span className="ml-2 max-lg:hidden">Clear</span>
        </Button>
      </div>
    </div>
  );
};
