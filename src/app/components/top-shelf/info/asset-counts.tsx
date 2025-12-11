import { memo } from 'react';

import {
  selectFilteredAssetsCount,
  selectImageCount,
} from '@/app/store/assets';
import { selectFilterMode, selectHasActiveFilters } from '@/app/store/filters';
import { FilterMode } from '@/app/store/filters/types';
import { useAppSelector } from '@/app/store/hooks';

interface AssetCountsProps {
  selectedAssetsCount: number;
}

const AssetCountsComponent = ({ selectedAssetsCount }: AssetCountsProps) => {
  const filteredCount = useAppSelector(selectFilteredAssetsCount);
  const filtersActive = useAppSelector(selectHasActiveFilters);
  const filterMode = useAppSelector(selectFilterMode);
  const allAssetsCount = useAppSelector(selectImageCount);

  return (
    <div className="flex items-center gap-2 border-l border-l-slate-400 pl-2 text-xs font-medium tabular-nums">
      <div className="flex items-center gap-1">
        <span className="text-slate-600">{allAssetsCount}</span>
        <span className="text-slate-400">images total</span>
      </div>

      {filtersActive && filterMode !== FilterMode.SHOW_ALL ? (
        <div className="flex items-center gap-1 border-l border-l-slate-300 pl-2">
          <span className="text-emerald-600">{filteredCount}</span>
          <span className="text-slate-400">filtered</span>
        </div>
      ) : null}

      {selectedAssetsCount > 0 ? (
        <div className="flex items-center gap-1 border-l border-l-slate-300 pl-2">
          <span className="text-purple-600">{selectedAssetsCount}</span>
          <span className="text-slate-400">selected</span>
        </div>
      ) : null}
    </div>
  );
};

export const AssetCounts = memo(AssetCountsComponent);
