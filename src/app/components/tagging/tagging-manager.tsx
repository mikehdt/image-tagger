import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';

import { TagList } from './components';
import { useAssetTags, useSortable, useTagSorting } from './hooks';
import { TaggingProvider } from './tagging-context';

/**
 * TaggingManager - A comprehensive component that connects asset data with tagging functionality
 *
 * This component:
 * 1. Fetches tag data for a specific asset using useAssetTags
 * 2. Provides drag & drop functionality for tags through useSortable
 * 3. Handles tag sorting for display while preserving the original order for drag/drop operations
 * 4. Renders the tag list with proper context providers
 *
 * It serves as the main entry point for the tagging functionality in the application
 */
interface TaggingManagerProps {
  assetId: string;
  onTagEditingChange?: (isEditing: boolean) => void;
}

/**
 * TaggingManager connects asset data with tagging functionality
 * It serves as a bridge between asset state and tag components
 */
export const TaggingManager = ({
  assetId,
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

  // Get sorting information for tags
  const { sortedTagList, originalTagList, isDragDropDisabled } =
    useTagSorting(tagList);

  // Set up sortable functionality for the tags using the original order
  const { sensors, handleDragEnd } = useSortable(
    originalTagList,
    reorderAssetTags,
  );

  // Handle the drag end event for tag reordering
  const onDragEnd = (event: DragEndEvent) => {
    // Only allow drag/drop when not using visual sorting
    if (!isDragDropDisabled) {
      handleDragEnd(event);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={originalTagList} // Use original order for drag/drop context
        strategy={rectSortingStrategy}
        id={`taglist-${assetId}`}
      >
        <TaggingProvider
          assetId={assetId}
          tagList={sortedTagList} // Use sorted order for display
          tagsByStatus={tagsByStatus}
          globalTagList={globalTagList}
          filterTagsSet={filterTagsSet}
          toggleTag={toggleTag}
          onTagEditingChange={onTagEditingChange}
          isDragDropDisabled={isDragDropDisabled} // Pass down the drag/drop state
        >
          <TagList />
        </TaggingProvider>
      </SortableContext>
    </DndContext>
  );
};
