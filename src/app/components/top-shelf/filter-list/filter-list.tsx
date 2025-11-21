import { useEffect, useState } from 'react';

import {
  FileView,
  FilterControls,
  SearchInput,
  SizeSubView,
  SizeSubViewSelector,
  TagsView,
  ViewSelector,
} from './components';
import { FilterProvider, useFilterContext } from './filter-context';
import { SearchProvider } from './search-context';
import { FilterListProps } from './types';

export const FilterList = ({
  isOpen,
  onClose,
  containerRef,
}: FilterListProps) => {
  return (
    <FilterProvider
      isOpen={isOpen}
      onClose={onClose}
      containerRef={containerRef}
    >
      <FilterPanel />
    </FilterProvider>
  );
};

// This component represents the panel itself and uses the  context
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
    isOpen,
  } = useFilterContext();

  // Simplified positioning logic
  const [panelPosition, setPanelPosition] = useState({ right: true, left: 0 });

  const [renderList, setRenderList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional animation state management
      setRenderList(true);
    } else if (!isOpen && renderList) {
      setTimeout(() => setRenderList(false), 150);
    }
  }, [isOpen, renderList]);

  // Calculate position when the panel opens or its positioning changes
  useEffect(() => {
    if (isOpen && isPositioned) {
      // Use right alignment by default
      let useRightAlignment = true;
      let leftPosition = 0;

      // Check if we need to adjust left position to keep within viewport
      if (position.left < 0) {
        useRightAlignment = false;
        leftPosition = 16; // Small padding from left edge
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional DOM measurement for positioning
      setPanelPosition({
        right: useRightAlignment,
        left: leftPosition,
      });
    }
  }, [isOpen, isPositioned, position]);

  // Focus the search input when the panel opens
  useEffect(() => {
    if (
      isOpen &&
      isPositioned &&
      inputRef.current &&
      activeView !== 'filetype'
    ) {
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
        minWidth: '256px',
      }}
      className={`absolute z-20 mt-1 flex max-h-[80vh] w-64 origin-top-right flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-in-out ${
        isOpen
          ? 'scale-100 opacity-100'
          : 'pointer-events-none scale-95 opacity-0'
      }`}
    >
      {renderList ? (
        <>
          <div className="inline-flex w-full items-center bg-slate-100 p-2">
            <ViewSelector />
          </div>

          {/* Show size sub-view selector when size view is active */}
          {activeView === 'size' && (
            <div className="bg-slate-100 p-2 pt-0">
              <SizeSubViewSelector />
            </div>
          )}

          {/* Show file sub-view selector here... */}

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-2">
            <FilterControls />
          </div>

          {/* Only show search box for tag and size views */}
          {(activeView === 'tag' || activeView === 'size') && (
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
              <SizeSubView />
            ) : (
              <FileView />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
