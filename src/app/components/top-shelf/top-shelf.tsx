import { useRef } from 'react';

import {
  markFilterTagsToDelete,
  selectHasModifiedAssets,
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
import { clearSelection } from '../../store/selection';
import {
  FilterActions,
  FilterIndicators,
  FilterModeControls,
  TagFilterButton,
} from './components';
import { AssetSelectionControls } from './components/asset-selection-controls';

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

  // Action handlers
  const handleMarkFilterTagsToDelete = (tags: string[]) =>
    dispatch(markFilterTagsToDelete(tags));
  const handleClearFilters = () => dispatch(clearFilters());
  const handleSetTagFilterMode = (mode: FilterMode) =>
    dispatch(setTagFilterMode(mode));
  const handleToggleModifiedFilter = () => dispatch(toggleModifiedFilter());
  const handleClearSelection = () => dispatch(clearSelection());

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center space-x-2 px-4 text-sm">
        <AssetSelectionControls />

        <FilterIndicators
          filterSizes={filterSizes}
          filterTags={filterTags}
          filterExtensions={filterExtensions}
        />

        <FilterActions
          filterTags={filterTags}
          markFilterTagsToDelete={handleMarkFilterTagsToDelete}
          onClearSelection={handleClearSelection}
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
