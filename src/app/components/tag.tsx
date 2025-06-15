import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  KeyboardEvent,
  memo,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { getTagStyles, tagButtonStyles } from '@/app/styles/tag-styles';

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
}: TagProps) => {
  // State for managing edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tagName);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveEdit = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== tagName && onEditTag) {
      onEditTag(tagName, trimmedValue);
    }
    setIsEditing(false);
    if (onEditStateChange) onEditStateChange(false);
  }, [editValue, tagName, onEditTag, onEditStateChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(tagName);
    setIsEditing(false);
    if (onEditStateChange) onEditStateChange(false);
  }, [tagName, onEditStateChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  // Update edit value when tagName changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(tagName);
    }
  }, [tagName, isEditing]);

  // Setup event listener for click outside when editing
  useEffect(() => {
    if (isEditing) {
      // Create handler inside the effect to use the current handleCancelEdit
      const handleClickOutside = (event: MouseEvent) => {
        // Ignore the current tag (probably need a better way than two parents)
        if (
          inputRef.current &&
          !inputRef.current.parentElement?.parentElement?.contains(
            event.target as Node,
          )
        ) {
          handleCancelEdit();
        }
      };

      // Focus input element
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 10);

      // Add event listener
      document.addEventListener('mousedown', handleClickOutside);

      // Cleanup
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing, handleCancelEdit]);

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

  return (
    <div className={styles.tagClass} onClick={handleToggleTag}>
      {isEditing ? (
        <div className="z-10 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={tagButtonStyles.inputField}
            size={Math.max(tagName.length, 12)}
            autoFocus
          />
          <span
            className={tagButtonStyles.saveButton}
            onClick={(e) => {
              console.log('click save');
              e.stopPropagation();
              handleSaveEdit();
            }}
            title="Save tag"
          >
            <CheckIcon />
          </span>
          <span
            className={tagButtonStyles.cancelButton}
            onClick={(e) => {
              e.stopPropagation();
              handleCancelEdit();
            }}
            title="Cancel"
          >
            <XMarkIcon />
          </span>
        </div>
      ) : (
        <>
          <span className={styles.countClass}>{count}</span>
          <span className={styles.tagTextClass}>{tagName}</span>
          <span
            className={tagButtonStyles.editButton}
            onClick={handleStartEdit}
            title="Edit tag"
          >
            <PencilIcon />
          </span>
          <span
            className={tagButtonStyles.deleteButton}
            onClick={handleDeleteTag}
            title="Delete tag"
          >
            <XMarkIcon />
          </span>
        </>
      )}
    </div>
  );
};

const MemoizedTag = memo(Tag);

export { MemoizedTag as Tag };
