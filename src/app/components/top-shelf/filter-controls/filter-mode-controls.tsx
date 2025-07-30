import {
  CubeIcon,
  CubeTransparentIcon,
  FunnelIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/app/components/shared/button';
import {
  DropdownItem,
  DropdownV2 as Dropdown,
} from '@/app/components/shared/dropdown';
import { selectHasTaglessAssets } from '@/app/store/assets';
import {
  FilterMode,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

import { ResponsiveToolbarGroupV2 as ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';

interface FilterModeControlsProps {
  filterModifiedActive: boolean;
  hasModifiedAssets: boolean;
  setTagFilterMode: (mode: FilterMode) => void;
  toggleModifiedFilter: () => void;
  clearFilters: () => void;
}

export const FilterModeControls = ({
  filterModifiedActive,
  hasModifiedAssets,
  setTagFilterMode,
  toggleModifiedFilter,
  clearFilters,
}: FilterModeControlsProps) => {
  // Get selectors from Redux
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);

  // Derive filter selection active state (for traditional tag/size/bucket/extension filters)
  const filterSelectionActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterBuckets.length ||
    filterExtensions.length
  );

  // Check if we have selected assets
  const hasSelectedAssets = selectedAssetsCount > 0;

  // Derive overall filter active state
  const filterActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterBuckets.length ||
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
      label: 'Exclude Filters',
      disabled: !filterSelectionActive,
    },
    {
      value: FilterMode.SELECTED_ASSETS,
      label: 'Selected Assets',
      disabled: !hasSelectedAssets,
    },
    {
      value: FilterMode.TAGLESS,
      label: 'Tagless',
      disabled: !hasTaglessAssets,
    },
  ];

  return (
    <ResponsiveToolbarGroup
      icon={<FunnelIcon className="w-4" />}
      title="Tag Actions"
      position="right"
    >
      <Dropdown
        items={filterModeItems}
        selectedValue={filterTagsMode}
        onChange={setTagFilterMode}
        buttonClassName={
          // Show as disabled if we're in a mode that requires something that's not available
          (filterTagsMode !== FilterMode.SHOW_ALL &&
            filterTagsMode !== FilterMode.SELECTED_ASSETS &&
            filterTagsMode !== FilterMode.TAGLESS &&
            !filterSelectionActive) ||
          (filterTagsMode === FilterMode.SELECTED_ASSETS &&
            !hasSelectedAssets) ||
          (filterTagsMode === FilterMode.TAGLESS && !hasTaglessAssets)
            ? 'text-slate-300'
            : ''
        }
      />

      <Button
        type="button"
        onClick={toggleModifiedFilter}
        variant="deep-toggle"
        isPressed={filterModifiedActive}
        disabled={!hasModifiedAssets}
        ghostDisabled={!hasModifiedAssets}
        size="medium"
      >
        {filterModifiedActive ? (
          <CubeIcon className="w-4" />
        ) : (
          <CubeTransparentIcon className="w-4" />
        )}
        <span className="ml-2 max-lg:hidden">Modified</span>
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
      </Button>
    </ResponsiveToolbarGroup>
  );
};
