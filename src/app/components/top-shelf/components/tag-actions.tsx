import {
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

import { markFilterTagsToDelete } from '@/app/store/assets';
import { selectFilterTags } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { addTagToSelectedAssets, clearSelection } from '@/app/store/selection';

import { Button } from '../../shared/button';
import { AddTagsModal } from './add-tags-modal';
import { EditTagsModal } from './edit-tags-modal';

interface TagActionsProps {
  selectedAssetsCount: number;
}

export const TagActions = ({ selectedAssetsCount }: TagActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const filterTags = useAppSelector(selectFilterTags);

  const handleMarkFilterTagsToDelete = useCallback(
    (tags: string[]) => dispatch(markFilterTagsToDelete(tags)),
    [dispatch],
  );

  const openAddModel = useCallback(() => setIsAddTagsModalOpen(true), []);

  const openEditModal = useCallback(() => {
    if (filterTags.length > 0) {
      setIsEditModalOpen(true);
    }
  }, [filterTags.length]);

  const toggleFilterTagsDelete = useCallback(() => {
    handleMarkFilterTagsToDelete(filterTags);
    setIsToggled(!isToggled);
  }, [filterTags, isToggled, handleMarkFilterTagsToDelete]);

  const handleAddTag = useCallback(
    (tag: string, addToStart = false) => {
      dispatch(addTagToSelectedAssets({ tagName: tag, addToStart }));
      setIsAddTagsModalOpen(false);
    },
    [dispatch],
  );

  const handleClearSelection = useCallback(
    () => dispatch(clearSelection()),
    [dispatch],
  );

  const handleOnCloseAddModal = useCallback(
    () => setIsAddTagsModalOpen(false),
    [],
  );

  const handleOnCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

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
          onClick={openAddModel}
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
