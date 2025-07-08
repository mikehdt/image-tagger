import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';

import { selectFilteredAssets } from '../../../store/assets';
import { selectSearchQuery, setSearchQuery } from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  clearSelection,
  selectMultipleAssets,
  selectSelectedAssets,
} from '../../../store/selection';
import { Button } from '../../shared/button';

export const AssetSelectionControls = ({
  selectedAssetsCount,
}: {
  selectedAssetsCount: number;
}) => {
  const dispatch = useAppDispatch();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const searchQuery = useAppSelector(selectSearchQuery);

  const handleClearSelection = () => dispatch(clearSelection());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
    searchInputRef.current?.focus();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchActive(false);
    }
  };

  // Keep search input visible if there's a search query
  useEffect(() => {
    if (searchQuery && !isSearchActive) {
      setIsSearchActive(true);
    }
  }, [searchQuery, isSearchActive]);

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

  return (
    <>
      <div className="flex space-x-1 rounded-md bg-slate-100 p-1">
        <span
          className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1"
          title="Assets"
        >
          <IdentificationIcon className="w-4 text-slate-400" />
        </span>

        <span className="relative mr-2 flex items-center">
          <button
            className={`absolute inset-0 top-0.5 bottom-0.5 left-0.5 my-auto flex w-7 cursor-pointer justify-center text-slate-500 hover:text-slate-700 ${isSearchActive ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            onClick={handleSearchFocus}
          >
            <MagnifyingGlassIcon className="w-6 p-0.5" />
          </button>

          <input
            ref={searchInputRef}
            className={`rounded-sm px-2 py-1 text-sm transition-all ${
              isSearchActive
                ? 'w-40 opacity-100'
                : 'pointer-events-none w-7 opacity-0'
            }`}
            placeholder="Find by asset name..."
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
          />
        </span>

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
              : 'Add all filtered assets to selection'
          }
        >
          <SquaresPlusIcon className="w-4" />
          <span className="ml-2 max-lg:hidden">Select</span>
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
          <span className="ml-2 max-lg:hidden">Assets</span>
        </Button>
      </div>

      <span className="cursor-default rounded-full border border-slate-300 px-2 text-xs font-medium text-slate-400 tabular-nums">
        {selectedAssetsCount}
      </span>
    </>
  );
};
