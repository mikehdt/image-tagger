/**
 * TagList Component v2
 *
 * Phase 1: Static rendering with memoization
 * - Renders list of Tag components
 * - Renders InputTag in add mode
 * - No DnD, no editing
 */
import { memo, useCallback, useState } from 'react';

import { track } from '@/app/utils/render-tracker';

import { InputTag } from './input-tag';
import { Tag } from './tag';

type TagData = {
  name: string;
  state: number;
  count: number;
  isHighlighted: boolean;
};

type TagListProps = {
  tags: TagData[];
  onAddTag: (tagName: string) => void;
};

/**
 * Inner component that renders just the tags
 * Memoized separately to prevent re-renders when only input state changes
 */
type TagsDisplayProps = {
  tags: TagData[];
};

const TagsDisplayComponent = ({ tags }: TagsDisplayProps) => {
  track('TagsDisplay', 'render');

  const result = (
    <div className="flex flex-wrap">
      {tags.map((tag) => (
        <div key={tag.name} className="mr-2 mb-2">
          <Tag
            tagName={tag.name}
            tagState={tag.state}
            count={tag.count}
            isHighlighted={tag.isHighlighted}
            fade={false}
          />
        </div>
      ))}
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

  // Quick length check
  if (prevProps.tags.length !== nextProps.tags.length) {
    return false;
  }

  // Deep comparison of tag data
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
const TagListComponent = ({ tags, onAddTag }: TagListProps) => {
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
      <TagsDisplay tags={tags} />

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

  // Check callback reference
  if (prevProps.onAddTag !== nextProps.onAddTag) {
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
