import { DocumentMinusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterActionsProps {
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  filterModifiedActive: boolean;
  markFilterTagsToDelete: (tags: string[]) => void;
  clearFilters: () => void;
}

export const FilterActions = ({
  filterTags,
  filterSizes,
  filterExtensions,
  filterModifiedActive,
  markFilterTagsToDelete,
  clearFilters,
}: FilterActionsProps) => {
  // Derive filterActive within the component
  const filterActive = !!(
    filterTags.length ||
    filterSizes.length ||
    filterExtensions.length ||
    filterModifiedActive
  );
  return (
    <div className="mr-4 ml-auto flex items-center">
      <button
        className={`mr-4 inline-flex items-center py-2 transition-colors ${
          filterTags.length
            ? 'cursor-pointer text-slate-700 hover:text-slate-500'
            : 'cursor-not-allowed text-slate-300'
        }`}
        type="button"
        onClick={() => markFilterTagsToDelete(filterTags)}
        disabled={!filterTags.length}
        title="Toggle selected tags for deletion"
      >
        <DocumentMinusIcon className="mr-1 w-4" />
        Toggle Delete
      </button>

      <button
        className={`inline-flex items-center py-2 transition-colors ${
          filterActive
            ? 'cursor-pointer text-slate-700 hover:text-slate-500'
            : 'cursor-not-allowed text-slate-300'
        }`}
        type="button"
        onClick={clearFilters}
        disabled={!filterActive}
      >
        <XMarkIcon className="mr-1 w-4" />
        Clear
      </button>
    </div>
  );
};
