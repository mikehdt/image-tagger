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
  useKeyboardNavigation,
  useOutsideClick,
  usePanelPosition,
} from './hooks';
import { FilterListProps, FilterView, SortDirection, SortType } from './types';

interface FilterContextType {
  // Panel visibility and positioning
  isOpen: boolean;
  position: { top: number; left: number };
  isPositioned: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;

  // Persistent filter state (combines both providers)
  activeView: FilterView;
  setActiveView: (view: FilterView) => void;

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

export const FilterProvider = ({
  children,
  isOpen,
  onClose,
  containerRef,
}: {
  children: ReactNode;
} & FilterListProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persistent state for view and sort settings
  const [activeView, setActiveView] = useState<FilterView>('tag');
  const [sortSettings, setSortSettings] = useState({
    tag: { type: 'count' as SortType, direction: 'desc' as SortDirection },
    size: { type: 'count' as SortType, direction: 'desc' as SortDirection },
    filetype: { type: 'count' as SortType, direction: 'desc' as SortDirection },
  });

  // Transient state for search and navigation
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [listLength, setListLength] = useState(0);

  // Panel positioning
  const { position, isPositioned } = usePanelPosition(isOpen, containerRef);

  // Get current sort settings based on active view
  const currentSort = sortSettings[activeView];

  //  sort setters that update the correct view settings
  const setSortDirection = useCallback(
    (direction: SortDirection) => {
      setSortSettings((prev) => ({
        ...prev,
        [activeView]: { ...prev[activeView], direction },
      }));
    },
    [activeView],
  );

  const setSortType = useCallback(
    (type: SortType) => {
      setSortSettings((prev) => ({
        ...prev,
        [activeView]: { ...prev[activeView], type },
      }));
    },
    [activeView],
  );

  // Update list length
  const updateListLength = useCallback((length: number) => {
    setListLength(length);
  }, []);

  // Get sort options for current view
  const getSortOptions = useCallback(() => {
    // Import these functions at the top if they're not already imported
    const getters = {
      tag: () => ({
        typeLabel: 'Count',
        directionLabel: 'High to Low',
        nextType: 'alpha' as SortType,
      }),
      size: () => ({
        typeLabel: 'Count',
        directionLabel: 'High to Low',
        nextType: 'alpha' as SortType,
      }),
      filetype: () => ({
        typeLabel: 'Count',
        directionLabel: 'High to Low',
        nextType: 'alpha' as SortType,
      }),
    };

    return getters[activeView]();
  }, [activeView]);

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation(
    listLength,
    selectedIndex,
    setSelectedIndex,
    onClose,
    inputRef,
  );

  // Outside click handling
  useOutsideClick(isOpen, onClose, panelRef, containerRef);

  // Reset selected index when search term changes
  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
    setSelectedIndex(-1);
  }, []);

  // Reset search when view changes
  const handleViewChange = useCallback((view: FilterView) => {
    setActiveView(view);
    setSearchTerm('');
    setSelectedIndex(-1);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isOpen,
      position,
      isPositioned,
      panelRef,
      onClose,
      activeView,
      setActiveView: handleViewChange,
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
      isOpen,
      position,
      isPositioned,
      onClose,
      activeView,
      handleViewChange,
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
    throw new Error('useFilterContext must be used within an FilterProvider');
  }
  return context;
};

// For backwards compatibility
export const useFilterList = useFilterContext;
