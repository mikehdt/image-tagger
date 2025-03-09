import {
  ArrowPathIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SyntheticEvent, useState } from 'react';

import { Loader } from '../components/loader';
import { NewInput } from '../components/new-input';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { IoState, loadAssets, selectIoState } from '../store/slice-assets';
import {
  addTagFilter,
  clearFilters,
  FilterMode,
  selectFilterMode,
  selectFilterSizes,
  selectFilterTags,
  toggleTagFilterMode,
} from '../store/slice-filters';
import { decomposeDimensions } from '../utils/helpers';

export const TopShelf = () => {
  const [newTagInput, setNewTagInput] = useState<string>('');
  const dispatch = useAppDispatch();
  const ioState = useAppSelector(selectIoState);
  const showLoader = ioState === IoState.LOADING || ioState === IoState.SAVING;
  const filterTagsMode = useAppSelector(selectFilterMode);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);

  const doRefresh = () => dispatch(loadAssets());
  const onToggleTagFilterMode = () => dispatch(toggleTagFilterMode());

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
    <div className="fixed top-0 left-0 z-10 flex h-12 w-full items-center bg-white/80 shadow-md backdrop-blur-md">
      <div className="py-2 pr-2 pl-8">
        <div className="w-6">
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
      </div>
      <div className="ml-auto flex items-center py-2 pr-8 pl-2 text-sm">
        <span className="mr-2 inline-flex text-slate-500">
          <FunnelIcon className="mr-1 w-4" />
          Filter:
        </span>

        <NewInput
          inputValue={newTagInput}
          onInputChange={(e) =>
            setNewTagInput(e.currentTarget.value.trimStart())
          }
          onAdd={(e) => addNewFilter(e, newTagInput)}
          tone="secondary"
        />

        {filterTags.length || filterSizes.length ? (
          <span className="ml-2 flex items-center rounded-full border border-slate-200 pl-2">
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
          className="ml-2 inline-flex cursor-pointer items-center rounded-sm bg-slate-200 px-2 py-1"
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
      </div>
    </div>
  );
};
