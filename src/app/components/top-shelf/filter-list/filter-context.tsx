import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FilterView,
  getSortOptions,
  SizeSubViewType,
  SORT_CYCLES,
  SortDirection,
  SortType,
} from './types';
import { useKeyboardNavigation } from './use-keyboard-navigation';

// Get the default sort direction for a given sort type
const getDefaultDirection = (type: SortType): SortDirection => {
  switch (type) {
    case 'alphabetical':
      return 'asc'; // A-Z
    case 'count':
    case 'active':
    case 'dimensions':
    case 'aspectRatio':
    case 'megapixels':
    default:
      return 'desc'; // High values first / active first
  }
};

// Persist state across popup open/close cycles (module-level variables)
let persistedActiveView: FilterView = 'tag';
let persistedSizeSubView: SizeSubViewType = 'dimensions';
let persistedSortSettings = {
  tag: { type: 'count' as SortType, direction: 'desc' as SortDirection },
  size: {
    dimensions: {
      type: 'count' as SortType,
      direction: 'desc' as SortDirection,
    },
    buckets: {
      type: 'count' as SortType,
      direction: 'desc' as SortDirection,
    },
  },
  filetype: { type: 'count' as SortType, direction: 'desc' as SortDirection },
};

interface FilterContextType {
  // Close handler (provided by popup system)
  onClose: () => void;

  // Persistent filter state
  activeView: FilterView;
  setActiveView: (view: FilterView) => void;

  // Size sub-view state (for when activeView is 'size')
  sizeSubView: SizeSubViewType;
  setSizeSubView: (subView: SizeSubViewType) => void;

  // Current sort settings (derived from active view)
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  sortType: SortType;
  setSortType: (type: SortType) => void;

  // Search and navigation
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  listLength: number;
  updateListLength: (length: number) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleItemMouseMove: (index: number) => void;
  handleItemClick: (index: number) => void;
  resetKeyboardIndex: () => void;
  handleListMouseLeave: () => void;

  // Sort options getter
  getSortOptions: () => {
    typeLabel: string;
    directionLabel: string;
    nextType: SortType;
  };
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
  onClose: () => void;
  /** Ref to the search input, for focus management */
  inputRef: RefObject<HTMLInputElement | null>;
}

export const FilterProvider = ({
  children,
  onClose,
  inputRef,
}: FilterProviderProps) => {
  // Persistent state for view and sort settings (initialized from module-level variables)
  const [activeView, setActiveView] = useState<FilterView>(persistedActiveView);
  const [sizeSubView, setSizeSubViewState] =
    useState<SizeSubViewType>(persistedSizeSubView);
  const [sortSettings, setSortSettingsState] = useState(persistedSortSettings);

  // Transient state for search and navigation
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [listLength, setListLength] = useState(0);

  // Get current sort settings based on active view and sub-view
  const currentSort = useMemo(() => {
    if (activeView === 'size') {
      return sortSettings[activeView][sizeSubView];
    }
    return sortSettings[activeView];
  }, [activeView, sizeSubView, sortSettings]);

  // Wrapper for setSizeSubView that also persists to module-level variable
  const setSizeSubView = useCallback((subView: SizeSubViewType) => {
    persistedSizeSubView = subView;
    setSizeSubViewState(subView);
  }, []);

  // Helper to update sort settings and persist to module-level variable
  const setSortSettings = useCallback(
    (
      updater: (
        prev: typeof persistedSortSettings,
      ) => typeof persistedSortSettings,
    ) => {
      setSortSettingsState((prev) => {
        const next = updater(prev);
        persistedSortSettings = next;
        return next;
      });
    },
    [],
  );

  // Sort setters that update the correct view settings
  const setSortDirection = useCallback(
    (direction: SortDirection) => {
      setSortSettings((prev) => {
        if (activeView === 'size') {
          return {
            ...prev,
            size: {
              ...prev.size,
              [sizeSubView]: { ...prev.size[sizeSubView], direction },
            },
          };
        }
        return {
          ...prev,
          [activeView]: { ...prev[activeView], direction },
        };
      });
    },
    [activeView, sizeSubView, setSortSettings],
  );

  const setSortType = useCallback(
    (type: SortType) => {
      const direction = getDefaultDirection(type);
      setSortSettings((prev) => {
        if (activeView === 'size') {
          return {
            ...prev,
            size: {
              ...prev.size,
              [sizeSubView]: { type, direction },
            },
          };
        }
        return {
          ...prev,
          [activeView]: { type, direction },
        };
      });
    },
    [activeView, sizeSubView, setSortSettings],
  );

  // Update list length
  const updateListLength = useCallback((length: number) => {
    setListLength(length);
  }, []);

  // Get sort options for current view
  const getSortOptionsForView = useCallback(() => {
    const cycle =
      activeView === 'size'
        ? SORT_CYCLES[sizeSubView]
        : SORT_CYCLES[activeView];
    return getSortOptions(currentSort.type, currentSort.direction, cycle);
  }, [activeView, sizeSubView, currentSort.type, currentSort.direction]);

  // Tracks the last keyboard-driven index (-1 = no KB position)
  const keyboardIndexRef = useRef(-1);

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation(
    listLength,
    selectedIndex,
    setSelectedIndex,
    onClose,
    inputRef,
    keyboardIndexRef,
  );

  // Mouse hover sets selectedIndex (only when moving to a different item)
  const handleItemMouseMove = useCallback(
    (index: number) => {
      if (index !== selectedIndex) {
        setSelectedIndex(index);
      }
    },
    [selectedIndex, setSelectedIndex],
  );

  // Mouse clicks don't anchor the KB position — only arrow keys do.
  // This keeps mouse-leave from persisting a highlight set purely by mouse.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemClick = useCallback((_index: number) => {}, []);

  // Allow consumers to reset the keyboard index (e.g. when input text changes)
  const resetKeyboardIndex = useCallback(() => {
    keyboardIndexRef.current = -1;
  }, []);

  // Mouse leave restores to KB position (or clears if no KB position)
  const handleListMouseLeave = useCallback(() => {
    setSelectedIndex(keyboardIndexRef.current);
  }, [setSelectedIndex]);

  // Reset selected index when search term changes
  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
    setSelectedIndex(-1);
    keyboardIndexRef.current = -1;
  }, []);

  // Reset search when view changes, and persist the view
  const handleViewChange = useCallback((view: FilterView) => {
    persistedActiveView = view;
    setActiveView(view);
    setSearchTerm('');
    setSelectedIndex(-1);
    keyboardIndexRef.current = -1;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      onClose,
      activeView,
      setActiveView: handleViewChange,
      sizeSubView,
      setSizeSubView,
      sortDirection: currentSort.direction,
      setSortDirection,
      sortType: currentSort.type,
      setSortType,
      searchTerm,
      setSearchTerm: handleSearchTermChange,
      selectedIndex,
      setSelectedIndex,
      listLength,
      updateListLength,
      inputRef,
      handleKeyDown,
      handleItemMouseMove,
      handleItemClick,
      resetKeyboardIndex,
      handleListMouseLeave,
      getSortOptions: getSortOptionsForView,
    }),
    [
      onClose,
      activeView,
      handleViewChange,
      sizeSubView,
      currentSort.direction,
      currentSort.type,
      setSortDirection,
      setSortType,
      searchTerm,
      handleSearchTermChange,
      selectedIndex,
      listLength,
      updateListLength,
      inputRef,
      handleKeyDown,
      handleItemMouseMove,
      handleItemClick,
      resetKeyboardIndex,
      handleListMouseLeave,
      getSortOptionsForView,
      setSizeSubView,
    ],
  );

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

// Hook for consuming the context
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
