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
    <div className="mr-2 flex items-center rounded-md bg-slate-100 px-1 py-1">
      <button
        className={`flex items-center rounded-sm border border-slate-300/0 px-2 py-1 transition-colors ${
          filterTags.length
            ? 'cursor-pointer text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 hover:inset-shadow-xs hover:inset-shadow-white'
            : 'cursor-not-allowed text-slate-300'
        }`}
        type="button"
        onClick={() => markFilterTagsToDelete(filterTags)}
        disabled={!filterTags.length}
        title="Toggle selected tags for deletion"
      >
        <DocumentMinusIcon className="mr-1 w-4" />
        Toggle
      </button>
    </div>
  );
};
