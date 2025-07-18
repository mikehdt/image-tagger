import {
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useState } from 'react';

import { markFilterTagsToDelete } from '@/app/store/assets';
import { selectFilterTags } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addTagToAssetsWithDualSelection,
  clearSelection,
} from '@/app/store/selection';
import { selectAssetsWithSelectedTagsCount } from '@/app/store/selection/combinedSelectors';

import { Button } from '../../shared/button';
import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { AddTagsModal } from './add-tags-modal';
import { EditTagsModal } from './edit-tags-modal';

interface TagActionsProps {
  selectedAssetsCount: number;
}

const TagActionsComponent = ({ selectedAssetsCount }: TagActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const filterTags = useAppSelector(selectFilterTags);
  const assetsWithSelectedTagsCount = useAppSelector(
    selectAssetsWithSelectedTagsCount,
  );

  // Determine if Add Tags button should be enabled
  // Enable if we have selected assets OR if we have selected tags
  const canAddTags = selectedAssetsCount > 0 || filterTags.length > 0;

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
    (
      tag: string,
      addToStart = false,
      applyToSelectedAssets = false,
      applyToAssetsWithSelectedTags = false,
    ) => {
      dispatch(
        addTagToAssetsWithDualSelection({
          tagName: tag,
          addToStart,
          applyToSelectedAssets,
          applyToAssetsWithSelectedTags,
        }),
      );
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
      <ResponsiveToolbarGroup
        icon={<SwatchIcon className="w-4" />}
        title="Tag Actions"
        position="center"
      >
        <Button
          type="button"
          onClick={openAddModel}
          disabled={!canAddTags}
          variant="ghost"
          color="slate"
          size="medium"
          title={
            selectedAssetsCount > 0 && filterTags.length > 0
              ? `Add tags to selected assets or assets with selected tags`
              : selectedAssetsCount > 0
                ? `Add tags to ${selectedAssetsCount} selected assets`
                : filterTags.length > 0
                  ? `Add tags to ${assetsWithSelectedTagsCount} assets with selected tags`
                  : 'Select assets or tags to add new tags'
          }
        >
          <TagIcon className="w-4" />
          <span className="ml-2 max-xl:hidden">Add</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={openEditModal}
          disabled={!filterTags.length}
          title="Edit selected tags"
        >
          <PencilIcon className="w-4" />
          <span className="ml-2 max-xl:hidden">Edit</span>
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
          <span className="ml-2 max-xl:hidden">Delete</span>
        </Button>
      </ResponsiveToolbarGroup>

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

export const TagActions = memo(TagActionsComponent);
