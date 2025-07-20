import { memo } from 'react';

import {
  selectFilterBuckets,
  selectFilterExtensions,
  selectFilterSizes,
  selectFilterTags,
} from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';

const FilterIndicatorsInfoComponent = () => {
  const filterSizes = useAppSelector(selectFilterSizes);
  const filterBuckets = useAppSelector(selectFilterBuckets);
  const filterTags = useAppSelector(selectFilterTags);
  const filterExtensions = useAppSelector(selectFilterExtensions);

  const activeFilters = [
    {
      count: filterSizes.length,
      label: filterSizes.length === 1 ? 'size' : 'sizes',
      color: 'sky',
    },
    {
      count: filterBuckets.length,
      label: filterBuckets.length === 1 ? 'bucket' : 'buckets',
      color: 'sky',
    },
    {
      count: filterTags.length,
      label: filterTags.length === 1 ? 'tag' : 'tags',
      color: 'emerald',
    },
    {
      count: filterExtensions.length,
      label: filterExtensions.length === 1 ? 'type' : 'types',
      color: 'stone',
    },
  ].filter((filter) => filter.count > 0);

  if (activeFilters.length === 0) {
    return (
      <div className="text-xs text-slate-400">
        <span>No active filters</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 text-xs">
      {activeFilters.map((filter) => (
        <div key={filter.label} className="flex items-center space-x-1">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded text-xs font-medium tabular-nums ${
              filter.color === 'sky'
                ? 'bg-sky-100 text-sky-600'
                : filter.color === 'emerald'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-stone-100 text-stone-600'
            }`}
          >
            {filter.count}
          </div>
          <span className="font-medium text-slate-600">{filter.label}</span>
        </div>
      ))}
    </div>
  );
};

export const FilterIndicatorsInfo = memo(FilterIndicatorsInfoComponent);
