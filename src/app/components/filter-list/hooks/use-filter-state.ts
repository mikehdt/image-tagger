import { RefObject, useCallback, useEffect, useState } from 'react';

import {
  getFiletypeSortOptions,
  getSizeSortOptions,
  getTagSortOptions,
} from '../components';
import { usePersistentFilterState } from '../persistent-filter-context';
import { FilterView, SortDirection, SortType } from '../types';

export const useFilterState = (
  inputRef: RefObject<HTMLInputElement | null>,
) => {
  // Use persistent context
  const {
    activeView,
    setActiveView,
    tagSortSettings,
    setTagSortSettings,
    sizeSortSettings,
    setSizeSortSettings,
    filetypeSortSettings,
    setFiletypeSortSettings,
  } = usePersistentFilterState();

  // Initialize sort settings based on active view
  const initialSettings =
    activeView === 'tag'
      ? tagSortSettings
      : activeView === 'size'
        ? sizeSortSettings
        : filetypeSortSettings;

  // Add state for sort direction and type
  const [sortType, setSortType] = useState<SortType>(initialSettings.type);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSettings.direction,
  );

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

  // Track previous active view to know when it changes
  const [previousView, setPreviousView] = useState<FilterView>(activeView);

  // Save sort settings before view changes
  const saveSortSettings = useCallback(() => {
    if (previousView === 'tag') {
      setTagSortSettings({ type: sortType, direction: sortDirection });
    } else if (previousView === 'size') {
      setSizeSortSettings({ type: sortType, direction: sortDirection });
    } else {
      setFiletypeSortSettings({ type: sortType, direction: sortDirection });
    }
  }, [
    previousView,
    sortType,
    sortDirection,
    setTagSortSettings,
    setSizeSortSettings,
    setFiletypeSortSettings,
  ]);

  // Apply saved sort settings when switching views
  useEffect(() => {
    // If the view has changed
    if (activeView !== previousView) {
      // Save settings from the previous view first
      saveSortSettings();

      // Update previous view tracker
      setPreviousView(activeView);

      // Determine which settings to load based on the new active view
      let settings;
      if (activeView === 'tag') {
        settings = tagSortSettings;
      } else if (activeView === 'size') {
        settings = sizeSortSettings;
      } else {
        settings = filetypeSortSettings;
      }

      // Restore sort settings for the current view
      setSortType(settings.type);
      setSortDirection(settings.direction);

      // Reset list length and selected index
      setListLength(0);
      setSelectedIndex(-1);

      // Focus the input field when switching views (if it exists)
      // Use a small timeout to ensure the DOM is ready
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [
    activeView,
    previousView,
    saveSortSettings,
    tagSortSettings,
    sizeSortSettings,
    filetypeSortSettings,
    inputRef,
  ]);

  // Save settings when sort type or direction changes
  useEffect(() => {
    // Only save if this isn't the initial render and we're not in the middle of a view change
    if (activeView === previousView) {
      saveSortSettings();
    }
  }, [sortType, sortDirection, activeView, previousView, saveSortSettings]);

  // Function to update sort type with appropriate direction
  const updateSortType = useCallback((newSortType: SortType) => {
    // Batch the state updates to avoid triggering multiple renders
    switch (newSortType) {
      case 'count':
        // For count, always set direction to desc (9-0)
        setSortType(newSortType);
        setSortDirection('desc');
        break;
      case 'active':
        // For active, always set direction to asc (active first)
        setSortType(newSortType);
        setSortDirection('asc');
        break;
      case 'alphabetical':
        // For alphabetical, always set direction to asc (A-Z)
        setSortType(newSortType);
        setSortDirection('asc');
        break;
      case 'dimensions':
        // For dimensions, set direction to asc (0-9 by x then y)
        setSortType(newSortType);
        setSortDirection('asc');
        break;
      case 'megapixels':
        // For megapixels, set direction to asc (0-9)
        setSortType(newSortType);
        setSortDirection('asc');
        break;
      case 'aspectRatio':
        // For aspect ratio, keep current behavior
        setSortType(newSortType);
        setSortDirection('desc');
        break;
      default:
        // For other types, just update the type
        setSortType(newSortType);
    }
  }, []);

  return {
    activeView,
    setActiveView,
    sortDirection,
    setSortDirection,
    sortType,
    setSortType: updateSortType, // Use our updated function here
    searchTerm,
    setSearchTerm,
    selectedIndex,
    setSelectedIndex,
    listLength,
    updateListLength,
    getSortOptions,
  };
};
