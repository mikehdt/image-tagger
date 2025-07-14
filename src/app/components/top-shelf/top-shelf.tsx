import { useCallback, useEffect } from 'react';

import { selectHasModifiedAssets } from '@/app/store/assets';
import {
  clearFilters,
  clearModifiedFilter,
  FilterMode,
  resetFilterModeIfNeeded,
  selectShowModified,
  setTagFilterMode,
  toggleModifiedFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

import {
  AssetSelectionControls,
  FilterIndicators,
  FilterListButton,
  FilterModeControls,
  TagActions,
} from './components';

export const TopShelf = () => {
  const dispatch = useAppDispatch();

  // Filter selectors (only keeping ones needed for useEffects)
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

  // Action handlers
  const handleClearFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
  );
  const handleSetTagFilterMode = useCallback(
    (mode: FilterMode) => dispatch(setTagFilterMode(mode)),
    [dispatch],
  );
  const handleToggleModifiedFilter = useCallback(
    () => dispatch(toggleModifiedFilter()),
    [dispatch],
  );

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

        <FilterIndicators />

        <TagActions selectedAssetsCount={selectedAssetsCount} />

        <FilterModeControls
          filterModifiedActive={filterModifiedActive}
          hasModifiedAssets={hasModifiedAssets}
          setTagFilterMode={handleSetTagFilterMode}
          toggleModifiedFilter={handleToggleModifiedFilter}
          clearFilters={handleClearFilters}
        />

        <FilterListButton />
      </div>
    </div>
  );
};
