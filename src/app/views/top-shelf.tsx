import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  BackspaceIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SyntheticEvent, useRef, useState } from 'react';

import { FilterList } from '../components/filter-list';
import { Loader } from '../components/loader';
import { TagInput } from '../components/tag-input';
import {
  IoState,
  loadAssets,
  resetAllTags,
  saveAllAssets,
  selectHasModifiedAssets,
  selectIoState,
  selectSaveProgress,
} from '../store/assets';
import {
  addTagFilter,
  clearFilters,
  FilterMode,
  selectFilterExtensions,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  setTagFilterMode,
} from '../store/filters';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { decomposeDimensions } from '../utils/helpers';

export const TopShelf = () => {
  const [newTagInput, setNewTagInput] = useState<string>('');
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

  const doRefresh = () => dispatch(loadAssets());
  const saveAllChanges = () => dispatch(saveAllAssets());
  const cancelAllChanges = () => dispatch(resetAllTags());

  const addNewFilter = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    if (tag.trim() !== '') {
      if (!filterTags.includes(tag)) {
        dispatch(addTagFilter(tag));
        setNewTagInput('');
      } else {
        console.log("Couldn't add filter, it's already is in the list", tag);
      }
    } else {
      console.log("Couldn't add filter, it was empty.");
    }
  };

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
          {saveProgress && (
            <div className="mr-2 align-middle text-slate-600 tabular-nums">
              {saveProgress.completed} / {saveProgress.total}
              {saveProgress.failed > 0 &&
                ` (${saveProgress.failed} error${saveProgress.failed !== 1 ? 's' : ''})`}
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
        <div className="ml-auto flex items-center py-2 pr-4 pl-2 text-sm">
          <span className="mr-2 inline-flex text-slate-500">
            <FunnelIcon className="mr-1 w-4" />
            Filter:
          </span>

          <TagInput
            inputValue={newTagInput}
            onInputChange={(e) =>
              setNewTagInput(e.currentTarget.value.trimStart())
            }
            onSubmit={(e) => addNewFilter(e, newTagInput)}
            mode="add"
            placeholder="Filter by tag..."
            tone="secondary"
          />

          {filterTags.length ||
          filterSizes.length ||
          filterExtensions.length ? (
            <span className="mr-4 ml-2 flex items-center rounded-full border border-slate-200 pl-2">
              {filterTags.map((item, idx) => (
                <span
                  key={`${idx}-${item}`}
                  className={`${idx > 0 ? 'border-l border-l-emerald-300' : ''} ${
                    idx + 1 === filterTags.length &&
                    (filterSizes.length > 0 || filterExtensions.length > 0)
                      ? 'border-r border-r-slate-300'
                      : ''
                  } px-2 text-emerald-700`}
                >
                  {item}
                </span>
              ))}

              {filterSizes.map((item, idx) => (
                <span
                  key={`${idx}-${item}`}
                  className={`${idx > 0 ? 'border-l border-l-sky-300' : ''} ${
                    idx + 1 === filterSizes.length &&
                    filterExtensions.length > 0
                      ? 'border-r border-r-slate-300'
                      : ''
                  } px-2 text-sky-700`}
                >
                  {decomposeDimensions(item).width}&times;
                  {decomposeDimensions(item).height}
                </span>
              ))}

              {filterExtensions.map((item, idx) => (
                <span
                  key={`${idx}-${item}`}
                  className={`${idx > 0 ? 'border-l border-l-stone-300' : ''} px-2 text-stone-700`}
                >
                  {item}
                </span>
              ))}

              <button
                className="w-7 cursor-pointer rounded-r-full py-2 pr-2 pl-1 hover:bg-slate-200"
                type="button"
                onClick={() => dispatch(clearFilters())}
              >
                <XMarkIcon />
              </button>
            </span>
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
