import { useCallback, useEffect, useMemo } from 'react';

import { selectAllExtensions } from '../../../store/assets';
import {
  selectFilterExtensions,
  toggleExtensionFilter,
} from '../../../store/filters';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useFilterList } from '../filter-list-context';
import { SortDirection, SortType } from '../types';

// Get sort options for the filetypes view
export const getFiletypeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `${sortDirection === 'asc' ? '↓ 9-0' : '↑ 0-9'}`
        : `${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`,
    typeLabel: sortType === 'count' ? 'Count' : 'Name',
    nextType:
      sortType === 'count'
        ? ('alphabetical' as SortType)
        : ('count' as SortType),
  };
};

export const FiletypesView = () => {
  const dispatch = useAppDispatch();
  const allExtensions = useAppSelector(selectAllExtensions);
  const activeExtensions = useAppSelector(selectFilterExtensions);

  const { sortType, sortDirection, updateListLength, selectedIndex } =
    useFilterList();

  // Get extension data from store
  const extensionList = useMemo(() => {
    // Convert map to array
    const list = Object.entries(allExtensions).map(([ext, count]) => ({
      ext,
      count,
      isActive: activeExtensions.includes(ext),
    }));

    // Sort the extensions
    return list.sort((a, b) => {
      // If sort type is count, compare by count
      if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      } else {
        // Otherwise sort by extension name
        return sortDirection === 'asc'
          ? a.ext.localeCompare(b.ext) // A-Z
          : b.ext.localeCompare(a.ext); // Z-A
      }
    });
  }, [allExtensions, activeExtensions, sortType, sortDirection]);

  // Update list length for keyboard navigation
  useEffect(() => {
    updateListLength(extensionList.length);
  }, [extensionList.length, updateListLength]);

  // Create a memoized toggle handler
  const handleToggle = useCallback(
    (ext: string) => {
      dispatch(toggleExtensionFilter(ext));
    },
    [dispatch],
  );

  return (
    <div className="max-h-80 overflow-y-auto">
      {extensionList.length === 0 ? (
        <div className="px-4 py-2 text-sm text-gray-500">
          No file extensions available
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {extensionList.map((item, index) => (
            <li
              id={`tag-${item.ext}`}
              key={item.ext}
              onClick={() => handleToggle(item.ext)}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 ${
                index === selectedIndex
                  ? item.isActive
                    ? 'bg-stone-200'
                    : 'bg-blue-100'
                  : item.isActive
                    ? 'bg-stone-100'
                    : 'hover:bg-blue-50'
              }`}
              title={
                item.isActive
                  ? 'Click to remove from filters'
                  : 'Click to add to filters'
              }
            >
              <span
                className={`text-sm ${
                  item.isActive
                    ? 'font-medium text-stone-700'
                    : 'text-slate-800'
                }`}
              >
                {item.ext}
              </span>
              <span
                className={`text-xs tabular-nums ${
                  item.isActive ? 'text-stone-600' : 'text-slate-500'
                }`}
              >
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
