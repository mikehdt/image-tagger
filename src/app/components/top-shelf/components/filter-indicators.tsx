import {
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterTags,
} from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';

export const FilterIndicators = () => {
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterTags = useAppSelector(selectFilterTags);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const noFilters =
    !filterSizes.length && !filterTags.length && !filterExtensions.length;

  return (
    <div className="ml-auto flex min-h-9 cursor-default flex-col items-center justify-center overflow-hidden rounded-md bg-slate-50 text-center text-xs leading-3 tabular-nums">
      {noFilters ? (
        <span className="px-2 text-slate-300" title="Active size filters">
          &ndash;
        </span>
      ) : null}

      {filterSizes.length > 0 && (
        <span
          className="bg-sky-100 px-2 text-sky-500 inset-shadow-xs inset-shadow-sky-300"
          title="Active size filters"
        >
          {filterSizes.length || '–'}
        </span>
      )}

      {filterTags.length > 0 && (
        <span
          className="bg-emerald-100 px-2 text-emerald-500 inset-shadow-xs inset-shadow-emerald-300"
          title="Active tag filters"
        >
          {filterTags.length || '–'}
        </span>
      )}

      {filterExtensions.length > 0 && (
        <span
          className="bg-stone-100 px-2 text-stone-500 inset-shadow-xs inset-shadow-stone-300"
          title="Active filetype filters"
        >
          {filterExtensions.length || '–'}
        </span>
      )}
    </div>
  );
};
