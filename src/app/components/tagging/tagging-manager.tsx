import { DragEndEvent } from '@dnd-kit/core';

import { SortableProvider, useOptimizedSortable } from '../shared/dnd';
import { OptimizedTagList } from './components/optimized-tag-list';
import { useAssetTags } from './hooks';
import { OptimizedTaggingProvider } from './optimized-tagging-context';

/**
 * TaggingManager - A comprehensive component that connects asset data with tagging functionality
 *
 * This component:
 * 1. Fetches tag data for a specific asset using useAssetTags
 * 2. Provides drag & drop functionality for tags through useSortable
 * 3. Renders the tag list with proper context providers
 *
 * It serves as the main entry point for the tagging functionality in the application
 */
interface TaggingManagerProps {
  assetId: string;
  className?: string;
  onTagEditingChange?: (isEditing: boolean) => void;
}

/**
 * TaggingManager connects asset data with tagging functionality
 * It serves as a bridge between asset state and tag components
 */
export const TaggingManager = ({
  assetId,
  className = '',
  onTagEditingChange,
}: TaggingManagerProps) => {
  // Get tag data for this specific asset
  const {
    tagList,
    tagsByStatus,
    globalTagList,
    filterTagsSet,
    toggleTag,
    reorderAssetTags,
  } = useAssetTags(assetId);

  // Set up sortable functionality for the tags
  const { sensors, handleDragEnd } = useOptimizedSortable(
    tagList,
    reorderAssetTags,
  );

  // Handle the drag end event for tag reordering
  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event);
  };

  return (
    <div className={className}>
      <OptimizedTaggingProvider
        assetId={assetId}
        tagList={tagList}
        tagsByStatus={tagsByStatus}
        globalTagList={globalTagList}
        filterTagsSet={filterTagsSet}
        toggleTag={toggleTag}
        onTagEditingChange={onTagEditingChange}
      >
        <SortableProvider
          items={tagList}
          sensors={sensors}
          onDragEnd={onDragEnd}
          strategy="rect"
          id={`taglist-${assetId}`}
        >
          <OptimizedTagList />
        </SortableProvider>
      </OptimizedTaggingProvider>
    </div>
  );
};
