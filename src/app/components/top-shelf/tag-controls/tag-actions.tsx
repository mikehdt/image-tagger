import {
  ArrowDownIcon,
  ArrowUpIcon,
  BarsArrowUpIcon,
  DocumentDuplicateIcon,
  DocumentMinusIcon,
  DocumentPlusIcon,
  EllipsisVerticalIcon,
  NoSymbolIcon,
  PencilIcon,
  SparklesIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { gatherTags, markFilterTagsToDelete } from '@/app/store/assets';
import { selectFilterTagsDeleteState } from '@/app/store/assets/selectors';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import {
  clearFilters,
  selectFilterTags,
  selectHasActiveFilters,
} from '@/app/store/filters';
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
  selectDeleteToggleAffectedCount,
  selectEffectiveScopeAssetIds,
  selectSelectedAssetsData,
} from '@/app/store/selection/combinedSelectors';

import { Button } from '../../shared/button';
import { Dropdown, DropdownItem } from '../../shared/dropdown';
import { MenuButton, MenuItem } from '../../shared/menu-button';
import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';
import { AddTagsModal } from './add-tags-modal';
import { CopyTagsModal } from './copy-tags-modal';
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
  const [isCopyTagsModalOpen, setIsCopyTagsModalOpen] = useState(false);
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
  const effectiveScopeAssetIds = useAppSelector(selectEffectiveScopeAssetIds);
  const deleteToggleAffectedCount = useAppSelector(
    selectDeleteToggleAffectedCount,
  );

  // Tag sort state
  const tagSortType = useAppSelector(selectTagSortType);
  const tagSortDirection = useAppSelector(selectTagSortDirection);

  // Auto-tagger state
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

  // Prepare selected assets for auto-tagger (only need fileId and extension)
  const selectedAssetsForTagger = useMemo(
    () =>
      selectedAssetsData.map((asset) => ({
        fileId: asset.fileId,
        fileExtension: asset.fileExtension,
      })),
    [selectedAssetsData],
  );

  const openAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(true),
    [],
  );

  const handleOnCloseAutoTaggerModal = useCallback(
    () => setIsAutoTaggerModalOpen(false),
    [],
  );

  // Determine if Add Tags button should be enabled
  const canAddTags = selectedAssetsCount > 0 || hasActiveFilters;

  const handleMarkFilterTagsToDelete = useCallback(
    (tags: string[], assetIds: string[]) =>
      dispatch(markFilterTagsToDelete({ tags, assetIds })),
    [dispatch],
  );

  const openAddModel = useCallback(() => setIsAddTagsModalOpen(true), []);

  const openEditModal = useCallback(() => {
    if (filterTags.length > 0) {
      setIsEditModalOpen(true);
    }
  }, [filterTags.length]);

  const toggleFilterTagsDelete = useCallback(() => {
    handleMarkFilterTagsToDelete(filterTags, effectiveScopeAssetIds);
  }, [filterTags, effectiveScopeAssetIds, handleMarkFilterTagsToDelete]);

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

  const handleClearFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
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

  const handleGatherTags = useCallback(() => {
    if (filterTags.length >= 2) {
      dispatch(
        gatherTags({ tags: filterTags, assetIds: effectiveScopeAssetIds }),
      );
    }
  }, [dispatch, filterTags, effectiveScopeAssetIds]);

  const openCopyTagsModal = useCallback(() => setIsCopyTagsModalOpen(true), []);
  const closeCopyTagsModal = useCallback(
    () => setIsCopyTagsModalOpen(false),
    [],
  );

  // Overflow menu items for less-used actions
  const overflowMenuItems: MenuItem[] = [
    {
      label: 'Copy Tags',
      icon: <DocumentDuplicateIcon className="w-4" />,
      onClick: openCopyTagsModal,
      disabled: selectedAssetsCount < 2,
    },
    {
      label: 'Gather Tags',
      icon: <BarsArrowUpIcon className="w-4" />,
      onClick: handleGatherTags,
      disabled: filterTags.length < 2,
    },
  ];

  // Tag sort dropdown items
  const tagSortTypeItems: DropdownItem<TagSortType>[] = [
    {
      value: TagSortType.SORTABLE,
      label: 'Tag Order',
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
        position="right"
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

            <span className="ml-1 max-2xl:hidden">
              {getTagSortDirectionLabel(tagSortType, tagSortDirection)}
            </span>
          </Button>
        )}

        <ToolbarDivider />

        <Button
          type="button"
          onClick={openAutoTaggerModal}
          disabled={!hasReadyModel || selectedAssetsCount === 0}
          variant="ghost"
          color="slate"
          size="medium"
          title={
            !hasReadyModel
              ? 'Set up auto-tagger first (Project menu)'
              : selectedAssetsCount === 0
                ? 'Select assets to auto-tag'
                : `Auto-tag ${selectedAssetsCount} selected asset${selectedAssetsCount === 1 ? '' : 's'}`
          }
        >
          <SparklesIcon className="w-4" />
          <span className="ml-2 max-2xl:hidden">Auto</span>
        </Button>

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

        <ToolbarDivider />

        <Button
          type="button"
          variant="ghost"
          onClick={toggleFilterTagsDelete}
          disabled={!filterTags.length || deleteToggleAffectedCount === 0}
          title={
            filterTagsDeleteState.state === 'all'
              ? `Remove TO_DELETE state from selected tags on ${deleteToggleAffectedCount} assets`
              : filterTagsDeleteState.state === 'mixed'
                ? `Mixed state - toggle deletion on ${deleteToggleAffectedCount} assets`
                : `Mark selected tags for deletion on ${deleteToggleAffectedCount} assets`
          }
        >
          {filterTagsDeleteState.state === 'all' ? (
            <DocumentPlusIcon className="w-4" />
          ) : filterTagsDeleteState.state === 'mixed' ? (
            <DocumentMixedIcon className="w-4" />
          ) : (
            <DocumentMinusIcon className="w-4" />
          )}
          {filterTags.length > 0 && deleteToggleAffectedCount > 0 && (
            <span className="ml-1 text-xs text-slate-500">
              {deleteToggleAffectedCount}
            </span>
          )}
        </Button>

        <MenuButton
          icon={<EllipsisVerticalIcon className="w-4" />}
          items={overflowMenuItems}
          position="bottom-right"
          title="More tag actions"
        />

        <ToolbarDivider />

        <Button
          variant="ghost"
          type="button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          ghostDisabled={!hasActiveFilters}
          size="medium"
          title="Clear all filters"
        >
          <NoSymbolIcon className="w-4" />
        </Button>
      </ResponsiveToolbarGroup>

      <AutoTaggerModal
        isOpen={isAutoTaggerModalOpen}
        onClose={handleOnCloseAutoTaggerModal}
        selectedAssets={selectedAssetsForTagger}
      />

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

      <CopyTagsModal
        isOpen={isCopyTagsModalOpen}
        onClose={closeCopyTagsModal}
      />
    </>
  );
};

export const TagActions = memo(TagActionsComponent);
