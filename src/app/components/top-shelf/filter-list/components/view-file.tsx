import { PlusIcon, XIcon } from 'lucide-react';
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  selectAllExtensions,
  selectAllSubfolders,
  selectFilenamePatternCounts,
} from '@/app/store/assets';
import {
  addFilenamePattern,
  removeFilenamePattern,
  selectFilenamePatterns,
  selectFilterExtensions,
  selectFilterSubfolders,
  toggleExtensionFilter,
  toggleSubfolderFilter,
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
      directionLabel = sortDirection === 'desc' ? '↑ Active' : '↓ Active';
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
  const allSubfolders = useAppSelector(selectAllSubfolders);
  const activeExtensions = useAppSelector(selectFilterExtensions);
  const activeSubfolders = useAppSelector(selectFilterSubfolders);
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
          // Default (desc) puts active items first, asc puts them last
          return sortDirection === 'desc'
            ? a.isActive
              ? -1
              : 1 // active items first when descending (default)
            : a.isActive
              ? 1
              : -1; // active items last when ascending
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

  // Get subfolder data from store
  const subfolderList = useMemo(() => {
    // Convert map to array
    const list = Object.entries(allSubfolders).map(([subfolder, count]) => ({
      subfolder,
      count,
      isActive: activeSubfolders.includes(subfolder),
    }));

    // Sort the subfolders (same logic as extensions)
    return list.sort((a, b) => {
      if (sortType === 'active') {
        if (a.isActive !== b.isActive) {
          return sortDirection === 'desc'
            ? a.isActive
              ? -1
              : 1
            : a.isActive
              ? 1
              : -1;
        }
        return b.count - a.count;
      } else if (sortType === 'count') {
        return sortDirection === 'asc' ? a.count - b.count : b.count - a.count;
      } else {
        return sortDirection === 'asc'
          ? a.subfolder.localeCompare(b.subfolder)
          : b.subfolder.localeCompare(a.subfolder);
      }
    });
  }, [allSubfolders, activeSubfolders, sortType, sortDirection]);

  // Create a memoized toggle handler for extensions
  const handleToggle = useCallback(
    (ext: string) => {
      dispatch(toggleExtensionFilter(ext));
    },
    [dispatch],
  );

  // Create a memoized toggle handler for subfolders
  const handleToggleSubfolder = useCallback(
    (subfolder: string) => {
      dispatch(toggleSubfolderFilter(subfolder));
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
      <div className="relative shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="text"
          value={patternInput}
          onChange={(e) => setPatternInput(e.target.value)}
          onKeyDown={handlePatternKeyDown}
          placeholder="Search filenames..."
          className="w-full rounded border border-slate-300 bg-white py-1.5 ps-2 pe-8 text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:placeholder-slate-400 dark:focus:border-blue-400"
        />
        <button
          type="button"
          onClick={handleAddPattern}
          disabled={!patternInput.trim()}
          className={`absolute top-3.5 right-4 h-5 w-5 rounded-full p-0.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${
            patternInput.trim()
              ? 'cursor-pointer text-slate-600 hover:bg-blue-500 hover:text-white dark:text-slate-300 dark:hover:bg-blue-400'
              : 'pointer-events-none text-slate-300 dark:text-slate-600'
          }`}
          title="Add pattern"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Filename patterns list */}
        {sortedPatterns.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {sortedPatterns.map((pattern) => (
              <li
                key={pattern}
                className="flex cursor-default items-center justify-between bg-stone-100 px-3 py-2 transition-colors dark:bg-stone-800"
              >
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {pattern}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-stone-600 tabular-nums dark:text-stone-400">
                    {patternCounts[pattern] || 0}
                  </span>
                  <button
                    onClick={(e) => handleRemovePattern(pattern, e)}
                    className="hover:text-blue-80 cursor-pointer rounded-full bg-stone-100 p-0.5 text-stone-600 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-stone-700 dark:text-stone-400 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                    title="Remove pattern"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Subfolder list */}
        {subfolderList.length > 0 && (
          <>
            {/* Divider with label */}
            <div className="flex cursor-default items-center gap-2 bg-indigo-50 py-1.5 dark:bg-indigo-950">
              <span className="h-px flex-1 bg-indigo-200 shadow-2xs shadow-white dark:bg-indigo-700 dark:shadow-indigo-950" />
              <span className="text-xs text-indigo-400 text-shadow-white text-shadow-xs dark:text-shadow-indigo-950">
                Repeat Folders
              </span>
              <span className="h-px flex-1 bg-indigo-200 shadow-2xs shadow-white dark:bg-indigo-700 dark:shadow-indigo-950" />
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {subfolderList.map((item, index) => (
                <li
                  id={`subfolder-${item.subfolder}`}
                  key={item.subfolder}
                  onClick={() => handleToggleSubfolder(item.subfolder)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                    index === selectedIndex
                      ? item.isActive
                        ? 'bg-indigo-200 dark:bg-indigo-800'
                        : 'bg-blue-100 dark:bg-blue-900/50'
                      : item.isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900'
                        : 'hover:bg-blue-50 dark:hover:bg-slate-700'
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
                        ? 'font-medium text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.subfolder}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${
                      item.isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Divider with label */}
        <div className="flex cursor-default items-center gap-2 bg-stone-50 py-1.5 dark:bg-stone-900">
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white dark:bg-stone-500 dark:shadow-stone-800" />
          <span className="text-xs text-stone-400 text-shadow-white text-shadow-xs dark:text-shadow-stone-900">
            File Types
          </span>
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white dark:bg-stone-500 dark:shadow-stone-800" />
        </div>

        {/* Extension list */}
        {extensionList.length === 0 ? (
          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
            No file extensions available
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {extensionList.map((item, index) => (
              <li
                id={`tag-${item.ext}`}
                key={item.ext}
                onClick={() => handleToggle(item.ext)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                  index === selectedIndex
                    ? item.isActive
                      ? 'bg-stone-200 dark:bg-stone-700'
                      : 'bg-blue-100 dark:bg-blue-900/50'
                    : item.isActive
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'hover:bg-blue-50 dark:hover:bg-slate-700'
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
                      ? 'font-medium text-stone-700 dark:text-stone-300'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {item.ext}
                </span>
                <span
                  className={`text-xs tabular-nums ${
                    item.isActive
                      ? 'text-stone-600 dark:text-stone-400'
                      : 'text-slate-500 dark:text-slate-400'
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
