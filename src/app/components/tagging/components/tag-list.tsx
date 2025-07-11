import { memo, SyntheticEvent } from 'react';

import { useTaggingContext } from '../tagging-context';
import { InputTag } from './input-tag';
import { SortableTag } from './sortable-tag';

/**
 *  TagList Component Properties
 */
type TagListProps = {
  /** Optional CSS class name to apply to the container */
  className?: string;
};

/**
 * Tag list component that uses pre-calculated props to avoid function calls in render loop
 */
export const TagList = ({ className = '' }: TagListProps) => {
  const {
    tagList,
    newTagInput,
    isEditing,
    editingTagName,
    isDuplicate,
    handleInputChange,
    handleCancelAdd,
    handleAddTag,
    tagProps,
  } = useTaggingContext();

  return (
    <div className={className}>
      <div className="relative flex flex-wrap">
        {tagList.map((tagName: string) => {
          const props = tagProps[tagName];
          return (
            <SortableTag
              key={`tag-${tagName}`}
              id={tagName}
              tagName={tagName}
              fade={props.fade}
              nonInteractive={props.nonInteractive}
              tagState={props.tagState}
              count={props.count}
            />
          );
        })}
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
