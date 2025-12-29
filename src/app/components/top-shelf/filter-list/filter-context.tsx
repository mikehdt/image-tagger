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
  getBucketSortOptions,
  getFiletypeSortOptions,
  getSizeSortOptions,
  getTagSortOptions,
} from './components';
import { useKeyboardNavigation } from './hooks';
import { FilterView, SizeSubViewType, SortDirection, SortType } from './types';

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
}

export const FilterProvider = ({ children, onClose }: FilterProviderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSortSettings((prev) => {
        if (activeView === 'size') {
          return {
            ...prev,
            size: {
              ...prev.size,
              [sizeSubView]: { ...prev.size[sizeSubView], type },
            },
          };
        }
        return {
          ...prev,
          [activeView]: { ...prev[activeView], type },
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
  const getSortOptions = useCallback(() => {
    const sortType = currentSort.type;
    const sortDirection = currentSort.direction;

    switch (activeView) {
      case 'tag':
        return getTagSortOptions(sortType, sortDirection);
      case 'size':
        // Use different sort options based on sub-view
        if (sizeSubView === 'buckets') {
          return getBucketSortOptions(sortType, sortDirection);
        } else {
          return getSizeSortOptions(sortType, sortDirection);
        }
      case 'filetype':
        return getFiletypeSortOptions(sortType, sortDirection);
      default:
        return {
          typeLabel: 'Count',
          directionLabel: 'High to Low',
          nextType: 'count' as SortType,
        };
    }
  }, [activeView, sizeSubView, currentSort.type, currentSort.direction]);

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation(
    listLength,
    selectedIndex,
    setSelectedIndex,
    onClose,
    inputRef,
  );

  // Reset selected index when search term changes
  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
    setSelectedIndex(-1);
  }, []);

  // Reset search when view changes, and persist the view
  const handleViewChange = useCallback((view: FilterView) => {
    persistedActiveView = view;
    setActiveView(view);
    setSearchTerm('');
    setSelectedIndex(-1);
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
      getSortOptions,
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
      handleKeyDown,
      getSortOptions,
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
