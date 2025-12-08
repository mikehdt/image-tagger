/**
 * TaggingManager v2
 *
 * Phase 2: Connects Redux data to TagList with interactivity
 * - Fetches tag data for an asset
 * - Handles add, toggle (filter), and delete actions
 * - No DnD, no editing, no sorting
 */
import { useCallback, useMemo } from 'react';

import {
  addTag,
  deleteTag,
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
    <TagList
      tags={tags}
      onAddTag={handleAddTag}
      onToggleTag={handleToggleTag}
      onDeleteTag={handleDeleteTag}
    />
  );
};
