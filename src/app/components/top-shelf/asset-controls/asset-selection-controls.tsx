import {
  ArrowDownIcon,
  ArrowUpIcon,
  CubeIcon,
  CubeTransparentIcon,
  IdentificationIcon,
  NoSymbolIcon,
  SparklesIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import {
  selectFilteredAssets,
  selectHasModifiedAssets,
  selectHasTaglessAssets,
  selectImageCount,
} from '@/app/store/assets';
import {
  selectSortDirection,
  selectSortType,
  setSortDirection,
  setSortType,
  SortDirection,
  SortType,
  toggleSortDirection,
} from '@/app/store/assets';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import {
  FilterMode,
  selectFilenamePatterns,
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
  setTagFilterMode,
  toggleModifiedFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  clearSelection,
  selectMultipleAssets,
  selectSelectedAssets,
} from '@/app/store/selection';
import { selectSelectedAssetsData } from '@/app/store/selection/combinedSelectors';

import { Button } from '../../shared/button';
import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';

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
      return isAsc ? '✓' : '○';
    default:
      return isAsc ? 'A-Z' : 'Z-A';
  }
};

const AssetSelectionControlsComponent = () => {
  const dispatch = useAppDispatch();
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const selectedAssetsCount = selectedAssets.length;
  const selectedAssetsData = useAppSelector(selectSelectedAssetsData);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const allAssetsCount = useAppSelector(selectImageCount);

  // Filter mode state
  const filterMode = useAppSelector(selectFilterMode);
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const hasTaglessAssets = useAppSelector(selectHasTaglessAssets);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);

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

  // Auto-tagger state
  const [isAutoTaggerModalOpen, setIsAutoTaggerModalOpen] = useState(false);
  const hasReadyModel = useAppSelector(selectHasReadyModel);
  const isAutoTaggerInitialised = useAppSelector(selectIsInitialised);

  // Fetch auto-tagger models on mount to determine if any are ready
  useEffect(() => {
    if (!isAutoTaggerInitialised) {
      fetch('/api/auto-tagger/models')
        .then((res) => res.json())
        .then((data) => {
          dispatch(setModelsAndProviders(data));
        })
        .catch(console.error);
    }
  }, [isAutoTaggerInitialised, dispatch]);

  // Prepare selected assets for auto-tagger (only need fileId and extension)
  const selectedAssetsForTagger = useMemo(
    () =>
      selectedAssetsData.map((asset) => ({
        fileId: asset.fileId,
        fileExtension: asset.fileExtension,
      })),
    [selectedAssetsData],
  );

  const openAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(true),
    [],
  );

  const handleOnCloseAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(false),
    [],
  );

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
    // If currently sorted by "Selected", switch back to "Name" when clearing selection
    if (sortType === SortType.SELECTED) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [dispatch, sortType]);

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

  const handleSetFilterMode = useCallback(
    (mode: FilterMode) => dispatch(setTagFilterMode(mode)),
    [dispatch],
  );

  const handleToggleModifiedFilter = useCallback(
    () => dispatch(toggleModifiedFilter()),
    [dispatch],
  );

  // Auto-switch from "Selected" sort to "Name" when no assets are selected
  useEffect(() => {
    if (sortType === SortType.SELECTED && selectedAssetsCount === 0) {
      dispatch(setSortType(SortType.NAME));
      dispatch(setSortDirection(SortDirection.ASC));
    }
  }, [sortType, selectedAssetsCount, dispatch]);

  // Check if all currently filtered assets are selected
  const allFilteredAssetsSelected = useMemo(() => {
    if (filteredAssets.length === 0) return true;
    return filteredAssets.every((asset) =>
      selectedAssets.includes(asset.fileId),
    );
  }, [filteredAssets, selectedAssets]);

  const handleAddAllToSelection = useCallback(() => {
    const assetIds = filteredAssets.map((asset) => asset.fileId);
    dispatch(selectMultipleAssets(assetIds));
  }, [dispatch, filteredAssets]);

  // Create sort type dropdown items
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
    ],
    [selectedAssetsCount],
  );

  // Create filter mode dropdown items
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
        label: 'Exclude Filters',
        disabled: !filterSelectionActive,
      },
      {
        value: FilterMode.SELECTED_ASSETS,
        label: 'Selected Only',
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

  return (
    <>
      <ResponsiveToolbarGroup
        icon={<IdentificationIcon className="w-4" />}
        title="Assets"
        position="left"
        breakpoint="large"
      >
        <Dropdown
          items={sortTypeItems}
          selectedValue={sortType}
          onChange={handleSortTypeChange}
          buttonClassName={
            sortType === SortType.SELECTED && selectedAssetsCount === 0
              ? 'text-slate-300'
              : ''
          }
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

          <span className="ml-1 max-xl:hidden">
            {getSortDirectionLabel(sortType, sortDirection)}
          </span>
        </Button>

        <ToolbarDivider />

        <Dropdown
          items={filterModeItems}
          selectedValue={filterMode}
          onChange={handleSetFilterMode}
          buttonClassName={
            // Show as disabled if current mode requires something unavailable
            ((filterMode === FilterMode.MATCH_ANY ||
              filterMode === FilterMode.MATCH_ALL ||
              filterMode === FilterMode.MATCH_NONE) &&
              !filterSelectionActive) ||
            (filterMode === FilterMode.SELECTED_ASSETS &&
              selectedAssetsCount === 0) ||
            (filterMode === FilterMode.TAGLESS && !hasTaglessAssets)
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
          <span className="ml-2 max-xl:hidden">Modified</span>
        </Button>

        <ToolbarDivider />

        <Button
          type="button"
          onClick={handleAddAllToSelection}
          disabled={allFilteredAssetsSelected || filteredAssets.length === 0}
          variant="ghost"
          color="slate"
          size="medium"
          title={
            allFilteredAssetsSelected
              ? 'All filtered assets already selected'
              : filteredAssets.length === allAssetsCount
                ? 'Add all assets to selection'
                : 'Add all filtered assets to selection'
          }
        >
          <SquaresPlusIcon className="w-4" />
          <span className="ml-2 max-xl:hidden">
            {filteredAssets.length === allAssetsCount
              ? 'Select All'
              : 'Select Filtered'}
          </span>
        </Button>

        <Button
          type="button"
          onClick={openAutoTaggerModal}
          disabled={!hasReadyModel || selectedAssetsCount === 0}
          variant="ghost"
          color="slate"
          size="medium"
          title={
            !hasReadyModel
              ? 'Set up auto-tagger first (Project menu)'
              : selectedAssetsCount === 0
                ? 'Select assets to auto-tag'
                : `Auto-tag ${selectedAssetsCount} selected asset${selectedAssetsCount === 1 ? '' : 's'}`
          }
        >
          <SparklesIcon className="w-4" />
          <span className="ml-2 max-xl:hidden">Tag</span>
        </Button>

        <Button
          type="button"
          onClick={handleClearSelection}
          disabled={selectedAssetsCount === 0}
          variant="ghost"
          color="slate"
          size="medium"
          title="Clear selection"
        >
          <NoSymbolIcon className="w-4" />
        </Button>
      </ResponsiveToolbarGroup>

      <AutoTaggerModal
        isOpen={isAutoTaggerModalOpen}
        onClose={handleOnCloseAutoTaggerModal}
        selectedAssets={selectedAssetsForTagger}
      />
    </>
  );
};

export const AssetSelectionControls = memo(AssetSelectionControlsComponent);
