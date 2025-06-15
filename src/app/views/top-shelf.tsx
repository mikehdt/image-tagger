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

import { AllTags } from '../components/all-tags';
import { Loader } from '../components/loader';
import { TagInput } from '../components/tag-input';
import {
  IoState,
  loadAssets,
  resetAllTags,
  saveAllAssets,
  selectHasModifiedAssets,
  selectIoState,
} from '../store/assets';
import {
  addTagFilter,
  clearFilters,
  FilterMode,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  toggleTagFilterMode,
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
  const hasModifiedAssets = useAppSelector(selectHasModifiedAssets);

  const doRefresh = () => dispatch(loadAssets());
  const onToggleTagFilterMode = () => dispatch(toggleTagFilterMode());
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

          {filterTags.length || filterSizes.length ? (
            <span className="mr-4 ml-2 flex items-center rounded-full border border-slate-200 pl-2">
              {filterTags.map((item, idx) => (
                <span
                  key={`${idx}-${item}`}
                  className={`${idx > 0 ? 'border-l border-l-emerald-300' : ''} px-2 text-emerald-700`}
                >
                  {item}
                </span>
              ))}

              {filterSizes.map((item, idx) => (
                <span
                  key={`${idx}-${item}`}
                  className={`${idx > 0 ? 'border-l border-l-sky-300' : ''} px-2 text-sky-700`}
                >
                  {decomposeDimensions(item).width}&times;
                  {decomposeDimensions(item).height}
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

          <button
            type="button"
            onClick={onToggleTagFilterMode}
            className="mr-4 ml-2 inline-flex cursor-pointer items-center rounded-sm bg-slate-200 px-2 py-1"
          >
            {filterTagsMode === FilterMode.SHOW_ALL && (
              <>
                <span className="mr-1 w-6">
                  <DocumentCheckIcon />
                </span>
                Show All
              </>
            )}
            {filterTagsMode === FilterMode.MATCH_ALL && (
              <>
                <span className="mr-1 w-6">
                  <DocumentMagnifyingGlassIcon />
                </span>
                Match All
              </>
            )}
            {filterTagsMode === FilterMode.MATCH_ANY && (
              <>
                <span className="mr-1 w-6">
                  <DocumentMagnifyingGlassIcon />
                </span>
                Match Any
              </>
            )}
          </button>

          {/* Tag summary list button */}
          <div className="relative" ref={tagButtonRef}>
            <span
              onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
              className="inline-flex cursor-pointer items-center rounded-sm border border-slate-300 p-2 hover:bg-slate-50"
              title="Show tag summary"
            >
              <TagIcon className="mr-2 w-4" /> Tag List
            </span>

            {/* Tag panel component */}
            <AllTags
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
