import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo } from 'react';

import { Button } from '@/app/components/shared/button';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import {
  selectHasSubfolderAssets,
  selectSortDirection,
  selectSortType,
  setSortDirection,
  setSortType,
  SortDirection,
  SortType,
  toggleSortDirection,
} from '@/app/store/assets';
import {
  FilterMode,
  selectFilenamePatterns,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

/**
 * Get the appropriate sort direction label based on sort type
 */
const getSortDirectionLabel = (
  sortType: SortType,
  sortDirection: SortDirection,
): string => {
  const isAsc = sortDirection === SortDirection.ASC;

  switch (sortType) {
    case SortType.NAME:
      return isAsc ? 'A-Z' : 'Z-A';
    case SortType.IMAGE_SIZE:
    case SortType.BUCKET_SIZE:
      return isAsc ? '0-9' : '9-0';
    case SortType.SCALED:
      return isAsc ? '1:1' : 'Diff';
    case SortType.SELECTED:
    case SortType.FILTERED:
      return isAsc ? '✓' : '○';
    case SortType.FOLDER:
      return isAsc ? 'Root' : '9×';
    default:
      return isAsc ? 'A-Z' : 'Z-A';
  }
};

export const AssetSortControls = () => {
  const dispatch = useAppDispatch();

  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const filterMode = useAppSelector(selectFilterMode);
  const hasSubfolderAssets = useAppSelector(selectHasSubfolderAssets);

  // Filter state for determining if "Filtered" sort is available
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);

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

  // FILTERED sort is disabled when no filters are set, or when filter mode
  // already hides non-matching assets (Match Any/All/Inverse)
  const filteredSortDisabled =
    !filterSelectionActive ||
    filterMode === FilterMode.MATCH_ANY ||
    filterMode === FilterMode.MATCH_ALL ||
    filterMode === FilterMode.MATCH_NONE;

  // Auto-switch from "Selected" sort to "Name" when no assets are selected
  useEffect(() => {
    if (sortType === SortType.SELECTED && selectedAssetsCount === 0) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [sortType, selectedAssetsCount, dispatch]);

  // Auto-switch from "Filtered" sort to "Name" when filters are cleared or
  // filter mode changes to one that already hides non-matching assets
  useEffect(() => {
    if (sortType === SortType.FILTERED && filteredSortDisabled) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [sortType, filteredSortDisabled, dispatch]);

  // Auto-switch from "Folder" sort to "Name" when no subfolders exist
  useEffect(() => {
    if (sortType === SortType.FOLDER && !hasSubfolderAssets) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [sortType, hasSubfolderAssets, dispatch]);

  const handleSortTypeChange = useCallback(
    (newSortType: SortType) => {
      dispatch(setSortType(newSortType));
      // Reset sort direction to ascending (default) when changing sort type
      dispatch(setSortDirection(SortDirection.ASC));
    },
    [dispatch],
  );

  const handleToggleSortDirection = useCallback(() => {
    dispatch(toggleSortDirection());
  }, [dispatch]);

  const sortTypeItems: DropdownItem<SortType>[] = useMemo(
    () => [
      {
        value: SortType.NAME,
        label: 'Name',
      },
      {
        value: SortType.IMAGE_SIZE,
        label: 'Image Size',
      },
      {
        value: SortType.BUCKET_SIZE,
        label: 'Bucket Size',
      },
      {
        value: SortType.SCALED,
        label: 'Scaled',
      },
      {
        value: SortType.SELECTED,
        label: 'Selected',
        disabled: selectedAssetsCount === 0,
      },
      {
        value: SortType.FILTERED,
        label: 'Filtered',
        disabled: filteredSortDisabled,
      },
      {
        value: SortType.FOLDER,
        label: 'Folder',
        disabled: !hasSubfolderAssets,
      },
    ],
    [selectedAssetsCount, filteredSortDisabled, hasSubfolderAssets],
  );

  // Show as disabled styling if current sort type is no longer valid
  const showDisabledStyle =
    (sortType === SortType.SELECTED && selectedAssetsCount === 0) ||
    (sortType === SortType.FILTERED && filteredSortDisabled) ||
    (sortType === SortType.FOLDER && !hasSubfolderAssets);

  return (
    <>
      <Dropdown
        items={sortTypeItems}
        selectedValue={sortType}
        onChange={handleSortTypeChange}
        buttonClassName={showDisabledStyle ? 'text-slate-300' : ''}
      />

      <Button
        type="button"
        onClick={handleToggleSortDirection}
        variant="ghost"
        size="medium"
        title={`Sort ${sortDirection === SortDirection.ASC ? 'ascending' : 'descending'}`}
      >
        {sortDirection === SortDirection.ASC ? (
          <ArrowUpIcon className="w-4" />
        ) : (
          <ArrowDownIcon className="w-4" />
        )}

        <span className="ml-1 max-2xl:hidden">
          {getSortDirectionLabel(sortType, sortDirection)}
        </span>
      </Button>
    </>
  );
};
