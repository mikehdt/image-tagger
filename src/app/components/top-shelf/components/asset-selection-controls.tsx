import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { selectFilteredAssets, selectImageCount } from '@/app/store/assets';
import {
  selectSearchQuery,
  selectSortDirection,
  selectSortType,
  setSearchQuery,
  setSortType,
  SortDirection,
  SortType,
  toggleSortDirection,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectShowCropVisualization,
  toggleCropVisualization,
} from '@/app/store/project';
import {
  clearSelection,
  selectMultipleAssets,
  selectSelectedAssets,
} from '@/app/store/selection';

import { Button } from '../../shared/button';
import { Dropdown, DropdownItem } from '../../shared/dropdown';
import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';

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
    case SortType.SELECTED:
      return isAsc ? '✓' : '○'; // ✓ for selected first, ○ for unselected first
    default:
      return isAsc ? 'A-Z' : 'Z-A';
  }
};

export const AssetSelectionControls = ({
  selectedAssetsCount,
}: {
  selectedAssetsCount: number;
}) => {
  const dispatch = useAppDispatch();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);

  const showCropVisualization = useAppSelector(selectShowCropVisualization);

  const handleToggleCropVisualization = () => {
    dispatch(toggleCropVisualization());
  };

  const handleClearSelection = () => dispatch(clearSelection());

  const handleSortTypeChange = useCallback(
    (newSortType: SortType) => {
      dispatch(setSortType(newSortType));
    },
    [dispatch],
  );

  const handleToggleSortDirection = useCallback(() => {
    dispatch(toggleSortDirection());
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(e.target.value));
    },
    [dispatch],
  );

  const handleSearchClear = useCallback(() => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    dispatch(setSearchQuery(''));
    // Add a small delay to let animations complete before closing (helps with Firefox jumping)
    setTimeout(() => {
      setIsSearchActive(false);
    }, 100);
  }, [dispatch]);

  const handleSearchFocus = useCallback(() => {
    // Clear any pending blur timeout when focusing
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsSearchActive(true);

    // Find and focus the visible input (handles responsive design with duplicate inputs)
    setTimeout(() => {
      const allInputs = document.querySelectorAll(
        'input[data-search-input="asset-name"]',
      );

      const visibleInput = Array.from(allInputs).find((element) => {
        const inp = element as HTMLInputElement;
        const styles = getComputedStyle(inp);
        return (
          inp.offsetWidth > 0 && inp.offsetHeight > 0 && styles.opacity !== '0'
        );
      }) as HTMLInputElement | undefined;

      if (visibleInput) {
        visibleInput.focus();
      }
    }, 100);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Add a slight delay before closing the search to allow for re-focusing
    blurTimeoutRef.current = setTimeout(() => {
      setIsSearchActive(false);
    }, 250);
  }, []);

  const handleInputFocus = useCallback(() => {
    // Cancel any pending blur timeout when input is focused
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsSearchActive(false);
        // Blur the input to remove focus
        e.currentTarget.blur();
      }
    },
    [],
  );

  // Get filtered assets directly from the selector
  const allAssetsCount = useAppSelector(selectImageCount);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Check if all currently filtered assets are selected
  const allFilteredAssetsSelected = useMemo(() => {
    if (filteredAssets.length === 0) return true; // No assets to select
    return filteredAssets.every((asset) =>
      selectedAssets.includes(asset.fileId),
    );
  }, [filteredAssets, selectedAssets]);

  const handleAddAllToSelection = () => {
    const assetIds = filteredAssets.map((asset) => asset.fileId);
    dispatch(selectMultipleAssets(assetIds));
  };

  // Create sort type dropdown items
  const sortTypeItems: DropdownItem<SortType>[] = [
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
      value: SortType.SELECTED,
      label: 'Selected',
      disabled: selectedAssetsCount === 0,
    },
  ];

  return (
    <ResponsiveToolbarGroup
      icon={<IdentificationIcon className="w-4" />}
      title="Asset Selection"
      position="left"
    >
      <Button
        variant="ghost"
        color="slate"
        size="medium"
        onClick={handleToggleCropVisualization}
        isPressed={showCropVisualization}
        title={`${showCropVisualization ? 'Hide' : 'Show'} crop visualisation`}
      >
        {showCropVisualization ? (
          <EyeSlashIcon className="w-4" />
        ) : (
          <EyeIcon className="w-4" />
        )}
      </Button>

      <span className="h-7 w-0 border-r border-l border-r-slate-300 border-l-white" />

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

      <span className="h-7 w-0 border-r border-l border-r-slate-300 border-l-white" />

      <span className="relative flex items-center">
        <Button
          className={`absolute top-0.5 bottom-0.5 my-auto px-1 ${isSearchActive ? 'pointer-events-none opacity-0' : ''}`}
          size="small"
          variant="ghost"
          isPressed={searchQuery.length > 0 && !isSearchActive}
          onClick={handleSearchFocus}
        >
          <MagnifyingGlassIcon className="w-5" />
        </Button>

        <input
          ref={searchInputRef}
          data-search-input="asset-name"
          className={`rounded-sm border border-white/0 bg-white px-2 py-1 text-sm inset-shadow-sm inset-shadow-slate-300 transition-all ${
            isSearchActive
              ? 'w-50 pe-7 opacity-100'
              : 'pointer-events-none w-7 opacity-0'
          }`}
          placeholder="Find by asset name..."
          value={searchQuery}
          onChange={handleSearchChange}
          onBlur={handleSearchBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
        />

        {isSearchActive ? (
          <span
            // In edit mode, the cancel button should always be active regardless of input value
            className="absolute top-0 right-1 bottom-0 mt-auto mb-auto ml-2 h-5 w-5 cursor-pointer rounded-full p-0.5 text-slate-600 transition-colors hover:bg-slate-500 hover:text-white"
            onClick={handleSearchClear}
            tabIndex={0}
            title="Clear search"
          >
            <XMarkIcon />
          </span>
        ) : null}
      </span>

      {!isSearchActive ? (
        <>
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
            <span
              className={`ml-2 max-xl:hidden ${isSearchActive ? 'hidden' : ''}`}
            >
              {filteredAssets.length === allAssetsCount
                ? 'Select All'
                : 'Select Filtered'}
            </span>
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
        </>
      ) : null}
    </ResponsiveToolbarGroup>
  );
};
