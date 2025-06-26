import { MinusIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { memo, type SyntheticEvent, useCallback } from 'react';

import { hasState, TagState } from '../../../store/assets';
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
  onStartEdit?: (e: SyntheticEvent) => void;
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
  onStartEdit,
}: TagProps) => {
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
      onToggleTag(e, tagName);
    },
    [onToggleTag, tagName],
  );

  const handleDeleteTag = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation(); // Prevent triggering the parent onClick
      onDeleteTag(e, tagName);
    },
    [onDeleteTag, tagName],
  );

  const handleStartEdit = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();

      // Don't allow editing of tags marked for deletion
      if (hasState(tagState, TagState.TO_DELETE)) {
        return;
      }

      if (onStartEdit) {
        onStartEdit(e);
      }
    },
    [tagState, onStartEdit],
  );

  return (
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

// Memoize the component for better performance
const MemoizedTag = memo(Tag);

export { MemoizedTag as Tag };
