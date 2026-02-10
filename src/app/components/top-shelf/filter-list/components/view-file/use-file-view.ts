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

import { useFilterContext } from '../../filter-context';
import { SortDirection, SortType } from '../../types';

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

export const useFileView = () => {
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

  return {
    patternInput,
    setPatternInput,
    sortedPatterns,
    patternCounts,
    extensionList,
    subfolderList,
    selectedIndex,
    handleToggle,
    handleToggleSubfolder,
    handlePatternKeyDown,
    handleRemovePattern,
    handleAddPattern,
  };
};
