/**
 * TaggingManager v2
 *
 * Phase 5: DndContext moved inside TagList memo boundary
 * - DndContext is now inside TagsDisplay (after memo check)
 * - Memo blocks re-renders of entire DnD subtree when tags unchanged
 * - Supports add, toggle, edit, delete, and reorder
 */
import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { memo, useCallback, useMemo } from 'react';

import {
  addTag,
  deleteTag,
  editTag,
  reorderTags,
  selectAssetHighlightedTags,
  selectAssetTagCounts,
  selectOrderedTagsWithStatus,
} from '@/app/store/assets';
import { toggleTagFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { track } from '@/app/utils/render-tracker';

import { TagList } from './components';

type TaggingManagerProps = {
  assetId: string;
  onTagEditingChange?: (isEditing: boolean) => void; // Placeholder for future use
};

const TaggingManagerComponent = ({
  assetId,
  onTagEditingChange: _onTagEditingChange, // Unused for now
}: TaggingManagerProps) => {
  track('TaggingManager', 'render');

  const dispatch = useAppDispatch();

  // Get tag data from Redux
  const orderedTagsWithStatus = useAppSelector((state) =>
    selectOrderedTagsWithStatus(state, assetId),
  );
  const tagCounts = useAppSelector((state) =>
    selectAssetTagCounts(state, assetId),
  );
  // Use asset-specific highlighted tags selector - only re-renders when THIS asset's
  // highlighted tags change, not when unrelated filter tags change
  const highlightedTags = useAppSelector((state) =>
    selectAssetHighlightedTags(state, assetId),
  );

  // Transform to the shape TagList expects - memoized to maintain reference stability
  const tags = useMemo(
    () =>
      orderedTagsWithStatus.map((tag: { name: string; status: number }) => ({
        name: tag.name,
        state: tag.status,
        count: tagCounts[tag.name] || 0,
        isHighlighted: highlightedTags.has(tag.name),
      })),
    [orderedTagsWithStatus, tagCounts, highlightedTags],
  );

  // Tag names for SortableContext items
  const tagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  // DnD sensors - stable across renders
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end - reorder tags
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = tagNames.indexOf(active.id as string);
        const newIndex = tagNames.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          dispatch(reorderTags({ assetId, oldIndex, newIndex }));
        }
      }
    },
    [dispatch, assetId, tagNames],
  );

  // Handle adding a new tag
  const handleAddTag = useCallback(
    (tagName: string) => {
      dispatch(addTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  // Handle toggling a tag (adds/removes from filter)
  const handleToggleTag = useCallback(
    (tagName: string) => {
      dispatch(toggleTagFilter(tagName));
    },
    [dispatch],
  );

  // Handle editing a tag (rename)
  const handleEditTag = useCallback(
    (oldTagName: string, newTagName: string) => {
      dispatch(editTag({ assetId, oldTagName, newTagName }));
    },
    [dispatch, assetId],
  );

  // Handle deleting a tag (marks for deletion)
  const handleDeleteTag = useCallback(
    (tagName: string) => {
      dispatch(deleteTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  track('TaggingManager', 'render-end');

  return (
    <TagList
      tags={tags}
      sortable={true}
      assetId={assetId}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onAddTag={handleAddTag}
      onToggleTag={handleToggleTag}
      onEditTag={handleEditTag}
      onDeleteTag={handleDeleteTag}
    />
  );
};

export const TaggingManager = memo(TaggingManagerComponent);
