import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  SquaresPlusIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useMemo, useRef, useState } from 'react';

import { selectFilteredAssets } from '../../../store/assets';
import { selectSearchQuery, setSearchQuery } from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  addTagToSelectedAssets,
  clearSelection,
  selectMultipleAssets,
  selectSelectedAssets,
  selectSelectedAssetsCount,
} from '../../../store/selection';
import { Button } from '../../shared/button';
import { AddTagsModal } from './add-tags-modal';

export const AssetSelectionControls = () => {
  const dispatch = useAppDispatch();
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const searchQuery = useAppSelector(selectSearchQuery);

  const handleClearSelection = () => dispatch(clearSelection());
  const handleCloseModal = () => setIsAddTagsModalOpen(false);

  const handleAddTag = (tag: string, addToStart = false) => {
    dispatch(addTagToSelectedAssets({ tagName: tag, addToStart }));
    setIsAddTagsModalOpen(false);
  };

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
    <div className="flex space-x-1 rounded-md bg-slate-100 p-1">
      <span
        className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1"
        title="Assets"
      >
        <IdentificationIcon className="w-4 text-slate-400" />
      </span>

      <span className="relative flex items-center border-r border-dotted border-r-slate-400 pr-2">
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

      <Button
        type="button"
        onClick={() => setIsAddTagsModalOpen(true)}
        disabled={selectedAssetsCount < 2}
        variant="ghost"
        color="slate"
        size="medium"
        title="Add tags to selected assets"
      >
        <TagIcon className="w-4" />
        <span className="ml-2 max-lg:hidden">Add Tags</span>
        <span className="ml-2 rounded-full bg-white px-1 text-xs font-medium text-slate-400 tabular-nums">
          {selectedAssetsCount}
        </span>
      </Button>

      <AddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={handleCloseModal}
        onClearSelection={handleClearSelection}
        selectedAssetsCount={selectedAssetsCount}
        onAddTag={handleAddTag}
      />
    </div>
  );
};
