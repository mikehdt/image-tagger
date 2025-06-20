import { useMemo } from 'react';

import { selectAllExtensions } from '../../store/assets';
import {
  selectFilterExtensions,
  toggleExtensionFilter,
} from '../../store/filters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { FilterViewProps, SortDirection, SortType } from './types';

// Get sort options for the filetypes view
export const getFiletypeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `Sort: ${sortDirection === 'asc' ? '↑ 9-0' : '↓ 0-9'}`
        : `Sort: ${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`,
    typeLabel:
      sortType === 'count'
        ? 'Count'
        : sortType === 'alphabetical'
          ? 'Name'
          : 'Active',
    nextType:
      sortType === 'count'
        ? ('alphabetical' as SortType)
        : sortType === 'alphabetical'
          ? ('active' as SortType)
          : ('count' as SortType),
  };
};

export const FiletypesView = ({ sortType, sortDirection }: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allExtensions = useAppSelector(selectAllExtensions);
  const filterExtensions = useAppSelector(selectFilterExtensions);

  // Handle extension click to toggle filters
  const handleExtensionClick = (extension: string) => {
    dispatch(toggleExtensionFilter(extension));
  };

  // Sort extensions based on current sort type and direction
  const sortedExtensions = useMemo(() => {
    return Object.entries(allExtensions).sort(
      ([extA, countA], [extB, countB]) => {
        if (sortType === 'active') {
          // Sort by selected/active status first
          const isSelectedA = filterExtensions.includes(extA);
          const isSelectedB = filterExtensions.includes(extB);

          if (isSelectedA !== isSelectedB) {
            // If one is selected and the other isn't, the selected one goes first
            return isSelectedA ? -1 : 1;
          }

          // If both have the same selection status, sort alphabetically
          const comparison = extA.localeCompare(extB);
          return sortDirection === 'desc' ? -comparison : comparison;
        } else if (sortType === 'count') {
          // Sort by count - for count, "asc" means highest first (reversed)
          const comparison =
            sortDirection === 'asc' ? countB - countA : countA - countB;
          // If counts are equal, sort alphabetically as a secondary sort
          return comparison !== 0 ? comparison : extA.localeCompare(extB);
        } else {
          // Sort alphabetically - normal sort order
          const comparison = extA.localeCompare(extB);
          return sortDirection === 'desc' ? -comparison : comparison;
        }
      },
    );
  }, [allExtensions, sortType, sortDirection, filterExtensions]);

  if (sortedExtensions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        No file extensions found
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sortedExtensions.map(([extension, count]) => {
        const isSelected = filterExtensions.includes(extension);
        return (
          <li
            key={extension}
            onClick={() => handleExtensionClick(extension)}
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
              {extension}
            </span>
            <span
              className={`text-xs ${
                isSelected ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
