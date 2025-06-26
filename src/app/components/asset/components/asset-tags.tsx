import { closestCenter, DndContext } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { SyntheticEvent } from 'react';

import { TagInput } from '../../tag/components';
import { SortableTag } from '../../tag/sortable-tag';
import { TagProvider, useTagContext } from '../../tag/tag-context';
import { useAssetTags, useDragDrop } from '../hooks';

type AssetTagsProps = {
  assetId: string;
};

// Inner component that uses the tag context
const AssetTagsContent = () => {
  const {
    tagList,
    newTagInput,
    isEditing,
    editingTagName,
    isDuplicate,
    shouldFade,
    isTagInteractive,
    handleInputChange,
    handleCancelAdd,
    handleAddTag,
    tagsByStatus,
    globalTagList,
  } = useTagContext();

  return (
    <>
      <div className="relative flex flex-wrap">
        <SortableContext
          items={tagList}
          strategy={rectSortingStrategy}
          id={`taglist-content`}
        >
          {tagList.map((tagName: string, index: number) => (
            <SortableTag
              key={`tag-${tagName}-${index}`}
              id={tagName}
              tagName={tagName}
              fade={shouldFade(tagName)}
              nonInteractive={!isTagInteractive(tagName)}
              tagState={tagsByStatus[tagName] || 0}
              count={globalTagList[tagName] || 0}
            />
          ))}
        </SortableContext>
      </div>

      <div
        className={`transition-all ${isEditing || editingTagName !== '' ? 'pointer-events-none opacity-25' : ''}`}
      >
        <TagInput
          inputValue={newTagInput}
          onInputChange={handleInputChange}
          onSubmit={(e: SyntheticEvent) => {
            if (handleAddTag(e, newTagInput)) {
              // The context will handle clearing the input on success
            }
          }}
          onCancel={handleCancelAdd}
          mode="add"
          placeholder="Add tag..."
          nonInteractive={isEditing}
          isDuplicate={isDuplicate(newTagInput)}
        />
      </div>
    </>
  );
};

// Main component that provides the context
export const AssetTags = ({ assetId }: AssetTagsProps) => {
  // Extract what we need from useAssetTags, including filter info
  const { tagList, tagsByStatus, globalTagList, filterTagsSet, toggleTag } =
    useAssetTags(assetId);

  const { sensors, handleDragEnd } = useDragDrop(assetId, tagList);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <TagProvider
        assetId={assetId}
        tagList={tagList}
        tagsByStatus={tagsByStatus}
        globalTagList={globalTagList}
        filterTagsSet={filterTagsSet}
        toggleTag={toggleTag}
      >
        <AssetTagsContent />
      </TagProvider>
    </DndContext>
  );
};
