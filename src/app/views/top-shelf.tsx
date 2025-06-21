import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  BackspaceIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

import { FilterList } from '../components/filter-list';
import { Loader } from '../components/loader';
import {
  IoState,
  loadAssets,
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
  setTagFilterMode,
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

  const doRefresh = () => dispatch(loadAssets());
  const saveAllChanges = () => dispatch(saveAllAssets());
  const cancelAllChanges = () => dispatch(resetAllTags());

  const filterActive =
    filterTags.length || filterSizes.length || filterExtensions.length;

  return (
    <div className="fixed top-0 left-0 z-10 w-full bg-white/80 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center">
        <div className="flex py-2 pl-4">
          <div className="mr-2 w-6">
            {showLoader ? (
              <Loader />
            ) : (
              <button
                type="button"
                onClick={doRefresh}
                className="flex w-full cursor-pointer"
                title="Reload asset list"
              >
                <ArrowPathIcon />
              </button>
            )}
          </div>
          {(saveProgress || loadProgress) && (
            <div className="mr-2 align-middle text-slate-600 tabular-nums">
              {saveProgress && (
                <>
                  {saveProgress.completed} / {saveProgress.total}
                  {saveProgress.failed > 0 &&
                    ` (${saveProgress.failed} error${saveProgress.failed !== 1 ? 's' : ''})`}
                </>
              )}
              {!saveProgress && loadProgress && (
                <>
                  {loadProgress.total > 0
                    ? `${loadProgress.completed} / ${loadProgress.total}`
                    : 'Loading...'}
                </>
              )}
            </div>
          )}
          {!showLoader && (
            <>
              <div className="mr-2 w-6">
                <button
                  type="button"
                  onClick={saveAllChanges}
                  className={`flex w-full ${hasModifiedAssets ? 'cursor-pointer text-emerald-600' : 'cursor-not-allowed text-slate-300'}`}
                  title={
                    hasModifiedAssets
                      ? 'Save all tag changes'
                      : 'No changes to save'
                  }
                  disabled={!hasModifiedAssets}
                >
                  <ArchiveBoxArrowDownIcon />
                </button>
              </div>
              <div className="w-6">
                <button
                  type="button"
                  onClick={cancelAllChanges}
                  className={`flex w-full ${hasModifiedAssets ? 'cursor-pointer text-pink-600' : 'cursor-not-allowed text-slate-300'}`}
                  title={
                    hasModifiedAssets
                      ? 'Cancel all tag changes'
                      : 'No changes to cancel'
                  }
                  disabled={!hasModifiedAssets}
                >
                  <BackspaceIcon />
                </button>
              </div>
            </>
          )}
        </div>

        {/* TODO: Style these better */}
        <div className="ml-auto flex items-center py-2 pr-4 pl-2 text-sm">
          {filterActive ? (
            <div className="mr-4">
              {filterTags.length ? (
                <span className="text-emerald-500">{filterTags.length}</span>
              ) : null}
              {filterSizes.length ? (
                <span className="text-sky-500">{filterSizes.length}</span>
              ) : null}
              {filterExtensions.length ? (
                <span className="text-slate-500">
                  {filterExtensions.length}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* TODO: Mark all deleted, rename all? */}

          {filterActive ? (
            <>
              <button
                className={`mr-2 inline-flex items-center p-2 ${
                  filterTags.length
                    ? 'cursor-pointer text-rose-500'
                    : 'cursor-not-allowed text-slate-300'
                }`}
                type="button"
                onClick={() => dispatch(markFilterTagsToDelete(filterTags))}
                disabled={!filterTags.length}
              >
                Mark selected tags for deletion
                <span className="ml-1 w-4">
                  <XMarkIcon />
                </span>
              </button>

              <button
                className="mr-2 inline-flex cursor-pointer items-center p-2 text-slate-500"
                type="button"
                onClick={() => dispatch(clearFilters())}
              >
                Clear Filters
                <span className="ml-1 w-4">
                  <XMarkIcon />
                </span>
              </button>
            </>
          ) : null}

          <div className="mr-4 ml-2 inline-flex items-center rounded-md bg-slate-100 p-1">
            <span className="mr-1 w-4">
              {filterTagsMode === FilterMode.SHOW_ALL ? (
                <DocumentCheckIcon />
              ) : (
                <DocumentMagnifyingGlassIcon />
              )}
            </span>
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
              className={`flex cursor-pointer items-center rounded-sm px-2 py-1 ${
                filterTagsMode === FilterMode.MATCH_ANY
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-slate-300'
              }`}
            >
              Match Any
            </button>
            <button
              type="button"
              onClick={() => dispatch(setTagFilterMode(FilterMode.MATCH_ALL))}
              className={`flex cursor-pointer items-center rounded-sm px-2 py-1 ${
                filterTagsMode === FilterMode.MATCH_ALL
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-slate-300'
              }`}
            >
              Match All
            </button>
          </div>

          {/* Tag summary list button */}
          <div className="relative" ref={tagButtonRef}>
            <span
              onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
              className={`inline-flex cursor-pointer items-center rounded-md p-2 ${isTagPanelOpen ? 'bg-slate-300 hover:bg-slate-200' : 'bg-slate-100 hover:bg-slate-300'}`}
              title="Show tag summary"
            >
              <TagIcon className="mr-2 w-4" /> Filter List
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
