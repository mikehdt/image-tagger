/**
 * TagList Component v2
 *
 * Phase 3: Supports drag-and-drop via dnd-kit
 * - TagsDisplay memoized at the group level
 * - When sortable=true, uses SortableTag wrapper
 * - DndContext/SortableContext provided by parent (TaggingManager)
 */
import { memo, useCallback, useState } from 'react';

import { track } from '@/app/utils/render-tracker';

import { InputTag } from './input-tag';
import { SortableTag } from './sortable-tag';
import { Tag } from './tag';

type TagData = {
  name: string;
  state: number;
  count: number;
  isHighlighted: boolean;
};

type TagListProps = {
  tags: TagData[];
  sortable?: boolean;
  onAddTag: (tagName: string) => void;
  onToggleTag: (tagName: string) => void;
  onDeleteTag: (tagName: string) => void;
};

/**
 * Inner component that renders just the tags
 * Memoized to prevent re-renders when only input state changes
 */
type TagsDisplayProps = {
  tags: TagData[];
  sortable: boolean;
  onToggleTag: (tagName: string) => void;
  onDeleteTag: (tagName: string) => void;
};

const TagsDisplayComponent = ({ tags, sortable, onToggleTag, onDeleteTag }: TagsDisplayProps) => {
  track('TagsDisplay', 'render');

  const result = (
    <div className="flex flex-wrap">
      {tags.map((tag) =>
        sortable ? (
          <SortableTag
            key={tag.name}
            id={tag.name}
            tagName={tag.name}
            tagState={tag.state}
            count={tag.count}
            isHighlighted={tag.isHighlighted}
            fade={false}
            onToggle={onToggleTag}
            onDelete={onDeleteTag}
          />
        ) : (
          <div key={tag.name} className="mr-2 mb-2">
            <Tag
              tagName={tag.name}
              tagState={tag.state}
              count={tag.count}
              isHighlighted={tag.isHighlighted}
              fade={false}
              onToggle={onToggleTag}
              onDelete={onDeleteTag}
            />
          </div>
        ),
      )}
    </div>
  );

  track('TagsDisplay', 'render-end');
  return result;
};

const tagsDisplayPropsAreEqual = (
  prevProps: TagsDisplayProps,
  nextProps: TagsDisplayProps,
): boolean => {
  track('TagsDisplay', 'memo-check');

  // Check sortable mode
  if (prevProps.sortable !== nextProps.sortable) {
    return false;
  }

  // Handler references should be stable from useCallback in TaggingManager
  if (
    prevProps.onToggleTag !== nextProps.onToggleTag ||
    prevProps.onDeleteTag !== nextProps.onDeleteTag
  ) {
    return false;
  }

  // Quick length check
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  // Deep comparison of tag data only
  const isEqual = prevProps.tags.every((prevTag, i) => {
    const nextTag = nextProps.tags[i];
    return (
      prevTag.name === nextTag.name &&
      prevTag.state === nextTag.state &&
      prevTag.count === nextTag.count &&
      prevTag.isHighlighted === nextTag.isHighlighted
    );
  });

  if (isEqual) track('TagsDisplay', 'memo-hit');
  return isEqual;
};

const TagsDisplay = memo(TagsDisplayComponent, tagsDisplayPropsAreEqual);

/**
 * Main TagList component
 */
const TagListComponent = ({
  tags,
  sortable = false,
  onAddTag,
  onToggleTag,
  onDeleteTag,
}: TagListProps) => {
  track('TagList', 'render');

  const [inputValue, setInputValue] = useState('');

  // Check if input would be a duplicate
  const isDuplicate = tags.some(
    (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase(),
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isDuplicate) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, isDuplicate, onAddTag]);

  const handleCancel = useCallback(() => {
    setInputValue('');
  }, []);

  track('TagList', 'render-end');

  return (
    <div className="flex h-full w-full flex-col">
      <TagsDisplay
        tags={tags}
        sortable={sortable}
        onToggleTag={onToggleTag}
        onDeleteTag={onDeleteTag}
      />

      <div className="mt-2">
        <InputTag
          mode="add"
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          placeholder="Add tag..."
          isDuplicate={isDuplicate}
        />
      </div>
    </div>
  );
};

const tagListPropsAreEqual = (prevProps: TagListProps, nextProps: TagListProps): boolean => {
  track('TagList', 'memo-check');

  // Check sortable mode
  if (prevProps.sortable !== nextProps.sortable) {
    return false;
  }

  // Check callback references
  if (
    prevProps.onAddTag !== nextProps.onAddTag ||
    prevProps.onToggleTag !== nextProps.onToggleTag ||
    prevProps.onDeleteTag !== nextProps.onDeleteTag
  ) {
    return false;
  }

  // Check tags array
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  const isEqual = prevProps.tags.every((prevTag, i) => {
    const nextTag = nextProps.tags[i];
    return (
      prevTag.name === nextTag.name &&
      prevTag.state === nextTag.state &&
      prevTag.count === nextTag.count &&
      prevTag.isHighlighted === nextTag.isHighlighted
    );
  });

  if (isEqual) track('TagList', 'memo-hit');
  return isEqual;
};

export const TagList = memo(TagListComponent, tagListPropsAreEqual);
