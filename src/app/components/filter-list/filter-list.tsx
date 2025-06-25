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
  // If not open, don't render anything
  if (!isOpen) return null;

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
  } = useFilterList();

  if (!isPositioned) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-20 flex max-h-[80vh] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transformOrigin: 'top left',
      }}
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
