import {
  ArrowPathIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadImages, selectLoadState } from '../store/slice-assets';
import {
  clearTagFilters,
  selectFilterSizes,
  selectFilterTags,
  selectFilterTagsMode,
  toggleTagFilterMode,
} from '../store/slice-filters';
import { Loader } from './loader';

export const TopShelf = () => {
  const dispatch = useAppDispatch();
  const showLoader = useAppSelector(selectLoadState) === 'Loading';
  const filterTags = useAppSelector(selectFilterTags);
  const filterTagsMode = useAppSelector(selectFilterTagsMode);
  const filterSizes = useAppSelector(selectFilterSizes);

  const doRefresh = () => dispatch(loadImages());
  const onToggleTagFilterMode = () => dispatch(toggleTagFilterMode());

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
        <input type="text" className="w-20 border border-slate-400" />
        {filterTags.length ? (
          <span className="ml-2 flex items-center rounded-full border border-emerald-200 pl-2">
            {filterTags.join(', ')}
            <button
              className="ml-1 w-7 cursor-pointer rounded-r-full py-2 pr-2 pl-1 hover:bg-emerald-200"
              type="button"
              onClick={() => dispatch(clearTagFilters())}
            >
              <XMarkIcon />
            </button>
          </span>
        ) : null}
        {filterSizes.length ? (
          <a href="#">[sizes: {filterSizes.join(', ')}]</a>
        ) : null}
        <button
          type="button"
          onClick={onToggleTagFilterMode}
          className="ml-2 inline-flex cursor-pointer items-center rounded-sm bg-slate-200 px-2 py-1"
        >
          {filterTagsMode === 'ShowAll' && (
            <>
              <span className="mr-1 w-6">
                <DocumentCheckIcon />
              </span>
              Show All
            </>
          )}
          {filterTagsMode === 'FilterAll' && (
            <>
              <span className="mr-1 w-6">
                <DocumentMagnifyingGlassIcon />
              </span>
              Match All Tags
            </>
          )}
          {filterTagsMode === 'FilterAny' && (
            <>
              <span className="mr-1 w-6">
                <DocumentMagnifyingGlassIcon />
              </span>
              Match Any Tags
            </>
          )}
        </button>
      </div>
    </div>
  );
};
