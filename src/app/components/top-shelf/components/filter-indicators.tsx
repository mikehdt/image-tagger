interface FilterIndicatorsProps {
  filterSizes: string[];
  filterTags: string[];
  filterExtensions: string[];
}

export const FilterIndicators = ({
  filterSizes,
  filterTags,
  filterExtensions,
}: FilterIndicatorsProps) => {
  const noFilters =
    !filterSizes.length && !filterTags.length && !filterExtensions.length;

  return (
    <div className="ml-auto flex cursor-default flex-col overflow-hidden rounded-sm text-center text-xs leading-3 tabular-nums">
      {noFilters ? (
        <span className="px-2 text-slate-300" title="Active size filters">
          &ndash;
        </span>
      ) : null}

      {filterSizes.length > 0 && (
        <span
          className="bg-sky-100 px-2 text-sky-500"
          title="Active size filters"
        >
          {filterSizes.length || '–'}
        </span>
      )}

      {filterTags.length > 0 && (
        <span
          className="bg-emerald-100 px-2 text-emerald-500"
          title="Active tag filters"
        >
          {filterTags.length || '–'}
        </span>
      )}

      {filterExtensions.length > 0 && (
        <span
          className="bg-stone-100 px-2 text-stone-500"
          title="Active filetype filters"
        >
          {filterExtensions.length || '–'}
        </span>
      )}
    </div>
  );
};
