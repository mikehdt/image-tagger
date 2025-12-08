/**
 * TaggingManager v2
 *
 * Phase 3: Drag-and-drop support via dnd-kit
 * - DndContext and SortableContext wrap TagList
 * - Each asset has isolated DnD context (no cross-asset interference)
 * - Reorder dispatches to Redux
 */
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useMemo } from 'react';

import {
  addTag,
  deleteTag,
  reorderTags,
  selectAssetTagCounts,
  selectOrderedTagsWithStatus,
} from '@/app/store/assets';
import { selectFilterTagsSet, toggleTagFilter } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { track } from '@/app/utils/render-tracker';

import { TagList } from './components';

type TaggingManagerProps = {
  assetId: string;
  onTagEditingChange?: (isEditing: boolean) => void; // Placeholder for future edit mode
};

export const TaggingManager = ({
  assetId,
  onTagEditingChange: _onTagEditingChange, // Unused until we add edit mode
}: TaggingManagerProps) => {
  track('TaggingManager', 'render');

  const dispatch = useAppDispatch();

  // Get tag data from Redux
  const orderedTagsWithStatus = useAppSelector((state) =>
    selectOrderedTagsWithStatus(state, assetId),
  );
  const tagCounts = useAppSelector((state) => selectAssetTagCounts(state, assetId));
  const filterTagsSet = useAppSelector(selectFilterTagsSet);

  // Transform to the shape TagList expects - memoized to maintain reference stability
  const tags = useMemo(
    () =>
      orderedTagsWithStatus.map((tag: { name: string; status: number }) => ({
        name: tag.name,
        state: tag.status,
        count: tagCounts[tag.name] || 0,
        isHighlighted: filterTagsSet.has(tag.name),
      })),
    [orderedTagsWithStatus, tagCounts, filterTagsSet],
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

  // Handle deleting a tag (marks for deletion)
  const handleDeleteTag = useCallback(
    (tagName: string) => {
      dispatch(deleteTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  track('TaggingManager', 'render-end');

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tagNames} strategy={rectSortingStrategy} id={`taglist-${assetId}`}>
        <TagList
          tags={tags}
          sortable={true}
          onAddTag={handleAddTag}
          onToggleTag={handleToggleTag}
          onDeleteTag={handleDeleteTag}
        />
      </SortableContext>
    </DndContext>
  );
};
