import {
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

import { Button } from '../../shared/button';
import { EditTagsModal } from './edit-tags-modal';

interface FilterActionsProps {
  filterTags: string[];
  markFilterTagsToDelete: (tags: string[]) => void;
  onClearSelection?: () => void;
}

export const FilterActions = ({
  filterTags,
  markFilterTagsToDelete,
}: FilterActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggled, setIsToggled] = useState(false);

  const openEditModal = () => {
    if (filterTags.length > 0) {
      setIsEditModalOpen(true);
    }
  };

  const toggleFilterTagsDelete = () => {
    markFilterTagsToDelete(filterTags);
    setIsToggled(!isToggled);
  };

  const handleOnCloseModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center space-x-1 rounded-md bg-slate-100 px-1 py-1">
        <span className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1">
          <SwatchIcon className="w-4 text-slate-400" />
        </span>

        <Button
          type="button"
          variant="ghost"
          onClick={openEditModal}
          disabled={!filterTags.length}
          title="Edit selected tags"
        >
          <PencilIcon className="w-4" />
          <span className="ml-2 max-lg:hidden">Edit</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={toggleFilterTagsDelete}
          disabled={!filterTags.length}
          title="Toggle selected tags for deletion"
        >
          {isToggled ? (
            <DocumentPlusIcon className="w-4" />
          ) : (
            <DocumentMinusIcon className="w-4" />
          )}
          <span className="ml-2 max-lg:hidden">Toggle</span>
        </Button>
      </div>

      <EditTagsModal
        isOpen={isEditModalOpen}
        onClose={handleOnCloseModal}
        filterTags={filterTags}
      />
    </>
  );
};
