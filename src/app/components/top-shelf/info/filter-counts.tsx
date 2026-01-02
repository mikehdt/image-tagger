import { memo } from 'react';

import {
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterTags,
  selectShowModified,
} from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';

const FilterIndicatorsInfoComponent = () => {
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterTags = useAppSelector(selectFilterTags);
  const filterExtensions = useAppSelector(selectFilterExtensions);
  const showModified = useAppSelector(selectShowModified);

  const activeFilters = [
    {
      count: filterSizes.length,
      label: filterSizes.length === 1 ? 'size' : 'sizes',
      color: 'bg-sky-50 border-sky-300 text-sky-600',
    },
    {
      count: filterBuckets.length,
      label: filterBuckets.length === 1 ? 'bucket' : 'buckets',
      color: 'bg-slate-50 border-slate-300 text-slate-600',
    },
    {
      count: filterTags.length,
      label: filterTags.length === 1 ? 'tag' : 'tags',
      color: 'bg-emerald-50 border-emerald-300 text-emerald-600',
    },
    {
      count: filterExtensions.length,
      label: filterExtensions.length === 1 ? 'type' : 'types',
      color: 'bg-stone-50 border-stone-300 text-stone-600',
    },
    {
      count: showModified ? 1 : 0,
      label: 'Modified',
      color: 'bg-amber-50 border-amber-300 text-amber-600',
      hideCount: true,
    },
  ].filter((filter) => filter.count > 0);

  if (activeFilters.length === 0) {
    return (
      <div className="text-xs text-(--unselected-text)">
        <span>No active filters</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {activeFilters.map((filter) => (
        <div
          key={filter.label}
          className={`flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${filter.color}`}
        >
          {filter.hideCount ? filter.label : `${filter.count} ${filter.label}`}
        </div>
      ))}
    </div>
  );
};

export const FilterIndicatorsInfo = memo(FilterIndicatorsInfoComponent);
