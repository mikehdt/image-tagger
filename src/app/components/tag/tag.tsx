import { MinusIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

import { TagInput } from '@/app/components/tag/tag-input';

import { hasState, TagState } from '../../store/assets';
import { getTagStyles, tagButtonStyles } from './tag-styles';

type TagProps = {
  tagName: string;
  tagState: number;
  count: number;
  highlight: boolean;
  fade: boolean;
  isDraggable?: boolean;
  nonInteractive?: boolean; // Whether the tag should be non-interactive regardless of fade state
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
  nonInteractive = false,
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

      // Don't allow editing of tags marked for deletion
      if (hasState(tagState, TagState.TO_DELETE)) {
        return;
      }

      setIsEditing(true);
      setEditValue(tagName);
      if (onEditStateChange) onEditStateChange(true);
    },
    [tagName, onEditStateChange, tagState],
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
      setEditValue(tagName); // Reset to original value
      setIsEditing(false);

      // The order here matters - first notify about edit state change
      if (onEditStateChange) onEditStateChange(false);

      // Then clear the edit value - this passes up through SortableTag to Asset
      if (onEditValueChange) onEditValueChange('');
    },
    [tagName, onEditStateChange, onEditValueChange],
  );

  // Update edit value when tagName changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(tagName);
    }
  }, [tagName, isEditing]);

  // Get styles from the extracted styling utility
  const styles = getTagStyles(
    tagState,
    highlight,
    fade,
    isDraggable,
    nonInteractive,
  );
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
    <span className="mb-2 flex">
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
        nonInteractive={nonInteractive}
      />
    </span>
  ) : (
    <div className={styles.tagClass} onClick={handleToggleTag}>
      <span className={styles.countClass}>{count}</span>
      <span className={styles.tagTextClass}>{tagName}</span>
      {nonInteractive ? (
        <>
          {/* Non-interactive state due to editing another tag */}
          <span
            className={`${tagButtonStyles.editButton} opacity-20`}
            tabIndex={-1}
          >
            <PencilIcon />
          </span>

          <span
            className={`${tagButtonStyles.deleteButton} opacity-20`}
            tabIndex={-1}
          >
            <MinusIcon />
          </span>
        </>
      ) : (
        <>
          {/* Interactive state, but with special styling for TO_DELETE */}
          <span
            className={`${tagButtonStyles.editButton} ${
              hasState(tagState, TagState.TO_DELETE)
                ? 'cursor-not-allowed opacity-20'
                : 'hover:bg-blue-500 hover:text-white'
            }`}
            onClick={handleStartEdit}
            title={
              hasState(tagState, TagState.TO_DELETE)
                ? "Can't edit a tag marked for deletion"
                : 'Edit tag'
            }
            tabIndex={hasState(tagState, TagState.TO_DELETE) ? -1 : 0}
          >
            <PencilIcon />
          </span>

          <span
            className={`${tagButtonStyles.deleteButton} hover:bg-pink-500 hover:text-white ${hasState(tagState, TagState.TO_DELETE) ? 'text-pink-500' : ''}`}
            onClick={handleDeleteTag}
            title={
              hasState(tagState, TagState.TO_DELETE)
                ? 'Unmark tag for deletion'
                : 'Mark tag for deletion'
            }
            tabIndex={0}
          >
            {hasState(tagState, TagState.TO_DELETE) ? (
              <PlusIcon />
            ) : (
              <MinusIcon />
            )}
          </span>
        </>
      )}
    </div>
  );
};

const MemoizedTag = memo(Tag);

export { MemoizedTag as Tag };
