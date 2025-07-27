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

import { AssetSelectionControls } from './asset-controls/asset-selection-controls';
import { CategoryNavigation } from './category-navigation';
import { FilterModeControls } from './filter-controls/filter-mode-controls';
import { FilterListButton } from './filter-list/filter-list-button';
import { AssetCounts } from './info/asset-counts';
import { FilterIndicatorsInfo } from './info/filter-counts';
import { ProjectInfo } from './info/project-info';
import { TagActions } from './tag-controls/tag-actions';

type TopShelfProps = {
  currentPage?: number;
};

export const TopShelf = ({ currentPage = 1 }: TopShelfProps) => {
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
    <div className="fixed top-0 left-0 z-20 w-full">
      {/* Top information row */}
      <div className="border-b border-b-slate-300/50 bg-white/90 shadow-xs shadow-slate-300 backdrop-blur-md">
        <div className="mx-auto flex max-w-400 items-center space-x-2 px-4 py-1 text-sm text-slate-500">
          <ProjectInfo />

          <AssetCounts selectedAssetsCount={selectedAssetsCount} />

          <div className="ml-auto!">
            <FilterIndicatorsInfo />
          </div>
        </div>
      </div>

      {/* Main toolbar row */}
      <div className="border-t border-t-white/50 bg-white/80 shadow-md backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-400 items-center space-x-2 px-4 text-sm">
          <CategoryNavigation currentPage={currentPage} />

          <div className="mr-auto!">
            <AssetSelectionControls selectedAssetsCount={selectedAssetsCount} />
          </div>

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
    </div>
  );
};
