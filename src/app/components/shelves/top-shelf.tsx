import {
  ArrowPathIcon,
  BookmarkSlashIcon,
  BookmarkSquareIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  DocumentMinusIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import {
  IoState,
  loadAllAssets,
  markFilterTagsToDelete,
  resetAllTags,
  saveAllAssets,
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
import { FilterList } from '../filter-list/filter-list';
import { PersistentFilterProvider } from '../filter-list/persistent-filter-context';
import { Loader } from '../loader';

export const TopShelf = () => {
  const [isTagPanelOpen, setIsTagPanelOpen] = useState<boolean>(false);
  const tagButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const showLoader = ioState === IoState.LOADING || ioState === IoState.SAVING;
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);
  const saveProgress = useAppSelector(selectSaveProgress);
  const loadProgress = useAppSelector(selectLoadProgress);
  const filterModifiedActive = useAppSelector(selectShowModified);

  const doRefresh = () => dispatch(loadAllAssets());
  const saveAllChanges = () => dispatch(saveAllAssets());
  const cancelAllChanges = () => dispatch(resetAllTags());

  const filterActive =
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length ||
    filterModifiedActive;

  const filterSelectionActive =
    filterTags.length || filterSizes.length || filterExtensions.length;

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center">
        <div className="flex py-2 pl-4">
          {showLoader ? (
            <>
              <div className="mr-4 w-6">
                <Loader />
              </div>

              <div className="mr-4 self-center text-xs font-medium text-slate-500 tabular-nums">
                {saveProgress && (
                  <>
                    {saveProgress.completed} / {saveProgress.total}
                    {saveProgress.failed > 0 &&
                      ` (${saveProgress.failed} error${saveProgress.failed !== 1 ? 's' : ''})`}
                  </>
                )}
                {loadProgress && (
                  <>
                    {loadProgress.total > 0
                      ? `${loadProgress.completed} / ${loadProgress.total}`
                      : ''}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={doRefresh}
                className="mr-4 inline-flex cursor-pointer"
                title="Reload asset list"
              >
                <ArrowPathIcon className="w-6" />
              </button>

              <button
                type="button"
                onClick={saveAllChanges}
                className={`mr-4 inline-flex items-center py-2 text-sm ${hasModifiedAssets ? 'cursor-pointer text-emerald-700' : 'cursor-not-allowed text-slate-300'}`}
                title={
                  hasModifiedAssets
                    ? 'Save all tag changes'
                    : 'No changes to save'
                }
                disabled={!hasModifiedAssets}
              >
                <BookmarkSquareIcon className="w-4" />
                <span className="ml-1 max-lg:hidden">Save All</span>
              </button>

              {/* TODO: Implement later */}
              {/* <button
                type="button"
                onClick={() => {}}
                className={`mr-4 inline-flex items-center py-2 text-sm ${hasModifiedAssets && filterActive ? 'cursor-pointer text-slate-700' : 'cursor-not-allowed text-slate-300'}`}
                title={
                  hasModifiedAssets && filterActive
                    ? 'Save only filtered tag changes'
                    : 'No filtered tags to save'
                }
                disabled={!hasModifiedAssets && !filterActive}
              >
                <BookmarkIcon className="mr-1 w-4" />
                Save Filtered
              </button> */}

              <button
                type="button"
                onClick={cancelAllChanges}
                className={`mr-4 inline-flex items-center py-2 text-sm ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'cursor-not-allowed text-slate-300'}`}
                title={
                  hasModifiedAssets
                    ? 'Cancel all tag changes'
                    : 'No changes to cancel'
                }
                disabled={!hasModifiedAssets}
              >
                <BookmarkSlashIcon className="w-4" />
                <span className="ml-1 max-lg:hidden">Cancel All</span>
              </button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center py-2 pr-4 pl-2 text-sm">
          <button
            className={`mr-4 inline-flex items-center py-2 ${
              filterTags.length
                ? 'cursor-pointer text-slate-700'
                : 'cursor-not-allowed text-slate-300'
            }`}
            type="button"
            onClick={() => dispatch(markFilterTagsToDelete(filterTags))}
            disabled={!filterTags.length}
            title="Toggle selected tags for deletion"
          >
            <DocumentMinusIcon className="mr-1 w-4" />
            Toggle Delete
          </button>

          <button
            className={`mr-4 inline-flex items-center py-2 ${
              filterActive
                ? 'cursor-pointer text-slate-700'
                : 'cursor-not-allowed text-slate-300'
            }`}
            type="button"
            onClick={() => dispatch(clearFilters())}
            disabled={!filterActive}
          >
            <XMarkIcon className="mr-1 w-4" />
            Clear Filters
          </button>

          <div className="flex cursor-default flex-col overflow-hidden rounded-sm border border-slate-200 text-center text-xs leading-3 tabular-nums">
            <span
              className={`px-2 text-sky-500 ${filterSizes.length ? 'bg-sky-100' : ''}`}
              title="Active size filters"
            >
              {filterSizes.length || '-'}
            </span>

            <span
              className={`px-2 text-emerald-500 ${filterTags.length ? 'bg-emerald-100' : ''}`}
              title="Active tag filters"
            >
              {filterTags.length || '-'}
            </span>

            <span
              className={`px-2 text-stone-500 ${filterExtensions.length ? 'bg-stone-100' : ''}`}
              title="Active filetype filters"
            >
              {filterExtensions.length || '-'}
            </span>
          </div>

          <div className="mr-4 inline-flex items-center rounded-md bg-slate-100 p-1">
            <span className="mr-1 py-1">
              {filterTagsMode === FilterMode.SHOW_ALL ? (
                <DocumentCheckIcon className="w-4" />
              ) : (
                <DocumentMagnifyingGlassIcon className="w-4" />
              )}
            </span>

            <div
              className={`mr-2 flex items-center rounded-sm ${filterSelectionActive ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
            >
              <button
                type="button"
                onClick={() => dispatch(setTagFilterMode(FilterMode.SHOW_ALL))}
                className={`flex cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
                  filterTagsMode === FilterMode.SHOW_ALL
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-slate-300'
                }`}
              >
                Show All
              </button>
              <button
                type="button"
                onClick={() => dispatch(setTagFilterMode(FilterMode.MATCH_ANY))}
                className={`flex items-center rounded-sm px-2 py-1 transition-colors ${
                  filterTagsMode === FilterMode.MATCH_ANY
                    ? 'bg-white shadow-sm'
                    : ''
                } ${filterSelectionActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
                disabled={!filterSelectionActive}
              >
                Match Any
              </button>
              <button
                type="button"
                onClick={() => dispatch(setTagFilterMode(FilterMode.MATCH_ALL))}
                className={`flex items-center rounded-sm px-2 py-1 transition-colors ${
                  filterTagsMode === FilterMode.MATCH_ALL
                    ? 'bg-white shadow-sm'
                    : ''
                } ${filterSelectionActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
                disabled={!filterSelectionActive}
              >
                Match All
              </button>
            </div>

            <div
              className={`rounded-sm ${!filterModifiedActive && hasModifiedAssets ? 'shadow-md inset-shadow-sm shadow-white inset-shadow-slate-300' : ''}`}
            >
              <button
                type="button"
                onClick={() => dispatch(toggleModifiedFilter())}
                className={`rounded-sm p-1 px-2 transition-colors ${
                  filterModifiedActive ? 'bg-white shadow-sm' : ''
                } ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'text-slate-300'} ${!filterModifiedActive && hasModifiedAssets ? 'hover:bg-slate-300' : ''}`}
                disabled={!hasModifiedAssets}
              >
                Modified
              </button>
            </div>
          </div>

          {/* Tag summary list button */}
          <div className="relative" ref={tagButtonRef}>
            <div
              onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
              className={`inline-flex cursor-pointer items-center rounded-md p-2 transition-colors ${isTagPanelOpen ? 'bg-slate-300 hover:bg-slate-200' : 'bg-slate-100 hover:bg-slate-300'}`}
              title="Show tag summary"
            >
              <TagIcon className="mr-1 ml-1 w-4" />

              <span className="ml-2 max-lg:hidden"> Filter List</span>
            </div>

            {/* Tag panel component */}
            <PersistentFilterProvider>
              <FilterList
                isOpen={isTagPanelOpen}
                onClose={() => setIsTagPanelOpen(false)}
                containerRef={tagButtonRef}
              />
            </PersistentFilterProvider>
          </div>
        </div>
      </div>
    </div>
  );
};
