import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useMemo,
  useRef,
} from 'react';

import {
  useFilterState,
  useKeyboardNavigation,
  useOutsideClick,
  usePanelPosition,
} from './hooks';
import { FilterListProps, FilterView, SortDirection, SortType } from './types';

interface FilterListContextType {
  // Panel positioning
  position: { top: number; left: number };
  isPositioned: boolean;
  panelRef: RefObject<HTMLDivElement | null>;

  // Filter state
  activeView: FilterView;
  setActiveView: (view: FilterView) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  sortType: SortType;
  setSortType: (type: SortType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  listLength: number;
  updateListLength: (length: number) => void;
  getSortOptions: () => {
    typeLabel: string;
    directionLabel: string;
    nextType: SortType;
  };

  // Input reference
  inputRef: RefObject<HTMLInputElement | null>;

  // Keyboard navigation
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Close function
  onClose: () => void;
}

// Create the context with a default undefined value
const FilterListContext = createContext<FilterListContextType | undefined>(
  undefined,
);

// Provider component
export const FilterListProvider = ({
  children,
  isOpen,
  onClose,
  containerRef,
}: {
  children: ReactNode;
} & FilterListProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use custom hooks to manage different aspects of the component
  const { position, isPositioned } = usePanelPosition(isOpen, containerRef);

  const {
    activeView,
    setActiveView,
    sortDirection,
    setSortDirection,
    sortType,
    setSortType,
    searchTerm,
    setSearchTerm,
    selectedIndex,
    setSelectedIndex,
    listLength,
    updateListLength,
    getSortOptions,
  } = useFilterState(inputRef);

  const { handleKeyDown } = useKeyboardNavigation(
    listLength,
    selectedIndex,
    setSelectedIndex,
    onClose,
    inputRef,
  );

  // Handle clicks outside the panel
  useOutsideClick(isOpen, onClose, panelRef, containerRef);

  // Create the value object for the context
  // Use useMemo to prevent unnecessary re-renders when the value hasn't changed
  const contextValue = useMemo(
    () => ({
      position,
      isPositioned,
      panelRef,
      activeView,
      setActiveView,
      sortDirection,
      setSortDirection,
      sortType,
      setSortType,
      searchTerm,
      setSearchTerm,
      selectedIndex,
      setSelectedIndex,
      listLength,
      updateListLength,
      getSortOptions,
      inputRef,
      handleKeyDown,
      onClose,
    }),
    [
      position,
      isPositioned,
      panelRef,
      activeView,
      setActiveView,
      sortDirection,
      setSortDirection,
      sortType,
      setSortType,
      searchTerm,
      setSearchTerm,
      selectedIndex,
      setSelectedIndex,
      listLength,
      updateListLength,
      getSortOptions,
      inputRef,
      handleKeyDown,
      onClose,
    ],
  );

  return (
    <FilterListContext.Provider value={contextValue}>
      {children}
    </FilterListContext.Provider>
  );
};

// Custom hook to use the context
export const useFilterList = () => {
  const context = useContext(FilterListContext);
  if (context === undefined) {
    throw new Error('useFilterList must be used within a FilterListProvider');
  }
  return context;
};
