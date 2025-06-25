import { createContext, ReactNode, useContext, useState } from 'react';

import { FilterView, SortDirection, SortType } from './types';

interface PersistentFilterContextType {
  // Filter state that should persist between panel opens
  activeView: FilterView;
  setActiveView: (view: FilterView) => void;

  // Sort settings for each view type
  tagSortSettings: {
    type: SortType;
    direction: SortDirection;
  };
  setTagSortSettings: (settings: {
    type: SortType;
    direction: SortDirection;
  }) => void;

  sizeSortSettings: {
    type: SortType;
    direction: SortDirection;
  };
  setSizeSortSettings: (settings: {
    type: SortType;
    direction: SortDirection;
  }) => void;

  filetypeSortSettings: {
    type: SortType;
    direction: SortDirection;
  };
  setFiletypeSortSettings: (settings: {
    type: SortType;
    direction: SortDirection;
  }) => void;
}

// Create the context
const PersistentFilterContext = createContext<
  PersistentFilterContextType | undefined
>(undefined);

// Provider component
export const PersistentFilterProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // State for active view that persists between opens
  const [activeView, setActiveView] = useState<FilterView>('tag');

  // Sort settings for each view type
  const [tagSortSettings, setTagSortSettings] = useState<{
    type: SortType;
    direction: SortDirection;
  }>({
    type: 'count',
    direction: 'desc',
  });

  const [sizeSortSettings, setSizeSortSettings] = useState<{
    type: SortType;
    direction: SortDirection;
  }>({
    type: 'count',
    direction: 'desc',
  });

  const [filetypeSortSettings, setFiletypeSortSettings] = useState<{
    type: SortType;
    direction: SortDirection;
  }>({
    type: 'count',
    direction: 'desc',
  });

  return (
    <PersistentFilterContext.Provider
      value={{
        activeView,
        setActiveView,
        tagSortSettings,
        setTagSortSettings,
        sizeSortSettings,
        setSizeSortSettings,
        filetypeSortSettings,
        setFiletypeSortSettings,
      }}
    >
      {children}
    </PersistentFilterContext.Provider>
  );
};

// Hook for consuming the context
export const usePersistentFilterState = () => {
  const context = useContext(PersistentFilterContext);

  if (context === undefined) {
    throw new Error(
      'usePersistentFilterState must be used within a PersistentFilterProvider',
    );
  }

  return context;
};
