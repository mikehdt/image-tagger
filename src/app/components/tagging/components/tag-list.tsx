import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { SyntheticEvent } from 'react';

import { useTaggingContext } from '../tagging-context';
import { InputTag } from './input-tag';
import { SortableTag } from './sortable-tag';

/**
 * TagList Component Properties
 */
type TagListProps = {
  /** Optional CSS class name to apply to the container */
  className?: string;
};

/**
 * Tag list component that renders all tags with proper sorting functionality
 *
 * This component:
 * 1. Consumes data from the TaggingContext
 * 2. Renders a list of SortableTag components within a SortableContext
 * 3. Provides an InputTag component for adding new tags
 * 4. Handles tag interactions including adding, editing and filtering
 *
 * It relies on being wrapped in both a TaggingProvider and a SortableProvider
 */
export const TagList = ({ className = '' }: TagListProps) => {
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
  } = useTaggingContext();

  return (
    <div className={className}>
      <div className="relative flex flex-wrap">
        <SortableContext
          items={tagList}
          strategy={rectSortingStrategy}
          id="taglist-content"
        >
          {tagList.map((tagName: string) => (
            <SortableTag
              key={`tag-${tagName}`}
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
        <InputTag
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
    </div>
  );
};
