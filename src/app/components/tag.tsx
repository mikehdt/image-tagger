import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

import { TagInput } from '@/app/components/tag-input';
import { getTagStyles, tagButtonStyles } from '@/app/styles/tag-styles';

import { hasState, TagState } from '../store/assets';

type TagProps = {
  tagName: string;
  tagState: number;
  count: number;
  highlight: boolean;
  fade: boolean;
  isDraggable?: boolean;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  onEditTag?: (oldTagName: string, newTagName: string) => void;
  onEditStateChange?: (isEditing: boolean) => void;
  onEditValueChange?: (value: string) => void;
  isDuplicate?: boolean; // Whether the current edit value already exists
};

const Tag = ({
  tagName,
  tagState,
  count,
  highlight,
  fade,
  isDraggable = false,
  onToggleTag,
  onDeleteTag,
  onEditTag,
  onEditStateChange,
  onEditValueChange,
  isDuplicate = false,
}: TagProps) => {
  // State for managing edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tagName);

  // Define edit-related functions with useCallback to avoid dependency issues
  const handleStartEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(tagName);
      if (onEditStateChange) onEditStateChange(true);
    },
    [tagName, onEditStateChange],
  );

  const handleSaveEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      const trimmedValue = editValue.trim();
      if (trimmedValue && trimmedValue !== tagName && onEditTag) {
        onEditTag(tagName, trimmedValue);
      }
      setIsEditing(false);
      if (onEditStateChange) onEditStateChange(false);
    },
    [editValue, tagName, onEditTag, onEditStateChange],
  );

  const handleCancelEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      setEditValue(tagName);
      setIsEditing(false);
      if (onEditStateChange) onEditStateChange(false);
    },
    [tagName, onEditStateChange],
  );

  // Update edit value when tagName changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(tagName);
    }
  }, [tagName, isEditing]);

  // Get styles from the extracted styling utility
  const styles = getTagStyles(tagState, highlight, fade, isDraggable);
  const handleToggleTag = useCallback(
    (e: SyntheticEvent) => {
      if (!isEditing) onToggleTag(e, tagName);
    },
    [isEditing, onToggleTag, tagName],
  );

  const handleDeleteTag = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation(); // Prevent triggering the parent onClick
      onDeleteTag(e, tagName);
    },
    [onDeleteTag, tagName],
  );

  return isEditing ? (
    <TagInput
      inputValue={editValue}
      onInputChange={(e) => {
        const newValue = e.target.value;
        setEditValue(newValue);
        if (onEditValueChange) {
          onEditValueChange(newValue);
        }
      }}
      onSubmit={handleSaveEdit}
      onCancel={handleCancelEdit}
      placeholder="Edit tag..."
      mode="edit"
      isDuplicate={isDuplicate}
    />
  ) : (
    <div className={styles.tagClass} onClick={handleToggleTag}>
      <span className={styles.countClass}>{count}</span>
      <span className={styles.tagTextClass}>{tagName}</span>
      {hasState(tagState, TagState.TO_DELETE) ? (
        <span className="ml-1 inline-flex w-5 rounded-full p-0.5 text-slate-500 opacity-30">
          <PencilIcon />
        </span>
      ) : (
        <span
          className={tagButtonStyles.editButton}
          onClick={handleStartEdit}
          title="Edit tag"
        >
          <PencilIcon />
        </span>
      )}
      <span
        className={tagButtonStyles.deleteButton}
        onClick={handleDeleteTag}
        title="Delete tag"
      >
        <XMarkIcon />
      </span>
    </div>
  );
};

const MemoizedTag = memo(Tag);

export { MemoizedTag as Tag };
