import { ArrowPathIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import {
  IoState,
  loadAllAssets,
  markFilterTagsToDelete,
  selectHasModifiedAssets,
  selectIoState,
  selectLoadProgress,
  selectSaveProgress,
} from '../../store/assets';
import {
  clearFilters,
  FilterMode,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
  setTagFilterMode,
  toggleModifiedFilter,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addTagToSelectedAssets,
  clearSelection,
  selectHasSelectedAssets,
  selectSelectedAssetsCount,
} from '../../store/selection';
import {
  FilterActions,
  FilterIndicators,
  FilterModeControls,
  LoadingStatus,
  TagFilterButton,
} from './components';
import { AddTagsModal } from './components/add-tags-modal';

export const TopShelf = () => {
  const tagButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  // IO state selectors
  const ioState = useAppSelector(selectIoState);
  const saveProgress = useAppSelector(selectSaveProgress) || null;
  const loadProgress = useAppSelector(selectLoadProgress) || null;

  // Filter selectors
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);

  // Selection selectors
  const hasSelectedAssets = useAppSelector(selectHasSelectedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Action handlers
  const doRefresh = () => dispatch(loadAllAssets());
  const handleMarkFilterTagsToDelete = (tags: string[]) =>
    dispatch(markFilterTagsToDelete(tags));
  const handleClearFilters = () => dispatch(clearFilters());
  const handleSetTagFilterMode = (mode: FilterMode) =>
    dispatch(setTagFilterMode(mode));
  const handleToggleModifiedFilter = () => dispatch(toggleModifiedFilter());
  const handleClearSelection = () => dispatch(clearSelection());

  // Handler for adding tags to selected assets
  const handleAddTag = (tag: string) => {
    dispatch(addTagToSelectedAssets(tag));
    // Close the modal after adding the tag
    setIsAddTagsModalOpen(false);
  };

  // No derived state needed - moved to individual components

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4 text-sm">
        <div className="flex py-2">
          {/* Loading status or refresh button */}
          {ioState === IoState.LOADING || ioState === IoState.SAVING ? (
            <LoadingStatus
              ioState={ioState}
              saveProgress={saveProgress}
              loadProgress={loadProgress}
            />
          ) : (
            <button
              type="button"
              onClick={doRefresh}
              className="mr-4 inline-flex cursor-pointer"
              title="Reload asset list"
            >
              <ArrowPathIcon className="w-6" />
            </button>
          )}
        </div>
        {/* Asset actions */}
        {hasSelectedAssets && (
          <div className="mr-4 flex">
            <button
              type="button"
              onClick={() => setIsAddTagsModalOpen(true)}
              className="mr-2 flex cursor-pointer items-center rounded-md border border-sky-500 bg-sky-500 px-3 py-1 text-white inset-shadow-xs inset-shadow-sky-300 transition-colors hover:bg-sky-600"
              title="Add tags to selected assets"
            >
              <TagIcon className="mr-1 h-4 w-4" />
              <span>Add Tags</span>
              <span className="ml-2 rounded-full bg-white px-1 text-xs font-bold text-sky-500 tabular-nums">
                {selectedAssetsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-slate-200 px-2 py-1 inset-shadow-xs inset-shadow-white transition-colors hover:bg-slate-300"
              title="Clear selection"
            >
              <XMarkIcon className="mr-1 w-4" /> <span>Clear</span>
            </button>
          </div>
        )}
        {/* Filter actions */}
        <FilterActions
          filterTags={filterTags}
          markFilterTagsToDelete={handleMarkFilterTagsToDelete}
        />
        {/* Filter indicators */}
        <FilterIndicators
          filterSizes={filterSizes}
          filterTags={filterTags}
          filterExtensions={filterExtensions}
        />
        {/* Filter mode controls */}
        <FilterModeControls
          filterTagsMode={filterTagsMode}
          filterModifiedActive={filterModifiedActive}
          hasModifiedAssets={hasModifiedAssets}
          filterTags={filterTags}
          filterSizes={filterSizes}
          filterExtensions={filterExtensions}
          setTagFilterMode={handleSetTagFilterMode}
          toggleModifiedFilter={handleToggleModifiedFilter}
          clearFilters={handleClearFilters}
        />
        {/* Tag filter button */}
        <TagFilterButton tagButtonRef={tagButtonRef} />
      </div>

      {/* Add Tags Modal */}
      <AddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={() => setIsAddTagsModalOpen(false)}
        selectedAssetsCount={selectedAssetsCount}
        onAddTag={handleAddTag}
      />
    </div>
  );
};
