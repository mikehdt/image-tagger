import { RefObject, useCallback, useEffect, useState } from 'react';

import {
  getFiletypeSortOptions,
  getSizeSortOptions,
  getTagSortOptions,
} from '../components';
import { FilterView, SortDirection, SortType } from '../types';

export const useFilterState = (
  inputRef: RefObject<HTMLInputElement | null>,
) => {
  // Add state for active view
  const [activeView, setActiveView] = useState<FilterView>('tag');

  // Add state for sort direction and type
  const [sortType, setSortType] = useState<SortType>('count');
  // Default to 'desc' for count (large to small) and 'asc' for others
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Add state for search term - used for filtering tags, sizes, or filetypes
  const [searchTerm, setSearchTerm] = useState('');

  // Add state for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [listLength, setListLength] = useState(0);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Update list length for proper keyboard navigation bounds
  const updateListLength = useCallback((length: number) => {
    setListLength(length);
  }, []);

  // Get sort options based on the active view
  const getSortOptions = useCallback(() => {
    if (activeView === 'tag') {
      return getTagSortOptions(sortType, sortDirection);
    } else if (activeView === 'size') {
      return getSizeSortOptions(sortType, sortDirection);
    } else {
      // Filetype or default
      return getFiletypeSortOptions(sortType, sortDirection);
    }
  }, [activeView, sortType, sortDirection]);

  // Reset sorting and keyboard navigation when switching views
  useEffect(() => {
    // Default to count sorting when switching views
    setSortType('count');
    // Set default direction to 'desc' for count (large to small)
    setSortDirection('desc');
    // Reset list length to ensure proper keyboard navigation
    setListLength(0);
    // Reset selected index (redundant with button click handlers, but adds safety)
    setSelectedIndex(-1);

    // Focus the input field when switching views (if it exists)
    // Use a small timeout to ensure the DOM is ready
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [activeView, inputRef]);

  // Update sort direction when sort type changes
  const updateSortType = useCallback((newSortType: SortType) => {
    setSortType(newSortType);
    // Set default direction based on sort type
    if (newSortType === 'count') {
      setSortDirection('desc'); // Large to small for counts
    }
  }, []);

  return {
    activeView,
    setActiveView,
    sortDirection,
    setSortDirection,
    sortType,
    setSortType: updateSortType, // Use the updated function here
    searchTerm,
    setSearchTerm,
    selectedIndex,
    setSelectedIndex,
    listLength,
    updateListLength,
    getSortOptions,
  };
};
