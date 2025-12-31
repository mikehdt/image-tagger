import {
  CubeIcon,
  CubeTransparentIcon,
  FunnelIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import {
  selectHasModifiedAssets,
  selectHasTaglessAssets,
} from '@/app/store/assets';
import {
  clearFilters,
  FilterMode,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterMode,
  selectFilenamePatterns,
  selectFilterSizes,
  selectFilterTags,
  selectHasActiveFilters,
  selectShowModified,
  setTagFilterMode,
  toggleModifiedFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';

const FilterModeControlsComponent = () => {
  const dispatch = useAppDispatch();

  // Get selectors from Redux
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  // Action handlers
  const handleSetTagFilterMode = useCallback(
    (mode: FilterMode) => dispatch(setTagFilterMode(mode)),
    [dispatch],
  );
  const handleToggleModifiedFilter = useCallback(
    () => dispatch(toggleModifiedFilter()),
    [dispatch],
  );
  const handleClearFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
  );

  // Derive filter selection active state (for traditional tag/size/bucket/extension/filename filters)
  const filterSelectionActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterBuckets.length ||
    filterExtensions.length ||
    filenamePatterns.length
  );

  // Check if we have selected assets
  const hasSelectedAssets = selectedAssetsCount > 0;

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
      title="Tag Filtering"
      position="right"
    >
      <Dropdown
        items={filterModeItems}
        selectedValue={filterTagsMode}
        onChange={handleSetTagFilterMode}
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
        onClick={handleToggleModifiedFilter}
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
        onClick={handleClearFilters}
        disabled={!hasActiveFilters}
        ghostDisabled={!hasActiveFilters}
        size="medium"
        className="flex items-center"
      >
        <NoSymbolIcon className="w-4" />
      </Button>
    </ResponsiveToolbarGroup>
  );
};

export const FilterModeControls = memo(FilterModeControlsComponent);
