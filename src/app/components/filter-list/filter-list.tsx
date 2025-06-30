import { useEffect, useState } from 'react';

import {
  FiletypesView,
  FilterControls,
  SearchInput,
  SizesView,
  TagsView,
  ViewSelector,
} from './components';
import { FilterListProvider, useFilterList } from './filter-list-context';
import { SearchProvider } from './search-context';
import { FilterListProps } from './types';

export const FilterList = ({
  isOpen,
  onClose,
  containerRef,
}: FilterListProps) => {
  // Use the provider pattern to share state with all children
  return (
    <FilterListProvider
      isOpen={isOpen}
      onClose={onClose}
      containerRef={containerRef}
    >
      <FilterPanel />
    </FilterListProvider>
  );
};

// This component represents the panel itself and uses the context
const FilterPanel = () => {
  const {
    position,
    isPositioned,
    panelRef,
    activeView,
    searchTerm,
    setSearchTerm,
    inputRef,
    handleKeyDown,
    isOpen, // We use isOpen directly from context
  } = useFilterList();

  // We're simplifying to match the dropdown behavior
  // We'll use absolute positioning with calculated position adjustment
  const [panelPosition, setPanelPosition] = useState({ right: true, left: 0 });

  // Calculate position when the panel opens or its positioning changes
  useEffect(() => {
    if (isOpen && isPositioned) {
      // Use right alignment by default (similar to dropdown's alignRight)
      let useRightAlignment = true;
      let leftPosition = 0;

      // Check if we need to adjust left position to keep within viewport
      if (position.left < 0) {
        useRightAlignment = false;
        leftPosition = 16; // Small padding from left edge
      }

      setPanelPosition({
        right: useRightAlignment,
        left: leftPosition,
      });
    }
  }, [isOpen, isPositioned, position]);

  // Focus the search input when the panel opens and search is available
  useEffect(() => {
    if (
      isOpen &&
      isPositioned &&
      inputRef.current &&
      activeView !== 'filetype'
    ) {
      // Use requestAnimationFrame to focus after the next paint
      // This ensures the panel is fully rendered and visible
      const frameId = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [isOpen, isPositioned, inputRef, activeView]);

  return (
    <div
      ref={panelRef}
      style={{
        right: panelPosition.right ? 0 : 'auto',
        left: panelPosition.right ? 'auto' : `${panelPosition.left}px`,
        minWidth: '256px', // 16rem = 256px (w-64)
      }}
      className={`absolute z-20 mt-1 flex max-h-[80vh] w-64 origin-top-right flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-in-out ${
        isOpen
          ? 'scale-100 opacity-100'
          : 'pointer-events-none scale-95 opacity-0'
      }`}
    >
      <div className="inline-flex w-full items-center bg-slate-100 p-2">
        <ViewSelector />
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-2">
        <FilterControls />
      </div>

      {/* Only show search box for tag and size views, not for filetype view */}
      {activeView !== 'filetype' && (
        <div className="relative inline-flex bg-slate-50 px-2 pb-2">
          <SearchProvider
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            inputRef={inputRef}
            handleKeyDown={handleKeyDown}
            activeView={activeView}
          >
            <SearchInput />
          </SearchProvider>
        </div>
      )}

      <div className="overflow-y-auto border-t border-slate-200">
        {activeView === 'tag' ? (
          <TagsView />
        ) : activeView === 'size' ? (
          <SizesView />
        ) : (
          <FiletypesView />
        )}
      </div>
    </div>
  );
};
