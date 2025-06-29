import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';

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
  FilterActions,
  FilterIndicators,
  FilterModeControls,
  LoadingStatus,
  TagFilterButton,
} from './components';

export const TopShelf = () => {
  const tagButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

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

  // Action handlers
  const doRefresh = () => dispatch(loadAllAssets());
  const handleMarkFilterTagsToDelete = (tags: string[]) =>
    dispatch(markFilterTagsToDelete(tags));
  const handleClearFilters = () => dispatch(clearFilters());
  const handleSetTagFilterMode = (mode: FilterMode) =>
    dispatch(setTagFilterMode(mode));
  const handleToggleModifiedFilter = () => dispatch(toggleModifiedFilter());

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

        {/* Filter actions */}
        <FilterActions
          filterTags={filterTags}
          filterSizes={filterSizes}
          filterExtensions={filterExtensions}
          filterModifiedActive={filterModifiedActive}
          markFilterTagsToDelete={handleMarkFilterTagsToDelete}
          clearFilters={handleClearFilters}
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
        />

        {/* Tag filter button */}
        <TagFilterButton tagButtonRef={tagButtonRef} />
      </div>
    </div>
  );
};
