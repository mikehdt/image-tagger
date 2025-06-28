import { DragEndEvent } from '@dnd-kit/core';

import { SortableProvider, useSortable } from '../shared/dnd';
import { TagList } from './components';
import { useAssetTags } from './hooks';
import { TaggingProvider } from './tagging-context';

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
  const { sensors, handleDragEnd } = useSortable(tagList, reorderAssetTags);

  // Handle the drag end event for tag reordering
  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event);
  };

  return (
    <div className={className}>
      <SortableProvider
        items={tagList}
        sensors={sensors}
        onDragEnd={onDragEnd}
        strategy="rect"
        id={`taglist-${assetId}`}
      >
        <TaggingProvider
          assetId={assetId}
          tagList={tagList}
          tagsByStatus={tagsByStatus}
          globalTagList={globalTagList}
          filterTagsSet={filterTagsSet}
          toggleTag={toggleTag}
          onTagEditingChange={onTagEditingChange}
        >
          <TagList />
        </TaggingProvider>
      </SortableProvider>
    </div>
  );
};
