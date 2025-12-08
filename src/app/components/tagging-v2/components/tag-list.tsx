/**
 * TagList Component v2
 *
 * Phase 4: Supports inline tag editing
 * - TagsDisplay NOT memoized when editing (edit state changes frequently)
 * - Edit state managed here to keep it close to where it's used
 * - Notifies parent when edit completes via onEditTag
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
  onEditTag: (oldName: string, newName: string) => void;
  onDeleteTag: (tagName: string) => void;
};

/**
 * Inner component that renders just the tags
 * NOT memoized - edit state changes cause re-renders anyway
 */
type TagsDisplayProps = {
  tags: TagData[];
  sortable: boolean;
  editingTagName: string | null;
  editValue: string;
  isDuplicateEdit: boolean;
  onToggleTag: (tagName: string) => void;
  onEditTag: (tagName: string) => void;
  onDeleteTag: (tagName: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
};

const TagsDisplayComponent = ({
  tags,
  sortable,
  editingTagName,
  editValue,
  isDuplicateEdit,
  onToggleTag,
  onEditTag,
  onDeleteTag,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: TagsDisplayProps) => {
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
            fade={editingTagName !== null && editingTagName !== tag.name}
            isEditing={editingTagName === tag.name}
            editValue={editValue}
            onToggle={onToggleTag}
            onEdit={onEditTag}
            onDelete={onDeleteTag}
            onEditChange={onEditChange}
            onEditSubmit={onEditSubmit}
            onEditCancel={onEditCancel}
            isDuplicateEdit={isDuplicateEdit}
          />
        ) : (
          <div key={tag.name} className="mr-2 mb-2">
            <Tag
              tagName={tag.name}
              tagState={tag.state}
              count={tag.count}
              isHighlighted={tag.isHighlighted}
              fade={editingTagName !== null && editingTagName !== tag.name}
              onToggle={onToggleTag}
              onEdit={onEditTag}
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

// Memo comparison - skip re-render only when NOT editing
const tagsDisplayPropsAreEqual = (
  prevProps: TagsDisplayProps,
  nextProps: TagsDisplayProps,
): boolean => {
  track('TagsDisplay', 'memo-check');

  // If either state is editing, don't memo (need to update for keystroke/fade changes)
  if (prevProps.editingTagName !== null || nextProps.editingTagName !== null) {
    // But if editing the same tag and only editValue changed, we still need to re-render
    // So just return false to always re-render during edit mode
    return false;
  }

  // Check sortable mode
  if (prevProps.sortable !== nextProps.sortable) {
    return false;
  }

  // Handler references should be stable from useCallback
  if (
    prevProps.onToggleTag !== nextProps.onToggleTag ||
    prevProps.onEditTag !== nextProps.onEditTag ||
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
  onEditTag,
  onDeleteTag,
}: TagListProps) => {
  track('TagList', 'render');

  // Add new tag input state
  const [inputValue, setInputValue] = useState('');

  // Edit tag state
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Check if add input would be a duplicate
  const isDuplicateAdd = tags.some(
    (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase(),
  );

  // Check if edit input would be a duplicate (excluding the tag being edited)
  const isDuplicateEdit =
    editValue.trim().toLowerCase() !== editingTagName?.toLowerCase() &&
    tags.some((tag) => tag.name.toLowerCase() === editValue.trim().toLowerCase());

  // Add input handlers
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && !isDuplicateAdd) {
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, isDuplicateAdd, onAddTag]);

  const handleCancel = useCallback(() => {
    setInputValue('');
  }, []);

  // Edit handlers
  const handleStartEdit = useCallback((tagName: string) => {
    setEditingTagName(tagName);
    setEditValue(tagName);
  }, []);

  const handleEditChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (editingTagName && editValue.trim() && !isDuplicateEdit) {
      if (editValue.trim() !== editingTagName) {
        onEditTag(editingTagName, editValue.trim());
      }
      setEditingTagName(null);
      setEditValue('');
    }
  }, [editingTagName, editValue, isDuplicateEdit, onEditTag]);

  const handleEditCancel = useCallback(() => {
    setEditingTagName(null);
    setEditValue('');
  }, []);

  track('TagList', 'render-end');

  return (
    <div className="flex h-full w-full flex-col">
      <TagsDisplay
        tags={tags}
        sortable={sortable}
        editingTagName={editingTagName}
        editValue={editValue}
        isDuplicateEdit={isDuplicateEdit}
        onToggleTag={onToggleTag}
        onEditTag={handleStartEdit}
        onDeleteTag={onDeleteTag}
        onEditChange={handleEditChange}
        onEditSubmit={handleEditSubmit}
        onEditCancel={handleEditCancel}
      />

      <div className="mt-2">
        <InputTag
          mode="add"
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          placeholder="Add tag..."
          isDuplicate={isDuplicateAdd}
          disabled={editingTagName !== null}
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
    prevProps.onEditTag !== nextProps.onEditTag ||
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
