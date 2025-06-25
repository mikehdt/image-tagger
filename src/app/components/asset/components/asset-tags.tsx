import { closestCenter, DndContext } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { SyntheticEvent } from 'react';

import { SortableTag } from '../../tag/sortable-tag';
import { TagInput } from '../../tag/tag-input';
import { useAssetTags, useDragDrop, useTagEditing } from '../hooks';

type AssetTagsProps = {
  assetId: string;
};

export const AssetTags = ({ assetId }: AssetTagsProps) => {
  const {
    tagList,
    tagsByStatus,
    globalTagList,
    filterTagsSet,
    addNewTag,
    toggleTag,
    toggleDeleteTag,
  } = useAssetTags(assetId);

  const {
    newTagInput,
    setNewTagInput,
    editingTagName,
    isEditing,
    handleEditTag,
    handleInputChange,
    handleCancelAdd,
    handleEditStateChange,
    handleEditValueChange,
    isEditingDuplicate,
  } = useTagEditing(assetId, tagList);

  const { localTagList, sensors, handleDragEnd } = useDragDrop(
    assetId,
    tagList,
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="relative flex flex-wrap">
          <SortableContext
            items={localTagList}
            strategy={rectSortingStrategy}
            id={`taglist-${assetId}`}
          >
            {localTagList.map((tagName: string, index: number) => (
              <SortableTag
                key={`${assetId}-${tagName}-${index}`}
                id={tagName}
                fade={
                  // For add mode: fade tags except one matching current input
                  (newTagInput !== '' && newTagInput !== tagName) ||
                  // For edit mode: fade tags except the one being edited or one that matches current edit value
                  (isEditing && tagName !== editingTagName)
                }
                nonInteractive={
                  // Always make tags non-interactive when in edit mode, except for the tag being edited
                  (isEditing && tagName !== editingTagName) ||
                  // Always make tags non-interactive in add mode
                  newTagInput !== ''
                }
                tagName={tagName}
                tagState={tagsByStatus[tagName]}
                count={globalTagList[tagName] || 0}
                onToggleTag={toggleTag}
                onDeleteTag={toggleDeleteTag}
                onEditTag={handleEditTag}
                highlight={filterTagsSet.has(tagName)}
                onEditValueChange={handleEditValueChange}
                onEditStateChange={handleEditStateChange}
                isDuplicate={editingTagName === tagName && isEditingDuplicate}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      <div
        className={`transition-all ${isEditing || editingTagName !== '' ? 'pointer-events-none opacity-25' : ''}`}
      >
        <TagInput
          inputValue={newTagInput}
          onInputChange={handleInputChange}
          onSubmit={(e: SyntheticEvent) => {
            if (addNewTag(e, newTagInput)) {
              setNewTagInput('');
            }
          }}
          onCancel={handleCancelAdd}
          mode="add"
          placeholder="Add tag..."
          nonInteractive={isEditing}
        />
      </div>
    </>
  );
};
