import { useEffect } from 'react';

import { selectHasModifiedAssets } from '@/app/store/assets';
import {
  clearModifiedFilter,
  resetFilterModeIfNeeded,
  selectShowModified,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';

import { AssetSelectionControls } from './asset-controls/asset-selection-controls';
import { CategoryNavigation } from './category-navigation';
import { FilterListButton } from './filter-list/filter-list-button';
import { AssetCounts } from './info/asset-counts';
import { FilterIndicatorsInfo } from './info/filter-counts';
import { ProjectMenu } from './info/project-menu';
import { TagActions } from './tag-controls/tag-actions';

type TopShelfProps = {
  currentPage?: number;
};

export const TopShelf = ({ currentPage = 1 }: TopShelfProps) => {
  const dispatch = useAppDispatch();

  // Selectors needed for useEffects
  const filterModifiedActive = useAppSelector(selectShowModified);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);

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
      {/* Top information row - z-10 ensures popups appear above the toolbar row */}
      <div className="relative z-10 border-b border-b-slate-300/50 bg-white/90 shadow-xs shadow-slate-300 backdrop-blur-md">
        <div className="mx-auto flex max-w-400 items-center gap-2 px-4 py-1 text-sm text-slate-500">
          <ProjectMenu />

          <AssetCounts />

          <div className="ml-auto!">
            <FilterIndicatorsInfo />
          </div>
        </div>
      </div>

      {/* Main toolbar row */}
      <div className="border-t border-t-white/50 bg-white/80 shadow-md backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-400 items-center gap-2 px-4 text-sm">
          <CategoryNavigation currentPage={currentPage} />

          <div className="mr-auto!">
            <AssetSelectionControls />
          </div>

          <TagActions />

          <FilterListButton />
        </div>
      </div>
    </div>
  );
};
