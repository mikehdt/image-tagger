import {
  FileView,
  FilterControls,
  SizeSubView,
  SizeSubViewSelector,
  TagsView,
  ViewSelector,
} from './components';
import { useFilterContext } from './filter-context';

/**
 * The filter panel content - renders inside the popup.
 * Uses FilterContext for state management.
 */
export const FilterPanel = () => {
  const { activeView } = useFilterContext();

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
