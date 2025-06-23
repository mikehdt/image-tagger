import {
  ArrowPathIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  DocumentMinusIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import { FilterList } from '../components/filter-list/filter-list';
import { Loader } from '../components/loader';
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
} from '../store/assets';
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
} from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';

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

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center">
        <div className="flex py-2 pl-4">
          {showLoader ? (
            <>
              <div className="mr-2 w-6">
                <Loader />
              </div>

              <div className="align-middle text-slate-600 tabular-nums">
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
                <BookmarkIcon className="w-4" />
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
          {filterActive ? (
            <>
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
                className="mr-4 inline-flex cursor-pointer items-center py-2 text-slate-700"
                type="button"
                onClick={() => dispatch(clearFilters())}
              >
                <XMarkIcon className="mr-1 w-4" />
                Clear Filters
              </button>
            </>
          ) : null}

          <div className="mr-4">
            {filterTags.length ? (
              <span
                className={`${filterSizes.length || filterExtensions.length ? 'mr-1' : ''} inline-flex cursor-default rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-500 tabular-nums`}
              >
                {filterTags.length}
              </span>
            ) : null}
            {filterSizes.length ? (
              <span
                className={`${filterExtensions.length ? 'mr-1' : ''} inline-flex cursor-default rounded-full bg-sky-100 px-2 py-0.5 text-sky-500 tabular-nums`}
              >
                {filterSizes.length}
              </span>
            ) : null}
            {filterExtensions.length ? (
              <span className="inline-flex cursor-default rounded-full bg-stone-100 px-2 py-0.5 text-stone-500 tabular-nums">
                {filterExtensions.length}
              </span>
            ) : null}
          </div>

          <div className="mr-4 inline-flex items-center rounded-md bg-slate-100 p-1">
            <span className="mr-1 py-1">
              {filterTagsMode === FilterMode.SHOW_ALL ? (
                <DocumentCheckIcon className="w-4" />
              ) : (
                <DocumentMagnifyingGlassIcon className="w-4" />
              )}
            </span>

            <span className="flex items-center border-r border-white pr-2">
              <button
                type="button"
                onClick={() => dispatch(setTagFilterMode(FilterMode.SHOW_ALL))}
                className={`flex cursor-pointer items-center rounded-sm px-2 py-1 ${
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
                className={`flex items-center rounded-sm px-2 py-1 ${
                  filterTagsMode === FilterMode.MATCH_ANY
                    ? 'bg-white shadow-sm'
                    : ''
                } ${filterActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
                disabled={!filterActive}
              >
                Match Any
              </button>
              <button
                type="button"
                onClick={() => dispatch(setTagFilterMode(FilterMode.MATCH_ALL))}
                className={`flex items-center rounded-sm px-2 py-1 ${
                  filterTagsMode === FilterMode.MATCH_ALL
                    ? 'bg-white shadow-sm'
                    : ''
                } ${filterActive ? 'cursor-pointer text-slate-700 hover:bg-slate-300' : 'text-slate-300'}`}
                disabled={!filterActive}
              >
                Match All
              </button>
            </span>

            <span className="flex items-center border-l border-slate-300 pl-2">
              <button
                type="button"
                onClick={() => dispatch(toggleModifiedFilter())}
                className={`rounded-sm p-1 px-2 ${
                  filterModifiedActive ? 'bg-white shadow-sm' : ''
                } ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'text-slate-300'} ${!filterModifiedActive && hasModifiedAssets ? 'hover:bg-slate-300' : ''}`}
                disabled={!hasModifiedAssets}
              >
                Modified
              </button>
            </span>
          </div>

          {/* Tag summary list button */}
          <div className="relative" ref={tagButtonRef}>
            <span
              onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
              className={`inline-flex cursor-pointer items-center rounded-md p-2 ${isTagPanelOpen ? 'bg-slate-300 hover:bg-slate-200' : 'bg-slate-100 hover:bg-slate-300'}`}
              title="Show tag summary"
            >
              <TagIcon className="w-4" />
              <span className="ml-2 max-lg:hidden"> Filter List</span>
            </span>

            {/* Tag panel component */}
            <FilterList
              isOpen={isTagPanelOpen}
              onClose={() => setIsTagPanelOpen(false)}
              containerRef={tagButtonRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
