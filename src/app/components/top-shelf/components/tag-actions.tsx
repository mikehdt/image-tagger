import {
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addTagToSelectedAssets, clearSelection } from '@/app/store/selection';

import { Button } from '../../shared/button';
import { AddTagsModal } from './add-tags-modal';
import { EditTagsModal } from './edit-tags-modal';

interface TagActionsProps {
  filterTags: string[];
  selectedAssetsCount: number;
  markFilterTagsToDelete: (tags: string[]) => void;
}

export const TagActions = ({
  filterTags,
  selectedAssetsCount,
  markFilterTagsToDelete,
}: TagActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  const dispatch = useAppDispatch();

  const openEditModal = () => {
    if (filterTags.length > 0) {
      setIsEditModalOpen(true);
    }
  };

  const toggleFilterTagsDelete = () => {
    markFilterTagsToDelete(filterTags);
    setIsToggled(!isToggled);
  };

  const handleAddTag = (tag: string, addToStart = false) => {
    dispatch(addTagToSelectedAssets({ tagName: tag, addToStart }));
    setIsAddTagsModalOpen(false);
  };

  const handleClearSelection = () => dispatch(clearSelection());

  const handleOnCloseAddModal = () => setIsAddTagsModalOpen(false);

  const handleOnCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center space-x-1 rounded-md bg-slate-100 px-1 py-1">
        <span
          className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1"
          title="Tag Actions"
        >
          <SwatchIcon className="w-4 text-slate-400" />
        </span>

        <Button
          type="button"
          onClick={() => setIsAddTagsModalOpen(true)}
          disabled={selectedAssetsCount < 2}
          variant="ghost"
          color="slate"
          size="medium"
          title="Add tags to selected assets"
        >
          <TagIcon className="w-4" />
          <span className="ml-2 max-lg:hidden">Add</span>
        </Button>

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
          <span className="ml-2 max-lg:hidden">Delete</span>
        </Button>
      </div>

      <AddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={handleOnCloseAddModal}
        onClearSelection={handleClearSelection}
        selectedAssetsCount={selectedAssetsCount}
        onAddTag={handleAddTag}
      />

      <EditTagsModal
        isOpen={isEditModalOpen}
        onClose={handleOnCloseEditModal}
        filterTags={filterTags}
      />
    </>
  );
};
