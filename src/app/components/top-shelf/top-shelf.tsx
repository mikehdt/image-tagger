import { useEffect, useRef } from 'react';

import {
  markFilterTagsToDelete,
  selectHasModifiedAssets,
} from '../../store/assets';
import {
  clearFilters,
  clearModifiedFilter,
  FilterMode,
  resetFilterModeIfNeeded,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
  setTagFilterMode,
  toggleModifiedFilter,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSelectedAssetsCount } from '../../store/selection';
import {
  AssetSelectionControls,
  FilterIndicators,
  FilterModeControls,
  TagActions,
  TagFilterButton,
} from './components';

export const TopShelf = () => {
  const tagButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Filter selectors
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Action handlers
  const handleMarkFilterTagsToDelete = (tags: string[]) =>
    dispatch(markFilterTagsToDelete(tags));
  const handleClearFilters = () => dispatch(clearFilters());
  const handleSetTagFilterMode = (mode: FilterMode) =>
    dispatch(setTagFilterMode(mode));
  const handleToggleModifiedFilter = () => dispatch(toggleModifiedFilter());

  // Effect to automatically clear the modified filter when there are no more modified assets
  useEffect(() => {
    if (filterModifiedActive && !hasModifiedAssets) {
      dispatch(clearModifiedFilter());
    }
  }, [filterModifiedActive, hasModifiedAssets, dispatch]);

  // Effect to reset filter mode when selected assets are cleared
  useEffect(() => {
    dispatch(
      resetFilterModeIfNeeded({ hasSelectedAssets: selectedAssetsCount > 0 }),
    );
  }, [selectedAssetsCount, dispatch]);

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center space-x-2 px-4 text-sm">
        <AssetSelectionControls selectedAssetsCount={selectedAssetsCount} />

        <FilterIndicators
          filterSizes={filterSizes}
          filterTags={filterTags}
          filterExtensions={filterExtensions}
        />

        <TagActions
          filterTags={filterTags}
          selectedAssetsCount={selectedAssetsCount}
          markFilterTagsToDelete={handleMarkFilterTagsToDelete}
        />

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

        <TagFilterButton tagButtonRef={tagButtonRef} />
      </div>
    </div>
  );
};
