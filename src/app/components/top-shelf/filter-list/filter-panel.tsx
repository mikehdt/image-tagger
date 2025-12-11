import {
  FileView,
  FilterControls,
  SearchInput,
  SizeSubView,
  SizeSubViewSelector,
  TagsView,
  ViewSelector,
} from './components';
import { useFilterContext } from './filter-context';
import { SearchProvider } from './search-context';

/**
 * The filter panel content - renders inside the popup.
 * Uses FilterContext for state management.
 */
export const FilterPanel = () => {
  const {
    activeView,
    searchTerm,
    setSearchTerm,
    inputRef,
    handleKeyDown,
  } = useFilterContext();

  return (
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
  );
};
