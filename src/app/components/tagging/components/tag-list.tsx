import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { SyntheticEvent, useCallback } from 'react';

import { Button } from '../../shared/button';
import { useToast } from '../../shared/toast';
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
    handleAddMultipleTags,
    tagProps,
  } = useTaggingContext();

  const { showToast } = useToast();

  const handleCopyTags = useCallback(async () => {
    const tagsText = tagList.join(', ');

    try {
      await navigator.clipboard.writeText(tagsText);
      showToast('Tags copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Failed to copy tags');
    }
  }, [tagList, showToast]);

  return (
    <div className={`flex h-full w-full`}>
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
                isHighlighted={props.isHighlighted}
                isBeingEdited={props.isBeingEdited}
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
            onMultipleTagsSubmit={handleAddMultipleTags}
          />
        </div>
      </div>

      {tagList.length > 0 && (
        <div className="self-end">
          <Button
            onClick={handleCopyTags}
            variant="ghost"
            size="smallSquare"
            title="Copy tags as comma-separated list"
          >
            <ClipboardDocumentIcon className="w-4 text-slate-400" />
          </Button>
        </div>
      )}
    </div>
  );
};
