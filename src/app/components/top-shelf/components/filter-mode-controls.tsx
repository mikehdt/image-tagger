import { FunnelIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

import { Button } from '@/app/components/shared/button';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import { FilterMode } from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

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
  // Get selected assets count from Redux
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Derive filter selection active state (for traditional tag/size/extension filters)
  const filterSelectionActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length
  );

  // Check if we have selected assets
  const hasSelectedAssets = selectedAssetsCount > 0;

  // Derive overall filter active state
  const filterActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length ||
    filterModifiedActive
  );

  // Create filter mode dropdown items
  const filterModeItems: DropdownItem<FilterMode>[] = [
    {
      value: FilterMode.SHOW_ALL,
      label: 'Show All',
    },
    {
      value: FilterMode.MATCH_ANY,
      label: 'Any Tags',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.MATCH_ALL,
      label: 'All Tags',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.MATCH_NONE,
      label: 'Exclude Tags',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.SELECTED_ASSETS,
      label: 'Chosen Assets',
      disabled: !hasSelectedAssets,
    },
  ];

  return (
    <div className="inline-flex items-center rounded-md bg-slate-100 p-1">
      <span
        className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1 text-slate-400"
        title="Filters"
      >
        <FunnelIcon className="w-4" />
      </span>

      <Dropdown
        items={filterModeItems}
        selectedValue={filterTagsMode}
        onChange={setTagFilterMode}
        buttonClassName={`mr-2 ${
          // Show as disabled if we're in a mode that requires something that's not available
          (filterTagsMode !== FilterMode.SHOW_ALL &&
            filterTagsMode !== FilterMode.SELECTED_ASSETS &&
            !filterSelectionActive) ||
          (filterTagsMode === FilterMode.SELECTED_ASSETS && !hasSelectedAssets)
            ? 'text-slate-300'
            : ''
        }`}
      />

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

      <Button
        variant="ghost"
        type="button"
        onClick={clearFilters}
        disabled={!filterActive}
        ghostDisabled={!filterActive}
        size="medium"
        className="flex items-center"
      >
        <NoSymbolIcon className="w-4" />
        <span className="ml-2 max-lg:hidden">Filters</span>
      </Button>
    </div>
  );
};
