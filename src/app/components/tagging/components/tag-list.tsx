import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { memo, SyntheticEvent, useCallback, useMemo } from 'react';

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

type TagsRendererProps = {
  tagList: string[];
  tagProps: Record<
    string,
    {
      fade: boolean;
      nonInteractive: boolean;
      tagState: number;
      count: number;
      isHighlighted: boolean;
      isBeingEdited: boolean;
      editTagValue: string;
      isDuplicate: (value: string) => boolean;
      onEditValueChange: (value: string) => void;
      onStartEdit: (tagName: string) => void;
      onSaveEdit: (e?: SyntheticEvent) => void;
      onCancelEdit: (e?: SyntheticEvent) => void;
      onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
      onToggleTag: (e: SyntheticEvent, tagName: string) => void;
    }
  >;
  isDragDropDisabled: boolean;
};

/**
 * Memoized component that renders the tags themselves
 * Uses custom comparison to check if individual tag props actually changed
 * rather than just checking parent object reference
 */
const TagsRenderer = memo(
  ({ tagList, tagProps, isDragDropDisabled }: TagsRendererProps) => {
    return (
      <>
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
              isDragDropDisabled={isDragDropDisabled}
              editTagValue={props.editTagValue}
              isDuplicate={props.isDuplicate}
              onEditValueChange={props.onEditValueChange}
              onStartEdit={props.onStartEdit}
              onSaveEdit={props.onSaveEdit}
              onCancelEdit={props.onCancelEdit}
              onDeleteTag={props.onDeleteTag}
              onToggleTag={props.onToggleTag}
            />
          );
        })}
      </>
    );
  },
  (prevProps, nextProps) => {
    // If tagList changed (length or order), must re-render
    if (
      prevProps.tagList.length !== nextProps.tagList.length ||
      prevProps.tagList.some((tag, i) => tag !== nextProps.tagList[i])
    ) {
      return false;
    }

    // Check if drag/drop state changed
    if (prevProps.isDragDropDisabled !== nextProps.isDragDropDisabled) {
      return false;
    }

    // Check if any individual tag's props object changed reference
    // (our caching ensures unchanged tags keep same object reference)
    return prevProps.tagList.every(
      (tagName) => prevProps.tagProps[tagName] === nextProps.tagProps[tagName],
    );
  },
);

TagsRenderer.displayName = 'TagsRenderer';

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
    filterTagsSet,
    isDragDropDisabled,
  } = useTaggingContext();

  const { showToast } = useToast();

  // Determine which tags to copy and whether it's a partial copy
  const copyInfo = useMemo(() => {
    // Get selected tags that are actually in this asset
    const selectedTagsInAsset = tagList.filter((tag) => filterTagsSet.has(tag));

    // If we have selected tags in this asset, copy only those
    // Otherwise, copy all tags
    const shouldCopySelection = selectedTagsInAsset.length > 0;
    const tagsToCopy = shouldCopySelection ? selectedTagsInAsset : tagList;

    return {
      tagsToCopy,
      isPartialCopy: shouldCopySelection,
      selectedCount: selectedTagsInAsset.length,
    };
  }, [tagList, filterTagsSet]);

  const handleCopyTags = useCallback(async () => {
    const tagsText = copyInfo.tagsToCopy.join(', ');

    try {
      await navigator.clipboard.writeText(tagsText);

      if (copyInfo.isPartialCopy) {
        showToast(
          `Copied ${copyInfo.selectedCount} selected ${copyInfo.selectedCount === 1 ? 'tag' : 'tags'} `,
        );
      } else {
        showToast('Tags copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Failed to copy tags');
    }
  }, [copyInfo, showToast]);

  return (
    <div className={`flex h-full w-full`}>
      <div className={`flex-1 ${className}`}>
        <div className="relative flex flex-wrap">
          <TagsRenderer
            tagList={tagList}
            tagProps={tagProps}
            isDragDropDisabled={isDragDropDisabled}
          />
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
            color={copyInfo.isPartialCopy ? 'emerald' : 'slate'}
            title={
              copyInfo.isPartialCopy
                ? `Copy ${copyInfo.selectedCount} selected ${copyInfo.selectedCount === 1 ? 'tag' : 'tags'} as comma-separated list`
                : 'Copy all tags as comma-separated list'
            }
          >
            <ClipboardDocumentIcon className="w-4 opacity-50" />
          </Button>
        </div>
      )}
    </div>
  );
};
