import { useMemo } from 'react';

import { selectImageSizes } from '../../store/assets';
import { selectFilterSizes, toggleSizeFilter } from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { decomposeDimensions } from '../../utils/helpers';
import { FilterViewProps, SortDirection, SortType } from './types';

// Get sort options for the sizes view
export const getSizeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `Sort: ${sortDirection === 'asc' ? '↑ 9-0' : '↓ 0-9'}`
        : sortType === 'dimensions'
          ? `Sort: ${sortDirection === 'asc' ? '↑ Small-Large' : '↓ Large-Small'}`
          : sortType === 'aspectRatio'
            ? `Sort: ${sortDirection === 'asc' ? '↑ Wide-Tall' : '↓ Tall-Wide'}`
            : `Sort: ${sortDirection === 'asc' ? '↑ Selected' : '↓ Selected'}`,
    typeLabel:
      sortType === 'count'
        ? 'Count'
        : sortType === 'dimensions'
          ? 'Size'
          : sortType === 'aspectRatio'
            ? 'Ratio'
            : 'Active',
    nextType:
      sortType === 'count'
        ? ('dimensions' as SortType)
        : sortType === 'dimensions'
          ? ('aspectRatio' as SortType)
          : sortType === 'aspectRatio'
            ? ('active' as SortType)
            : ('count' as SortType),
  };
};

export const SizesView = ({ sortType, sortDirection }: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allSizes = useAppSelector(selectImageSizes);
  const filterSizes = useAppSelector(selectFilterSizes);

  // Handle size click to toggle filters
  const handleSizeClick = (size: string) => {
    dispatch(toggleSizeFilter(size));
  };

  // Format dimensions for display
  const formatDimensions = (size: string) => {
    const { width, height } = decomposeDimensions(size);
    return `${width}×${height}`;
  };

  // Format aspect ratio for display
  const formatAspectRatio = (size: string) => {
    const { width, height } = decomposeDimensions(size);
    // Simple version: display as width:height
    return `${width}:${height}`;
  };

  // Format megapixels for display
  const formatMegapixels = (size: string) => {
    const { width, height } = decomposeDimensions(size);
    const megapixels = (width * height) / 1000000;
    return `${megapixels.toFixed(1)}MP`;
  };

  // Sort sizes based on current sort type and direction
  const sortedSizes = useMemo(() => {
    return Object.entries(allSizes).sort(([sizeA, countA], [sizeB, countB]) => {
      if (sortType === 'active') {
        // Sort by selected/active status first
        const isSelectedA = filterSizes.includes(sizeA);
        const isSelectedB = filterSizes.includes(sizeB);

        if (isSelectedA !== isSelectedB) {
          // If one is selected and the other isn't, the selected one goes first
          return isSelectedA ? -1 : 1;
        }

        // If both have the same selection status, sort by dimensions as secondary
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'count') {
        // Sort by count - for count, "asc" means highest first (reversed)
        const comparison =
          sortDirection === 'asc' ? countB - countA : countA - countB;
        // If counts are equal, sort by dimensions as secondary
        if (comparison !== 0) return comparison;

        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'dimensions') {
        // Sort by total number of pixels (width × height)
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const totalPixelsA = dimA.width * dimA.height;
        const totalPixelsB = dimB.width * dimB.height;
        return sortDirection === 'asc'
          ? totalPixelsA - totalPixelsB
          : totalPixelsB - totalPixelsA;
      } else if (sortType === 'aspectRatio') {
        // Sort by aspect ratio (width / height)
        const dimA = decomposeDimensions(sizeA);
        const dimB = decomposeDimensions(sizeB);
        const ratioA = dimA.width / dimA.height;
        const ratioB = dimB.width / dimB.height;
        return sortDirection === 'asc' ? ratioA - ratioB : ratioB - ratioA;
      } else {
        // Default sort by size string
        const comparison = sizeA.localeCompare(sizeB);
        return sortDirection === 'desc' ? -comparison : comparison;
      }
    });
  }, [allSizes, sortType, sortDirection, filterSizes]);

  if (sortedSizes.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        No image sizes found
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sortedSizes.map(([size, count]) => {
        const isSelected = filterSizes.includes(size);
        return (
          <li
            key={size}
            onClick={() => handleSizeClick(size)}
            className={`flex cursor-pointer justify-between px-3 py-2 hover:bg-slate-50 ${
              isSelected ? 'bg-emerald-50' : ''
            }`}
            title={
              isSelected
                ? 'Click to remove from filters'
                : 'Click to add to filters'
            }
          >
            <span
              className={`text-sm ${
                isSelected ? 'font-medium text-emerald-700' : 'text-slate-800'
              }`}
            >
              {formatDimensions(size)}
              {sortType === 'aspectRatio' && (
                <span className="ml-1 text-xs text-slate-500">
                  ({formatAspectRatio(size)})
                </span>
              )}
              {sortType === 'dimensions' && (
                <span className="ml-1 text-xs text-slate-500">
                  ({formatMegapixels(size)})
                </span>
              )}
            </span>
            <span
              className={`px-2 py-0.5 text-xs ${
                isSelected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              } rounded-full`}
            >
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
