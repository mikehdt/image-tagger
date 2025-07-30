import {
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useState } from 'react';

import { markFilterTagsToDelete } from '@/app/store/assets';
import { selectFilterTagsDeleteState } from '@/app/store/assets/selectors';
import { selectFilterTags, selectHasActiveFilters } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addMultipleTagsToAssetsWithDualSelection,
  addTagToAssetsWithDualSelection,
  clearSelection,
} from '@/app/store/selection';
import { selectAssetsWithActiveFiltersCount } from '@/app/store/selection/combinedSelectors';

import { Button } from '../../shared/button';
import { ResponsiveToolbarGroupV2 as ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { AddTagsModal } from './add-tags-modal';
import { DocumentMixedIcon } from './document-mixed-icon';
import { EditTagsModal } from './edit-tags-modal';

interface TagActionsProps {
  selectedAssetsCount: number;
}

const TagActionsComponent = ({ selectedAssetsCount }: TagActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const filterTags = useAppSelector(selectFilterTags);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const filterTagsDeleteState = useAppSelector(selectFilterTagsDeleteState);
  const assetsWithActiveFiltersCount = useAppSelector(
    selectAssetsWithActiveFiltersCount,
  );

  // Determine if Add Tags button should be enabled
  // Enable if we have selected assets OR if we have any active filters
  const canAddTags = selectedAssetsCount > 0 || hasActiveFilters;

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
  }, [filterTags, handleMarkFilterTagsToDelete]);

  const handleAddTag = useCallback(
    (
      tag: string,
      addToStart = false,
      applyToSelectedAssets = false,
      applyToAssetsWithActiveFilters = false,
    ) => {
      dispatch(
        addTagToAssetsWithDualSelection({
          tagName: tag,
          addToStart,
          applyToSelectedAssets,
          applyToAssetsWithActiveFilters,
        }),
      );
      setIsAddTagsModalOpen(false);
    },
    [dispatch],
  );

  const handleAddMultipleTags = useCallback(
    (
      tags: string[],
      addToStart = false,
      applyToSelectedAssets = false,
      applyToAssetsWithActiveFilters = false,
    ) => {
      dispatch(
        addMultipleTagsToAssetsWithDualSelection({
          tagNames: tags,
          addToStart,
          applyToSelectedAssets,
          applyToAssetsWithActiveFilters,
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
            selectedAssetsCount > 0 && hasActiveFilters
              ? `Add tags to selected assets or assets with active filters`
              : selectedAssetsCount > 0
                ? `Add tags to ${selectedAssetsCount} selected assets`
                : hasActiveFilters
                  ? `Add tags to ${assetsWithActiveFiltersCount} assets with active filters`
                  : 'Select assets or apply filters to add new tags'
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
          title={
            filterTagsDeleteState.state === 'all'
              ? 'Remove TO_DELETE state from selected tags'
              : filterTagsDeleteState.state === 'mixed'
                ? 'Mixed state - some tags marked for deletion'
                : 'Mark selected tags for deletion'
          }
        >
          {filterTagsDeleteState.state === 'all' ? (
            <DocumentPlusIcon className="w-4" />
          ) : filterTagsDeleteState.state === 'mixed' ? (
            <DocumentMixedIcon className="w-4" />
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
        onAddMultipleTags={handleAddMultipleTags}
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
