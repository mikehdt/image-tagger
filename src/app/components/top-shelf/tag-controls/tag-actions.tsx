import {
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentMinusIcon,
  DocumentPlusIcon,
  PencilIcon,
  SparklesIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { markFilterTagsToDelete } from '@/app/store/assets';
import { selectFilterTagsDeleteState } from '@/app/store/assets/selectors';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import { selectFilterTags, selectHasActiveFilters } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectTagSortDirection,
  selectTagSortType,
  setTagSortDirection,
  setTagSortType,
  TagSortDirection,
  TagSortType,
  toggleTagSortDirection,
} from '@/app/store/project';
import {
  addMultipleTagsToAssetsWithDualSelection,
  addTagToAssetsWithDualSelection,
  clearSelection,
  selectSelectedAssetsCount,
} from '@/app/store/selection';
import {
  selectAssetsWithActiveFiltersCount,
  selectSelectedAssetsData,
} from '@/app/store/selection/combinedSelectors';

import { Button } from '../../shared/button';
import { Dropdown, DropdownItem } from '../../shared/dropdown';
import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { AddTagsModal } from './add-tags-modal';
import { DocumentMixedIcon } from './document-mixed-icon';
import { EditTagsModal } from './edit-tags-modal';

/**
 * Get the appropriate sort direction label based on sort type
 */
const getTagSortDirectionLabel = (
  sortType: TagSortType,
  sortDirection: TagSortDirection,
): string => {
  const isAsc = sortDirection === TagSortDirection.ASC;

  switch (sortType) {
    case TagSortType.ALPHABETICAL:
      return isAsc ? 'A-Z' : 'Z-A';
    case TagSortType.FREQUENCY:
      return isAsc ? '0-9' : '9-0';
    case TagSortType.SORTABLE:
    default:
      return 'Saved';
  }
};

const TagActionsComponent = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTagsModalOpen, setIsAddTagsModalOpen] = useState(false);
  const [isAutoTaggerModalOpen, setIsAutoTaggerModalOpen] = useState(false);

  const dispatch = useAppDispatch();
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const selectedAssetsData = useAppSelector(selectSelectedAssetsData);
  const filterTags = useAppSelector(selectFilterTags);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const filterTagsDeleteState = useAppSelector(selectFilterTagsDeleteState);
  const assetsWithActiveFiltersCount = useAppSelector(
    selectAssetsWithActiveFiltersCount,
  );
  const hasReadyModel = useAppSelector(selectHasReadyModel);
  const isAutoTaggerInitialised = useAppSelector(selectIsInitialised);

  // Fetch auto-tagger models on mount to determine if any are ready
  useEffect(() => {
    if (!isAutoTaggerInitialised) {
      fetch('/api/auto-tagger/models')
        .then((res) => res.json())
        .then((data) => {
          dispatch(setModelsAndProviders(data));
        })
        .catch(console.error);
    }
  }, [isAutoTaggerInitialised, dispatch]);

  // Tag sort state
  const tagSortType = useAppSelector(selectTagSortType);
  const tagSortDirection = useAppSelector(selectTagSortDirection);

  // Prepare selected assets for auto-tagger (only need fileId and extension)
  const selectedAssetsForTagger = useMemo(
    () =>
      selectedAssetsData.map((asset) => ({
        fileId: asset.fileId,
        fileExtension: asset.fileExtension,
      })),
    [selectedAssetsData],
  );

  // Determine if Add Tags button should be enabled
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

  const openAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(true),
    [],
  );

  const handleOnCloseAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(false),
    [],
  );

  // Tag sort handlers
  const handleSortTypeChange = useCallback(
    (newSortType: TagSortType) => {
      dispatch(setTagSortType(newSortType));
      const defaultDirection =
        newSortType === TagSortType.FREQUENCY
          ? TagSortDirection.DESC
          : TagSortDirection.ASC;
      dispatch(setTagSortDirection(defaultDirection));
    },
    [dispatch],
  );

  const handleToggleSortDirection = useCallback(() => {
    dispatch(toggleTagSortDirection());
  }, [dispatch]);

  // Tag sort dropdown items
  const tagSortTypeItems: DropdownItem<TagSortType>[] = [
    {
      value: TagSortType.SORTABLE,
      label: 'Sort Order',
    },
    {
      value: TagSortType.ALPHABETICAL,
      label: 'Alphabetical',
    },
    {
      value: TagSortType.FREQUENCY,
      label: 'Frequency',
    },
  ];

  const showDirectionToggle = tagSortType !== TagSortType.SORTABLE;

  return (
    <>
      <ResponsiveToolbarGroup
        icon={<SwatchIcon className="w-4" />}
        title="Tags"
        position="center"
      >
        <Dropdown
          items={tagSortTypeItems}
          selectedValue={tagSortType}
          onChange={handleSortTypeChange}
        />

        {showDirectionToggle && (
          <Button
            type="button"
            onClick={handleToggleSortDirection}
            variant="ghost"
            size="medium"
            title={`Sort ${tagSortDirection === TagSortDirection.ASC ? 'ascending' : 'descending'}`}
          >
            {tagSortDirection === TagSortDirection.ASC ? (
              <ArrowUpIcon className="w-4" />
            ) : (
              <ArrowDownIcon className="w-4" />
            )}

            <span className="ml-1 max-xl:hidden">
              {getTagSortDirectionLabel(tagSortType, tagSortDirection)}
            </span>
          </Button>
        )}

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

        <Button
          type="button"
          variant="ghost"
          onClick={openAutoTaggerModal}
          disabled={!hasReadyModel || selectedAssetsCount === 0}
          title={
            !hasReadyModel
              ? 'Set up auto-tagger first (Project menu)'
              : selectedAssetsCount === 0
                ? 'Select assets to auto-tag'
                : `Auto-tag ${selectedAssetsCount} selected asset${selectedAssetsCount === 1 ? '' : 's'}`
          }
        >
          <SparklesIcon className="w-4" />
          <span className="ml-2 max-xl:hidden">Tag</span>
        </Button>
      </ResponsiveToolbarGroup>

      <AddTagsModal
        isOpen={isAddTagsModalOpen}
        onClose={handleOnCloseAddModal}
        onClearSelection={handleClearSelection}
        onAddTag={handleAddTag}
        onAddMultipleTags={handleAddMultipleTags}
      />

      <EditTagsModal
        isOpen={isEditModalOpen}
        onClose={handleOnCloseEditModal}
        filterTags={filterTags}
      />

      <AutoTaggerModal
        isOpen={isAutoTaggerModalOpen}
        onClose={handleOnCloseAutoTaggerModal}
        selectedAssets={selectedAssetsForTagger}
      />
    </>
  );
};

export const TagActions = memo(TagActionsComponent);
