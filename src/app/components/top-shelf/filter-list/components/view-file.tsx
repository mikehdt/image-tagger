import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  selectAllExtensions,
  selectFilenamePatternCounts,
} from '@/app/store/assets';
import {
  addFilenamePattern,
  removeFilenamePattern,
  selectFilenamePatterns,
  selectFilterExtensions,
  toggleExtensionFilter,
} from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { useFilterContext } from '../filter-context';
import { SortDirection, SortType } from '../types';

// Get sort options for the filetypes view
export const getFiletypeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  let typeLabel: string, directionLabel: string;

  switch (sortType) {
    case 'count':
      typeLabel = 'Count';
      directionLabel = sortDirection === 'asc' ? '↑ 0-9' : '↓ 9-0';
      break;
    case 'active':
      typeLabel = 'Active';
      directionLabel = sortDirection === 'asc' ? '↑ Active' : '↓ Active';
      break;
    case 'alphabetical':
    default:
      typeLabel = 'Name';
      directionLabel = sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A';
  }

  // Calculate next sort type based on current sort type
  let nextType: SortType = 'count';
  if (sortType === 'count') {
    nextType = 'active';
  } else if (sortType === 'active') {
    nextType = 'alphabetical';
  } else if (sortType === 'alphabetical') {
    nextType = 'count';
  }

  return {
    typeLabel,
    directionLabel,
    nextType,
  };
};

export const FileView = () => {
  const dispatch = useAppDispatch();
  const allExtensions = useAppSelector(selectAllExtensions);
  const activeExtensions = useAppSelector(selectFilterExtensions);
  const filenamePatterns = useAppSelector(selectFilenamePatterns);
  const patternCounts = useAppSelector(selectFilenamePatternCounts);

  const [patternInput, setPatternInput] = useState('');

  const { sortType, sortDirection, updateListLength, selectedIndex } =
    useFilterContext();

  // Sort the filename patterns based on current sort settings
  const sortedPatterns = useMemo(() => {
    if (filenamePatterns.length === 0) return [];

    return [...filenamePatterns].sort((a, b) => {
      // For 'active' sort, patterns are always "active" so just sort by count
      if (sortType === 'active' || sortType === 'count') {
        const countA = patternCounts[a] || 0;
        const countB = patternCounts[b] || 0;
        return sortDirection === 'asc' ? countA - countB : countB - countA;
      }
      // Alphabetical
      return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [filenamePatterns, patternCounts, sortType, sortDirection]);

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
      // If sort type is active, compare by active state first
      if (sortType === 'active') {
        // First compare by active state
        if (a.isActive !== b.isActive) {
          return sortDirection === 'asc'
            ? a.isActive
              ? -1
              : 1 // active items first when ascending
            : a.isActive
              ? 1
              : -1; // active items last when descending
        }
        // If both have same active state, sort by count descending (9-0) as secondary criteria
        return b.count - a.count; // always descending count (9-0) as tie-breaker
      }
      // If sort type is count, compare by count
      else if (sortType === 'count') {
        return sortDirection === 'asc'
          ? a.count - b.count // ascending
          : b.count - a.count; // descending
      }
      // Otherwise sort by extension name (alphabetical)
      else {
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

  // Pattern input handlers
  const handlePatternKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && patternInput.trim()) {
        dispatch(addFilenamePattern(patternInput.trim()));
        setPatternInput('');
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setPatternInput('');
        e.preventDefault();
      }
    },
    [dispatch, patternInput],
  );

  const handleRemovePattern = useCallback(
    (pattern: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(removeFilenamePattern(pattern));
    },
    [dispatch],
  );

  const handleAddPattern = useCallback(() => {
    if (patternInput.trim()) {
      dispatch(addFilenamePattern(patternInput.trim()));
      setPatternInput('');
    }
  }, [dispatch, patternInput]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filename pattern search section */}
      <div className="relative shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-2">
        <input
          type="text"
          value={patternInput}
          onChange={(e) => setPatternInput(e.target.value)}
          onKeyDown={handlePatternKeyDown}
          placeholder="Search filenames..."
          className="w-full rounded border border-slate-300 bg-white py-1.5 ps-2 pe-8 text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddPattern}
          disabled={!patternInput.trim()}
          className={`absolute top-3.5 right-4 h-5 w-5 rounded-full p-0.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${
            patternInput.trim()
              ? 'cursor-pointer text-slate-600 hover:bg-blue-500 hover:text-white'
              : 'pointer-events-none text-slate-300'
          }`}
          title="Add pattern"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Filename patterns list */}
        {sortedPatterns.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {sortedPatterns.map((pattern) => (
              <li
                key={pattern}
                className="flex cursor-default items-center justify-between bg-stone-100 px-3 py-2 transition-colors"
              >
                <span className="text-sm font-medium text-stone-800">
                  {pattern}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 tabular-nums">
                    {patternCounts[pattern] || 0}
                  </span>
                  <button
                    onClick={(e) => handleRemovePattern(pattern, e)}
                    className="hover:text-blue-80 cursor-pointer rounded-full bg-stone-100 p-0.5 text-stone-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
                    title="Remove pattern"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Divider with label */}
        <div className="flex cursor-default items-center gap-2 bg-stone-50 py-1.5">
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white" />
          <span className="text-xs text-stone-400 text-shadow-white text-shadow-xs">
            File Types
          </span>
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white" />
        </div>

        {/* Extension list */}
        {extensionList.length === 0 ? (
          <div className="px-4 py-2 text-sm text-slate-500">
            No file extensions available
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {extensionList.map((item, index) => (
              <li
                id={`tag-${item.ext}`}
                key={item.ext}
                onClick={() => handleToggle(item.ext)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
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
    </div>
  );
};
