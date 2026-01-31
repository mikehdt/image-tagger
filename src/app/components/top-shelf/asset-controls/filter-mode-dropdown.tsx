import { useCallback, useEffect, useMemo } from 'react';

import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import { selectHasTaglessAssets } from '@/app/store/assets';
import {
  FilterMode,
  selectFilenamePatterns,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  setTagFilterMode,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

export const FilterModeDropdown = () => {
  const dispatch = useAppDispatch();

  const filterMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);

  // Check if any filters are active (for enabling Match modes)
  const filterSelectionActive = useMemo(
    () =>
      !!(
        filterTags.length ||
        filterSizes.length ||
        filterBuckets.length ||
        filterExtensions.length ||
        filenamePatterns.length
      ),
    [
      filterTags.length,
      filterSizes.length,
      filterBuckets.length,
      filterExtensions.length,
      filenamePatterns.length,
    ],
  );

  // Auto-switch filter mode to "Show All" when the mode's requirements are no longer met
  useEffect(() => {
    const shouldReset =
      ((filterMode === FilterMode.MATCH_ANY ||
        filterMode === FilterMode.MATCH_ALL ||
        filterMode === FilterMode.MATCH_NONE) &&
        !filterSelectionActive) ||
      (filterMode === FilterMode.SELECTED_ASSETS &&
        selectedAssetsCount === 0) ||
      (filterMode === FilterMode.TAGLESS && !hasTaglessAssets);

    if (shouldReset) {
      dispatch(setTagFilterMode(FilterMode.SHOW_ALL));
    }
  }, [
    filterMode,
    filterSelectionActive,
    selectedAssetsCount,
    hasTaglessAssets,
    dispatch,
  ]);

  const handleSetFilterMode = useCallback(
    (mode: FilterMode) => dispatch(setTagFilterMode(mode)),
    [dispatch],
  );

  const filterModeItems: DropdownItem<FilterMode>[] = useMemo(
    () => [
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
        label: 'Show Inverse',
        disabled: !filterSelectionActive,
      },
      {
        value: FilterMode.SELECTED_ASSETS,
        label: 'Selected',
        disabled: selectedAssetsCount === 0,
      },
      {
        value: FilterMode.TAGLESS,
        label: 'Tagless',
        disabled: !hasTaglessAssets,
      },
    ],
    [filterSelectionActive, selectedAssetsCount, hasTaglessAssets],
  );

  // Show as disabled styling if current mode requires something unavailable
  const showDisabledStyle =
    ((filterMode === FilterMode.MATCH_ANY ||
      filterMode === FilterMode.MATCH_ALL ||
      filterMode === FilterMode.MATCH_NONE) &&
      !filterSelectionActive) ||
    (filterMode === FilterMode.SELECTED_ASSETS && selectedAssetsCount === 0) ||
    (filterMode === FilterMode.TAGLESS && !hasTaglessAssets);

  return (
    <Dropdown
      items={filterModeItems}
      selectedValue={filterMode}
      onChange={handleSetFilterMode}
      buttonClassName={showDisabledStyle ? 'text-slate-300' : ''}
    />
  );
};
