import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useMemo,
} from 'react';

import { FilterView } from './types';

// Interface for search related context
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  activeView: FilterView; // Needed to decide placeholder text
}

// Create the context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider component
export const SearchProvider = ({
  children,
  searchTerm,
  setSearchTerm,
  inputRef,
  handleKeyDown,
  activeView,
}: {
  children: ReactNode;
} & SearchContextType) => {
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      inputRef,
      handleKeyDown,
      activeView,
    }),
    [searchTerm, setSearchTerm, inputRef, handleKeyDown, activeView],
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook to use the search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
