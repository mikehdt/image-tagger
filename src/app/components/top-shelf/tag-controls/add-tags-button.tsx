import { TagIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';

import { Button } from '@/app/components/shared/button';
import { selectHasActiveFilters } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addMultipleTagsToAssetsWithDualSelection,
  addTagToAssetsWithDualSelection,
  clearSelection,
  selectSelectedAssetsCount,
} from '@/app/store/selection';
import { selectAssetsWithActiveFiltersCount } from '@/app/store/selection/combinedSelectors';

import { AddTagsModal } from './add-tags-modal';

export const AddTagsButton = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const assetsWithActiveFiltersCount = useAppSelector(
    selectAssetsWithActiveFiltersCount,
  );

  const canAddTags = selectedAssetsCount > 0 || hasActiveFilters;

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleClearSelection = useCallback(
    () => dispatch(clearSelection()),
    [dispatch],
  );

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
      setIsModalOpen(false);
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
      setIsModalOpen(false);
    },
    [dispatch],
  );

  return (
    <>
      <Button
        type="button"
        onClick={openModal}
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

      <AddTagsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onClearSelection={handleClearSelection}
        onAddTag={handleAddTag}
        onAddMultipleTags={handleAddMultipleTags}
      />
    </>
  );
};
