import { useFilterContext } from '../filter-context';
import { SizeSubViewType } from '../types';
import { BucketsView } from './view-buckets';
import { SizesView } from './view-sizes';

export const SizeSubViewSelector = () => {
  const {
    sizeSubView,
    setSizeSubView,
    setSearchTerm,
    setSelectedIndex,
    setSortType,
    inputRef,
  } = useFilterContext();

  const handleSubViewChange = (subView: SizeSubViewType) => {
    setSizeSubView(subView);
    // Clear search and reset selection when switching sub-views
    setSearchTerm('');
    setSelectedIndex(-1);

    // Reset sort to 'count' when switching to buckets (since buckets don't support megapixels, etc.)
    if (subView === 'buckets') {
      setSortType('count');
    }

    // Focus the search input after a short delay to ensure it's rendered
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  };

  return (
    <div className="flex w-full items-center rounded-sm shadow-md inset-shadow-xs shadow-white inset-shadow-slate-300 dark:shadow-slate-900 dark:inset-shadow-slate-600">
      <button
        type="button"
        onClick={() => handleSubViewChange('dimensions')}
        className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
          sizeSubView === 'dimensions'
            ? 'bg-white shadow-sm dark:bg-slate-600'
            : 'hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        Images
      </button>
      <button
        type="button"
        onClick={() => handleSubViewChange('buckets')}
        className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
          sizeSubView === 'buckets'
            ? 'bg-white shadow-sm dark:bg-slate-600'
            : 'hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        Buckets
      </button>
    </div>
  );
};

// Component render
export const SizeSubView = () => {
  const { sizeSubView } = useFilterContext();

  return sizeSubView === 'dimensions' ? <SizesView /> : <BucketsView />;
};
