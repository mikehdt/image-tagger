import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { SyntheticEvent } from 'react';

import { useOptimizedTaggingContext } from '../optimized-tagging-context';
import { InputTag } from './input-tag';
import { OptimizedSortableTag } from './optimized-sortable-tag';

/**
 * Optimized TagList Component Properties
 */
type OptimizedTagListProps = {
  /** Optional CSS class name to apply to the container */
  className?: string;
};

/**
 * Optimized tag list component that uses pre-calculated props to avoid function calls in render loop
 */
export const OptimizedTagList = ({ className = '' }: OptimizedTagListProps) => {
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
  } = useOptimizedTaggingContext();

  return (
    <div className={className}>
      <div className="relative flex flex-wrap">
        <SortableContext
          items={tagList}
          strategy={rectSortingStrategy}
          id="taglist-content"
        >
          {tagList.map((tagName: string) => {
            const props = tagProps[tagName];
            return (
              <OptimizedSortableTag
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
