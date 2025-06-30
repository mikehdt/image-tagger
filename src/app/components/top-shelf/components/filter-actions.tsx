import { DocumentMinusIcon } from '@heroicons/react/24/outline';

interface FilterActionsProps {
  filterTags: string[];
  markFilterTagsToDelete: (tags: string[]) => void;
}

export const FilterActions = ({
  filterTags,
  markFilterTagsToDelete,
}: FilterActionsProps) => {
  return (
    <div className="mr-4 ml-auto flex items-center">
      <button
        className={`inline-flex items-center py-2 transition-colors ${
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
    </div>
  );
};
