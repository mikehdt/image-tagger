/**
 * TaggingManager v2
 *
 * Phase 1: Connects Redux data to TagList
 * - Fetches tag data for an asset
 * - Handles add tag action
 * - No DnD, no editing, no sorting
 */
import { useCallback } from 'react';

import {
  addTag,
  selectAssetTagCounts,
  selectOrderedTagsWithStatus,
} from '@/app/store/assets';
import { selectFilterTagsSet } from '@/app/store/filters';
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

  // Transform to the shape TagList expects
  const tags = orderedTagsWithStatus.map((tag: { name: string; status: number }) => ({
    name: tag.name,
    state: tag.status,
    count: tagCounts[tag.name] || 0,
    isHighlighted: filterTagsSet.has(tag.name),
  }));

  // Handle adding a new tag
  const handleAddTag = useCallback(
    (tagName: string) => {
      dispatch(addTag({ assetId, tagName }));
    },
    [dispatch, assetId],
  );

  track('TaggingManager', 'render-end');

  return <TagList tags={tags} onAddTag={handleAddTag} />;
};
