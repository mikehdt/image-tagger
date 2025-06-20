import { useCallback, useEffect, useMemo } from 'react';

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
        ? `Sort: ${sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9'}`
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

export const FiletypesView = ({
  sortType,
  sortDirection,
  selectedIndex = -1,
  updateListLength,
  onItemSelect,
}: FilterViewProps) => {
  const dispatch = useAppDispatch();
  const allExtensions = useAppSelector(selectAllExtensions);
  const filterExtensions = useAppSelector(selectFilterExtensions);

  // Handle extension click to toggle filters
  const handleExtensionClick = useCallback(
    (extension: string, isKeyboardSelection = false) => {
      dispatch(toggleExtensionFilter(extension));

      // Notify parent of selection when keyboard navigation is used
      if (isKeyboardSelection && onItemSelect) {
        onItemSelect(selectedIndex);
      }
    },
    [dispatch, onItemSelect, selectedIndex],
  );

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

  // Update list length for keyboard navigation when sorted extensions change
  useEffect(() => {
    if (updateListLength) {
      updateListLength(sortedExtensions.length);
    }
  }, [sortedExtensions, updateListLength]);

  // Handle enter key for keyboard navigation
  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      sortedExtensions.length > 0 &&
      selectedIndex < sortedExtensions.length
    ) {
      const [extension] = sortedExtensions[selectedIndex];
      const handleKeyDownEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleExtensionClick(extension);

          // Notify parent of selection when keyboard navigation is used
          if (onItemSelect) {
            onItemSelect(selectedIndex);
          }
        }
      };
      document.addEventListener('keydown', handleKeyDownEnter);
      return () => {
        document.removeEventListener('keydown', handleKeyDownEnter);
      };
    }
  }, [selectedIndex, sortedExtensions, handleExtensionClick, onItemSelect]);

  if (sortedExtensions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        No file extensions found
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {sortedExtensions.map(([extension, count], index) => {
        const isSelected = filterExtensions.includes(extension);
        const isKeyboardSelected = index === selectedIndex;
        return (
          <li
            key={extension}
            onClick={() => handleExtensionClick(extension)}
            className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
              isKeyboardSelected
                ? isSelected
                  ? 'bg-stone-100'
                  : 'bg-blue-100'
                : isSelected
                  ? 'bg-stone-50'
                  : 'hover:bg-slate-50'
            }`}
            title={
              isSelected
                ? 'Click to remove from filters'
                : 'Click to add to filters'
            }
          >
            <span
              className={`text-sm ${
                isSelected ? 'font-medium text-stone-700' : 'text-slate-800'
              }`}
            >
              {extension}
            </span>
            <span
              className={`text-xs tabular-nums ${
                isSelected ? 'text-stone-600' : 'text-slate-500'
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
