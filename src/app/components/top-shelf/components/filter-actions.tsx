import { DocumentMinusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { EditTagsModal } from './edit-tags-modal';

interface FilterActionsProps {
  filterTags: string[];
  markFilterTagsToDelete: (tags: string[]) => void;
  onClearSelection?: () => void;
}

export const FilterActions = ({
  filterTags,
  markFilterTagsToDelete,
  onClearSelection,
}: FilterActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openEditModal = () => {
    if (filterTags.length > 0) {
      setIsEditModalOpen(true);
    }
  };

  return (
    <>
      <div className="mr-2 flex items-center rounded-md bg-slate-100 px-1 py-1">
        <button
          className={`mr-2 flex items-center rounded-sm border border-slate-300/0 px-2 py-1 transition-colors ${
            filterTags.length
              ? 'cursor-pointer text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 hover:inset-shadow-xs hover:inset-shadow-white'
              : 'cursor-not-allowed text-slate-300'
          }`}
          type="button"
          onClick={openEditModal}
          disabled={!filterTags.length}
          title="Edit selected tags"
        >
          <PencilIcon className="mr-1 w-4" />
          Edit
        </button>

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

      {/* Edit tags modal */}
      <EditTagsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        filterTags={filterTags}
        onClearSelection={onClearSelection}
      />
    </>
  );
};
